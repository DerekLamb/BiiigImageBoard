import { ObjectId, type Sort } from 'mongodb';
import { imageCollection, groupCollection, } from '$lib/db.server'
import type { AppGroup, GroupDoc, ImageDoc } from '$lib/types/DocTypes';
import { databaseDocUtil as dbUtil} from "$lib/server/utility/dbUtil";
import { createMongoCollection  } from '$lib/server/collectionLayer';

const groupColl = createMongoCollection(groupCollection);
const imageColl = createMongoCollection(imageCollection);

export const GroupModel = { 
    async findGroups(filter = {}, limit = 10, skip = 0, sort: Sort = { uploadDate: -1 }) {
        const documents = await groupColl.findPage(filter, limit, skip, sort);
        return documents as AppGroup[];
    },

    async getGroupById(id: string) {
        const document = await groupColl.findOne({ _id:id }) as AppGroup;
        return document;
    },

    async getGroupByName(name: string) {
        const document = await groupColl.findOne({ name: name })
        return document
    },

    async getAllGroups() {
        const documents = await groupColl.find();
        return documents
    },

    async createGroup(groupData: Partial<AppGroup>) {
        const results = await groupColl.insertOne(groupData); 
        return {
            success: results.acknowledged === true,
            id: results.insertedId?.toString(),
        }
    },

    async addImageToGroup(groupId: string, imageId: string) {
        const parentGroup = await GroupModel.getGroupById(groupId);
        const childImages = await imageCollection.find({ _id: { $in: parentGroup.children.map( e => new ObjectId(e)) }}).toArray(); // TODO clean this up

        const latestDate = childImages.reduce((latest, image) => image.uploadDate > latest ? image.uploadDate : latest, "0");

        const results = await groupColl.updateOne(
                { _id: new ObjectId(groupId) }, 
                {   $set: { uploadDate: latestDate },
                    $push: { children: new ObjectId(imageId) }
                }
            );

        return { 
            success: results !== null,
            document: results,
            // I'm mainly just adding a image to a group, what would I want besides this?
        }

    },

    async updateGroup(id: string, updates: Partial<AppGroup>) { // Needs more attention
        const results =  await groupColl.updateOne({ _id: id }, { $set: updates });

        return { 
            success: results !== null,
            document: results,
        }
    },

    async updateGroupThumbnail(groupId: string) {
        const group = await GroupModel.getGroupById(groupId);
        
        if (!group || !group.children || group.children.length === 0) {
            return {
                success: false,
                message: "Group has no children images"
            };
        }

        let childIDs = group.children.map( id => new ObjectId( id ))

        let childImageDocs = await imageCollection.find({_id: { $in: childIDs } }).toArray();

        childImageDocs = childImageDocs.slice(0,3)
        
        let childThumbnails = childImageDocs.map( a => a.thumbnailPath)

        
        if (childThumbnails.length === 0) { // may convert to try catch, could be 
            return {
                success: false,
                message: "No group child thumbnails found"
            };
        }

        // Update the group's thumbnailPath
        const results = await groupColl.updateOne(
            { _id: new ObjectId(groupId) },
            { $set: { thumbnailPaths: childThumbnails } }
        );

        return {
            success: results !== null,
            thumbnails: childThumbnails,
            document: results
        };
    },

    async deleteGroup(id: string) {
        const results = await groupColl.deleteOne({ _id: id });

        return {
            success: results.acknowledged === true,
            id: id,
            count: results.deletedCount
        }
    },

    async getGroupCount() { //TODO need to actually count documents at certain levels to have accurate pagination
        return await groupColl.estimateDocumentCount();
    },
}