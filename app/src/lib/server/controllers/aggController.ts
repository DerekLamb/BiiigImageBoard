import { UnifiedModel } from "../models/unifiedModel";

class AggregateController {
    constructor() {}
    
    async getAggregateData(params: {page: number, length: number, group?: string, sort?: string}) {
        const length = params.length;
        const skip = (params.page - 1) * length;
        const sort = params.sort;
        const group = params.group || '';
        //const filter =  search ? { tags: { $regex: search, $options: 'i' }} : {};
    
        const images = await ImageModel.findImages( length, skip, sort);
        const documents = await UnifiedModel.getChildren({group});
        return images
        
    }
}