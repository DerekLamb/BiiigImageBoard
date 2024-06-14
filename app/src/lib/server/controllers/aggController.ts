import { AggregateModel } from "../models/aggregateModel";

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

    async getOneAggregated(id: string) {
        AggregateModel.findAggregated({ _id: id });
}

export const aggregateController = new AggregateController();