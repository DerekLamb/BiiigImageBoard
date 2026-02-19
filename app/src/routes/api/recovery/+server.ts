import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recoveryService, type RecoveryOptions } from '$lib/server/services/recoveryService';

/**
 * POST /api/recovery
 * 
 * Triggers the image recovery process to scan the images directory
 * and add any files not already in the database.
 * 
 * Request body (optional):
 * {
 *   dryRun?: boolean,        // If true, only report what would be done
 *   generateThumbnails?: boolean, // If false, skip thumbnail generation
 *   imagesDir?: string       // Custom images directory path
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   added: string[],         // List of files added to DB
 *   skipped: string[],       // List of files already in DB
 *   errors: { file: string, error: string }[],
 *   summary: {
 *     totalScanned: number,
 *     addedCount: number,
 *     skippedCount: number,
 *     errorCount: number
 *   }
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
    try {
        // Parse optional request body
        let options: RecoveryOptions = {
            imagesDir: 'images/',
            generateThumbnails: true,
            dryRun: false
        };

        try {
            const body = await request.json();
            if (body && typeof body === 'object') {
                if (typeof body.dryRun === 'boolean') {
                    options.dryRun = body.dryRun;
                }
                if (typeof body.generateThumbnails === 'boolean') {
                    options.generateThumbnails = body.generateThumbnails;
                }
                if (typeof body.imagesDir === 'string') {
                    options.imagesDir = body.imagesDir;
                }
            }
        } catch {
            // No body or invalid JSON, use defaults
        }

        // Run recovery
        const result = await recoveryService.recoverImages(options);

        return json(result, { status: result.success ? 200 : 500 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return json({
            success: false,
            added: [],
            skipped: [],
            errors: [{ file: 'request', error: errorMessage }],
            summary: {
                totalScanned: 0,
                addedCount: 0,
                skippedCount: 0,
                errorCount: 1
            }
        }, { status: 500 });
    }
};

/**
 * GET /api/recovery
 * 
 * Returns information about the recovery endpoint.
 */
export const GET: RequestHandler = async () => {
    return json({
        endpoint: '/api/recovery',
        method: 'POST',
        description: 'Scan images directory and add files not in database',
        options: {
            dryRun: {
                type: 'boolean',
                default: false,
                description: 'If true, only report what would be done without making changes'
            },
            generateThumbnails: {
                type: 'boolean',
                default: true,
                description: 'If false, skip thumbnail generation for recovered images'
            },
            imagesDir: {
                type: 'string',
                default: 'images/',
                description: 'Custom images directory path'
            }
        }
    });
};
