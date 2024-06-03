
import "../types";

function toClient(mongodbDocument) : AppImageData | AppGroupData { 
    switch(mongodbDocument.type) {
        case "image":
            return { ...mongodbDocument, _id: mongodbDocument._id.toString() } as AppImageData;
        case "group":
            let children = mongodbDocument.children.map((child) => { return child.toString() });
            return { ...mongodbDocument, _id: mongodbDocument._id.toString(), children: children } as AppGroupData;
        default:
            throw new Error("Error not found");
    }
}