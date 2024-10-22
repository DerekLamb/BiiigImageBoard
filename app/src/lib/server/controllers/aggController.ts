import { UnifiedModel } from "../models/unifiedModel";

class AggregateController {
    constructor() {}
    
    async getAggregateData(params: {page: number, length: number, group?: string}) {
        const length = params.length;
        const skip = (params.page - 1) * length;
        const group = params.group || '';
        //const filter =  search ? { tags: { $regex: search, $options: 'i' }} : {};
    
        const documents = await UnifiedModel.getNodeChildren(group, params.page, params.length);
        return documents
        
    }
}

export const aggController = new AggregateController();