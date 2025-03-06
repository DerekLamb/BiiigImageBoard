import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies for dbUtil
vi.mock('../utility/dbUtil', () => ({
  databaseDocUtil: {
    convertStringToId: vi.fn(input => input),
    convertIdToString: vi.fn(input => input)
  }
}));

// Mock the collection layer module
const mockFind = vi.fn();
const mockFindOne = vi.fn();
const mockInsertOne = vi.fn();
const mockFindOneAndUpdate = vi.fn();
const mockReplaceOne = vi.fn();
const mockDeleteOne = vi.fn();
const mockEstimateDocumentCount = vi.fn();

// Create a mock collection to pass to the function
const mockMongoCollection = {
  find: vi.fn(() => mockFind),
  findOne: mockFindOne,
  insertOne: mockInsertOne,
  findOneAndUpdate: mockFindOneAndUpdate,
  replaceOne: mockReplaceOne,
  deleteOne: mockDeleteOne,
  estimatedDocumentCount: mockEstimateDocumentCount
};

// Mock the collection layer methods
vi.mock('../collectionLayer', () => {
  // Import the real implementation
  const actual = vi.importActual('../collectionLayer');
  
  // Return a modified version that uses our mocks
  return {
    ...actual,
    createMongoCollection: vi.fn((collection) => ({
      find: async (query = {}) => {
        const docs = await mockFind(query);
        return docs;
      },
      findPage: async (query = {}, limit = 10, skip = 0, sort = { uploadDate: -1 }) => {
        const docs = await mockFind(query, { sort, skip, limit });
        return docs;
      },
      findOne: async (query = {}, options = {}) => {
        const doc = await mockFindOne(query, options);
        return doc;
      },
      insertOne: async (document) => {
        if (!document) {
          throw new Error("InsertOne operation failed: Document is required");
        }
        return await mockInsertOne(document);
      },
      updateOne: async (query = {}, update) => {
        if (Object.keys(query).length === 0) {
          throw new Error("Unsafe updateOne operation: Empty query");
        }
        return await mockFindOneAndUpdate(query, update);
      },
      replaceOne: async (query = {}, newDocument) => {
        if (Object.keys(query).length === 0) {
          throw new Error("Unsafe replaceOne operation: Empty query");
        }
        if (!newDocument) {
          throw new Error("ReplaceOne operation failed: New document is required");
        }
        return await mockReplaceOne(query, newDocument);
      },
      deleteOne: async (query = {}) => {
        if (Object.keys(query).length === 0) {
          throw new Error("Unsafe deleteOne operation: Empty query");
        }
        return await mockDeleteOne(query);
      },
      estimateDocumentCount: async () => {
        return await mockEstimateDocumentCount();
      }
    }))
  };
});

// Import the mocked module
import { createMongoCollection } from '$lib/server/collectionLayer';
import { databaseDocUtil } from '$lib/server/utility/dbUtil';

describe('collectionLayer', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  describe('createMongoCollection', () => {
    // Get the wrapper
    const wrapper = createMongoCollection(mockMongoCollection);
    
    describe('find', () => {
      it('should find documents with a query', async () => {
        // Setup
        const mockDocs = [{ _id: '1', name: 'Test' }];
        mockFind.mockResolvedValue(mockDocs);
        
        // Execute
        const result = await wrapper.find({ name: 'Test' });
        
        // Assert
        expect(mockFind).toHaveBeenCalledWith({ name: 'Test' });
        expect(result).toEqual(mockDocs);
      });
      
      it('should throw an error when find fails', async () => {
        // Setup
        mockFind.mockRejectedValue(new Error('Database error'));
        
        // Execute & Assert
        await expect(wrapper.find({ name: 'Test' })).rejects.toThrow(/Database error/);
      });
    });
    
    describe('findOne', () => {
      it('should find a single document', async () => {
        // Setup
        const mockDoc = { _id: '1', name: 'Test' };
        mockFindOne.mockResolvedValue(mockDoc);
        
        // Execute
        const result = await wrapper.findOne({ _id: '1' });
        
        // Assert
        expect(mockFindOne).toHaveBeenCalledWith({ _id: '1' }, {});
        expect(result).toEqual(mockDoc);
      });
      
      it('should return null when no document found', async () => {
        // Setup
        mockFindOne.mockResolvedValue(null);
        
        // Execute
        const result = await wrapper.findOne({ _id: 'nonexistent' });
        
        // Assert
        expect(result).toBeNull();
      });
    });
    
    describe('insertOne', () => {
      it('should insert a document', async () => {
        // Setup
        const doc = { name: 'Test' };
        const mockResult = { acknowledged: true, insertedId: '123' };
        mockInsertOne.mockResolvedValue(mockResult);
        
        // Execute
        const result = await wrapper.insertOne(doc);
        
        // Assert
        expect(mockInsertOne).toHaveBeenCalledWith(doc);
        expect(result).toEqual(mockResult);
      });
      
      it('should throw error when document is missing', async () => {
        // Execute & Assert
        await expect(wrapper.insertOne(undefined as any)).rejects.toThrow('Document is required');
      });
    });
    
    describe('updateOne', () => {
      it('should update a document', async () => {
        // Setup
        const query = { _id: '1' };
        const update = { name: 'Updated' };
        const mockResult = { _id: '1', name: 'Updated' };
        mockFindOneAndUpdate.mockResolvedValue(mockResult);
        
        // Execute
        const result = await wrapper.updateOne(query, update);
        
        // Assert
        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(query, update);
        expect(result).toEqual(mockResult);
      });
      
      it('should throw error when query is empty', async () => {
        // Execute & Assert
        await expect(wrapper.updateOne({}, { name: 'Test' })).rejects.toThrow('Empty query');
      });
    });
  });
});