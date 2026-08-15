/**
 * Dedup Service
 * Core service for perceptual similarity detection, grouping, and deletion.
 *
 * All scanning methods accept optional dateFrom/dateTo parameters to scope
 * the comparison to a specific upload date range, reducing the working set.
 */

import { ImageModel, type AppImageData } from '$lib/server/models/imageModel';
import { localImageStorage } from '$lib/server/services/imageStorageAdapter/localImageStorage';
import { hammingDistance, DEFAULT_SIMILARITY_THRESHOLD } from '$lib/server/services/perceptualHash';

export interface DateRange {
    dateFrom?: string;
    dateTo?: string;
}

export interface HashRecord {
    _id: string;
    dhash?: string;
    uploadDate: string;
    thumbnailPath?: string;
    originalName: string;
    imagePath: string;
}

export interface SimilarGroup {
    /** Images in this similarity group, sorted by best quality first (by upload date) */
    images: HashRecord[];
    /** Maximum hamming distance between any pair in the group */
    maxDistance: number;
    /** Minimum hamming distance between any pair in the group */
    minDistance: number;
}

export interface GroupDeleteResult {
    success: boolean;
    message: string;
    deletedCount: number;
}

class DedupService {
    /**
     * Build a date-range filter for MongoDB queries.
     */
    private buildDateFilter(dateRange?: DateRange): any {
        const filter: any = {
            dhash: { $exists: true, $nin: [null, ''] }
        };
        if (dateRange?.dateFrom || dateRange?.dateTo) {
            filter.uploadDate = {};
            if (dateRange.dateFrom) filter.uploadDate.$gte = dateRange.dateFrom;
            if (dateRange.dateTo) filter.uploadDate.$lte = dateRange.dateTo;
        }
        return filter;
    }

    /**
     * Find all groups of similar images within the optional date range.
     *
     * Uses Union-Find to group connected components where hamming distance
     * is within the threshold. O(n²) pairwise comparison — feasible for up to ~50K images.
     * For larger collections, the date range filter reduces the working set.
     */
    async findSimilarGroups(
        threshold: number = DEFAULT_SIMILARITY_THRESHOLD,
        dateRange?: DateRange
    ): Promise<SimilarGroup[]> {
        const filter = this.buildDateFilter(dateRange);
        const hashes = await ImageModel.getAllHashes(filter);
        const validHashes: HashRecord[] = hashes.filter(h => h.dhash) as HashRecord[];

        if (validHashes.length === 0) {
            return [];
        }

        // Union-Find structure
        const parent: number[] = validHashes.map((_, i) => i);
        const rank: number[] = new Array(validHashes.length).fill(0);

        function find(x: number): number {
            if (parent[x] !== x) parent[x] = find(parent[x]);
            return parent[x];
        }

        function union(a: number, b: number): void {
            const ra = find(a), rb = find(b);
            if (ra === rb) return;
            if (rank[ra] < rank[rb]) {
                parent[ra] = rb;
            } else if (rank[ra] > rank[rb]) {
                parent[rb] = ra;
            } else {
                parent[rb] = ra;
                rank[ra]++;
            }
        }

        // Pairwise comparison with Union-Find
        for (let i = 0; i < validHashes.length; i++) {
            for (let j = i + 1; j < validHashes.length; j++) {
                const dist = hammingDistance(validHashes[i].dhash!, validHashes[j].dhash!);
                if (dist <= threshold) {
                    union(i, j);
                }
            }
            // Progress tracking for large sets — yield every 500 rows
            if (i > 0 && i % 500 === 0) {
                // Allow event loop to breathe by not blocking too long
                await new Promise(resolve => setImmediate(resolve));
            }
        }

        // Group by component root
        const groups = new Map<number, HashRecord[]>();
        for (let i = 0; i < validHashes.length; i++) {
            const root = find(i);
            if (!groups.has(root)) groups.set(root, []);
            groups.get(root)!.push(validHashes[i]);
        }

        // Convert to SimilarGroup[], filtering out single-image "groups"
        const result: SimilarGroup[] = [];
        for (const [, images] of groups) {
            if (images.length < 2) continue; // skip singletons

            // Compute min/max distance within group
            let minDist = Infinity;
            let maxDist = 0;
            for (let i = 0; i < images.length; i++) {
                for (let j = i + 1; j < images.length; j++) {
                    const dist = hammingDistance(images[i].dhash!, images[j].dhash!);
                    if (dist < minDist) minDist = dist;
                    if (dist > maxDist) maxDist = dist;
                }
            }

            result.push({
                images: images.sort((a, b) => b.uploadDate.localeCompare(a.uploadDate)),
                minDistance: minDist === Infinity ? 0 : minDist,
                maxDistance: maxDist
            });
        }

        // Sort groups by size (largest first), then by max similarity
        result.sort((a, b) => b.images.length - a.images.length || a.maxDistance - b.maxDistance);

        return result;
    }

    /**
     * Find images visually similar to a specific image, optionally scoped by date range.
     */
    async findSimilarToImage(
        imageId: string,
        threshold: number = DEFAULT_SIMILARITY_THRESHOLD,
        dateRange?: DateRange
    ): Promise<HashRecord[]> {
        const target = await ImageModel.getImageById(imageId);
        if (!target?.dhash) return [];

        const filter = this.buildDateFilter(dateRange);
        const allHashes = await ImageModel.getAllHashes(filter);
        const validHashes: HashRecord[] = allHashes.filter(h => h.dhash && h._id !== imageId) as HashRecord[];

        const similar: { record: HashRecord; distance: number }[] = [];
        for (const record of validHashes) {
            const dist = hammingDistance(target.dhash!, record.dhash!);
            if (dist <= threshold) {
                similar.push({ record, distance: dist });
            }
        }

        return similar
            .sort((a, b) => a.distance - b.distance)
            .map(s => s.record);
    }

    /**
     * Delete selected images from a similarity group.
     * Removes both the database records and the associated files.
     */
    async deleteFromGroup(imageIds: string[]): Promise<GroupDeleteResult> {
        try {
            // Get full image data for all images
            const images = await ImageModel.getImagesByIds(imageIds);

            // Delete from database
            const dbResult = await ImageModel.deleteManyImages(imageIds);

            // Delete files from disk (best-effort)
            for (const image of images) {
                try {
                    await localImageStorage.deleteImage(image.imagePath);
                    if (image.thumbnailPath) {
                        await localImageStorage.deleteThumbnail(image.thumbnailPath);
                    }
                } catch (err) {
                    console.warn(`Failed to delete files for image ${image._id}: ${err}`);
                }
            }

            return {
                success: dbResult.success,
                message: `Deleted ${dbResult.deleted} of ${imageIds.length} images`,
                deletedCount: dbResult.deleted
            };
        } catch (error: any) {
            console.error('Error deleting from group:', error);
            return {
                success: false,
                message: `Failed to delete images: ${error.message}`,
                deletedCount: 0
            };
        }
    }

    /**
     * Get stats about the image collection relevant to dedup.
     */
    async getStats(dateRange?: DateRange): Promise<{
        totalImages: number;
        imagesWithDhash: number;
        imagesWithoutDhash: number;
    }> {
        const baseFilter: any = {};
        if (dateRange?.dateFrom || dateRange?.dateTo) {
            baseFilter.uploadDate = {};
            if (dateRange.dateFrom) baseFilter.uploadDate.$gte = dateRange.dateFrom;
            if (dateRange.dateTo) baseFilter.uploadDate.$lte = dateRange.dateTo;
        }

        const totalFilter = { ...baseFilter };
        const withDhashFilter = { ...baseFilter, dhash: { $exists: true, $nin: [null, ''] } };
        const withoutDhashFilter = {
            ...baseFilter,
            $or: [
                { dhash: { $exists: false } },
                { dhash: null },
                { dhash: '' }
            ]
        };

        const totalImages = await ImageModel.countFilteredImages(totalFilter);
        const imagesWithDhash = await ImageModel.countFilteredImages(withDhashFilter);
        const imagesWithoutDhash = await ImageModel.countFilteredImages(withoutDhashFilter);

        return {
            totalImages,
            imagesWithDhash,
            imagesWithoutDhash
        };
    }
}

export const dedupService = new DedupService();
