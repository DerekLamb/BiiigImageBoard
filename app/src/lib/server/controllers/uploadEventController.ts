import { imageCollection } from "$lib/db.server";
import type { AppImageData } from "$lib/server/models/imageModel";
import type { UploadEvent } from "$lib/types/DocTypes";
import { databaseDocUtil as dbUtil } from "$lib/server/utility/dbUtil";

interface UploadEventParams {
    thresholdMs: number;
    scanLimit?: number;
    skip?: number;
}

interface EventImagesParams {
    eventStartDate: string;
    eventEndDate: string;
    thresholdMs: number;
    page?: number;
    length?: number;
}

interface UploadEventResult {
    events: UploadEvent[];
    totalEvents: number;
    totalImagesScanned: number;
}

class UploadEventController {

    async getUploadEvents(params: UploadEventParams): Promise<UploadEventResult> {
        const { thresholdMs } = params;
        const scanLimit = params.scanLimit || 10000;
        const skip = params.skip || 0;

        const images = await imageCollection.find(
            {},
            {
                sort: { uploadDate: -1 },
                limit: scanLimit + skip,
                projection: {
                    _id: 1,
                    uploadDate: 1,
                    thumbnailPath: 1,
                    imagePath: 1,
                    type: 1
                }
            }
        ).toArray();

        const processed = images.map(dbUtil.convertIdToString) as AppImageData[];

        const slice = processed.slice(skip, skip + scanLimit);

        const events = this.groupIntoEvents(slice, thresholdMs);

        return {
            events,
            totalEvents: events.length,
            totalImagesScanned: slice.length,
        };
    }

    async getEventImages(params: EventImagesParams): Promise<{ images: AppImageData[]; totalCount: number }> {
        const { eventStartDate, eventEndDate, thresholdMs } = params;
        const page = params.page || 1;
        const length = params.length || 24;
        const skip = (page - 1) * length;

        const startTs = parseInt(eventStartDate);
        const endTs = parseInt(eventEndDate);

        const query = {
            uploadDate: {
                $gte: startTs.toString(),
                $lte: endTs.toString()
            }
        };

        const cursor = imageCollection.find(query)
            .sort({ uploadDate: -1 })
            .skip(skip)
            .limit(length);

        const totalCount = await imageCollection.countDocuments(query);
        const images = await cursor.toArray();

        return {
            images: images.map(dbUtil.convertIdToString) as AppImageData[],
            totalCount
        };
    }

    async getEventByStartDate(startDate: string, thresholdMs: number): Promise<UploadEvent | null> {
        const images = await imageCollection.find(
            {},
            {
                sort: { uploadDate: -1 },
                limit: 10000,
                projection: {
                    _id: 1,
                    uploadDate: 1,
                    thumbnailPath: 1,
                    imagePath: 1,
                    type: 1
                }
            }
        ).toArray();

        const processed = images.map(dbUtil.convertIdToString) as AppImageData[];
        const events = this.groupIntoEvents(processed, thresholdMs);

        return events.find(e => e.startDate === startDate) || null;
    }

    private groupIntoEvents(images: AppImageData[], thresholdMs: number): UploadEvent[] {
        if (images.length === 0) return [];

        const events: UploadEvent[] = [];
        let currentEvent: UploadEvent | null = null;
        let lastTimestamp: number | null = null;

        for (const img of images) {
            const ts = parseInt(img.uploadDate);

            if (currentEvent === null) {
                currentEvent = {
                    _id: `event_${ts}`,
                    type: 'uploadEvent',
                    startDate: img.uploadDate,
                    endDate: img.uploadDate,
                    imageCount: 1,
                    imageIds: [img._id],
                    thumbnailPaths: img.thumbnailPath ? [img.thumbnailPath] : [],
                };
                lastTimestamp = ts;
                continue;
            }

            if (lastTimestamp !== null && Math.abs(lastTimestamp - ts) <= thresholdMs) {
                currentEvent.imageIds.push(img._id);
                currentEvent.imageCount = currentEvent.imageIds.length;
                if (currentEvent.thumbnailPaths.length < 4 && img.thumbnailPath) {
                    currentEvent.thumbnailPaths.push(img.thumbnailPath);
                }
                if (ts < parseInt(currentEvent.startDate)) {
                    currentEvent.startDate = img.uploadDate;
                }
                lastTimestamp = ts;
            } else {
                events.push(currentEvent);

                currentEvent = {
                    _id: `event_${ts}`,
                    type: 'uploadEvent',
                    startDate: img.uploadDate,
                    endDate: img.uploadDate,
                    imageCount: 1,
                    imageIds: [img._id],
                    thumbnailPaths: img.thumbnailPath ? [img.thumbnailPath] : [],
                };
                lastTimestamp = ts;
            }
        }

        if (currentEvent !== null) {
            events.push(currentEvent);
        }

        return events;
    }
}

export const uploadEventController = new UploadEventController();
