import { AggregateModel } from "../models/aggregateModel";
import { ObjectId } from "mongodb";
import type { AppGroupData, AppImageData } from "../types";
class AggregateController {
    constructor() {}
    
    async getAggregated(params: {page: number, length: number, group?: string, sort?: string}) {
        const length = params.length;
        const skip = (params.page - 1) * length;
        const sort = params.sort;
        const group = params.group || '';
        const filter =  group ? { group: { $regex: group, $options: 'i' }} : {};

        let documents = await AggregateModel.findAggregated(filter, length, skip, sort);
        return documents
        
    }

    async getOneAggregated(id: string) : Promise<AppGroupData | AppImageData | null> {
        let objId = new ObjectId(id);
        let documents = await AggregateModel.findAggregated({ _id: objId }, 1);
        let document = documents ? documents[0] : null;
        return document;
    }
}

export const aggregateController = new AggregateController();