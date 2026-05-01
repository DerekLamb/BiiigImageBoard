import { ImageModel } from "$lib/server/models/imageModel";
import { GroupModel } from "$lib/server/models/groupModel";
import { error, type RequestEvent } from "@sveltejs/kit";

export interface BatchOperationRequest {
    operation: 'favorite' | 'delete' | 'groupNew' | 'groupAdd';
    imageIds: string[];
    groupName?: string;
    groupId?: string;
}

export class BatchService {
    private readonly imageModel: typeof ImageModel;
    private readonly groupModel: typeof GroupModel;

    constructor() {
        this.imageModel = ImageModel;
        this.groupModel = GroupModel;
    }

    async handleBatchOperation(request: BatchOperationRequest): Promise<{ success: boolean; message?: string }> {
        switch (request.operation) {
            case 'favorite':
                return await this.toggleFavorite(request.imageIds);
            case 'delete':
                return await this.deleteImages(request.imageIds);
            case 'groupNew':
                return await this.createGroup(request.imageIds, request.groupName);
            case 'groupAdd':
                return await this.addImagesToGroup(request.groupId!, request.imageIds);
            default:
                throw error(400, `Unknown operation: ${request.operation}`);
        }
    }

    async toggleFavorite(imageIds: string[]): Promise<{ success: boolean; message?: string }> {
        try {
            await this.imageModel.updateManyImages(imageIds, { favorite: ['favorited'] });
            return { success: true, message: `Marked ${imageIds.length} images as favorite` };
        } catch (err) {
            console.error('Error toggling favorite:', err);
            return { success: false, message: 'Failed to toggle favorite status' };
        }
    }

    async deleteImages(imageIds: string[]): Promise<{ success: boolean; message?: string }> {
        try {
            const result = await this.imageModel.deleteManyImages(imageIds);
            return {
                success: result.success,
                message: result.deleted === imageIds.length
                    ? `Deleted ${imageIds.length} images`
                    : `Deleted ${result.deleted} of ${imageIds.length} images`
            };
        } catch (err) {
            console.error('Error deleting images:', err);
            return { success: false, message: 'Failed to delete images' };
        }
    }

    async createGroup(imageIds: string[], groupName?: string): Promise<{ success: boolean; message?: string; groupId?: string }> {
        try {
            const name = groupName || `Group ${new Date().toLocaleDateString()}`;
            
            const groupData = {
                name: name,
                uploadDate: new Date().toISOString(),
                children: imageIds,
                groups: [],
                groupType: 'default',
                groupTags: []
            };

            const result = await this.groupModel.createGroup(groupData);
            
            if (result.success && result.id) {
                return { 
                    success: true, 
                    message: `Created group "${name}" with ${imageIds.length} images`,
                    groupId: result.id 
                };
            }
            
            return { success: false, message: 'Failed to create group' };
        } catch (err) {
            console.error('Error creating group:', err);
            return { success: false, message: 'Failed to create group' };
        }
    }

    async addImagesToGroup(groupId: string, imageIds: string[]): Promise<{ success: boolean; message?: string }> {
        try {
            const group = await this.groupModel.getGroupById(groupId);
            
            if (!group) {
                throw error(404, 'Group not found');
            }

            // Filter out images that are already in the group
            const existingChildren = group.children || [];
            const newImageIds = imageIds.filter(id => !existingChildren.includes(id));
            
            if (newImageIds.length === 0) {
                return {
                    success: true,
                    message: `All images are already in group "${group.name}"`
                };
            }

            // Add each image to the group
            const addPromises = newImageIds.map(id =>
                this.groupModel.addImageToGroup(groupId, id)
            );
            
            await Promise.all(addPromises);
            
            return {
                success: true,
                message: `Added ${newImageIds.length} images to group "${group.name}"`
            };
        } catch (err) {
            console.error('Error adding images to group:', err);
            return { success: false, message: 'Failed to add images to group' };
        }
    }
}