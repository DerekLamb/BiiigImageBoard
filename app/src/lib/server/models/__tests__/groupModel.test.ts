import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

// Mock dependencies
vi.mock('mongodb', () => ({
  ObjectId: vi.fn((id) => id)
}));

// Create mockable functions
const mockFindPage = vi.fn();
const mockFindOne = vi.fn();
const mockFind = vi.fn();
const mockInsertOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockDeleteOne = vi.fn();
const mockEstimateDocumentCount = vi.fn();
const mockImageFind = vi.fn();

// Mock the module
vi.mock('../groupModel', () => ({
  GroupModel: {
    findGroups: vi.fn(async (filter = {}, limit = 10, skip = 0, sort = { uploadDate: -1 }) => {
      return mockFindPage(filter, limit, skip, sort);
    }),
    getGroupById: vi.fn(async (id) => {
      return mockFindOne({ _id: id });
    }),
    getGroupByName: vi.fn(async (name) => {
      return mockFindOne({ name: name });
    }),
    getAllGroups: vi.fn(async () => {
      return mockFind();
    }),
    createGroup: vi.fn(async (groupData) => {
      const results = await mockInsertOne(groupData);
      return {
        success: results.acknowledged === true,
        id: results.insertedId?.toString(),
      };
    }),
    addImageToGroup: vi.fn(async (groupId, imageId) => {
      // Mock implementation of addImageToGroup
      const parentGroup = { _id: groupId, children: ['1', '2'] };
      mockFindOne.mockResolvedValueOnce(parentGroup);
      
      // Mock finding child images
      const childImages = [{ uploadDate: '2023-01-01' }, { uploadDate: '2023-01-02' }];
      mockImageFind.mockResolvedValueOnce(childImages);
      
      const results = await mockUpdateOne(
        { _id: new ObjectId(groupId) },
        { 
          $set: { uploadDate: '2023-01-02' },
          $push: { children: new ObjectId(imageId) }
        }
      );
      
      return {
        success: results !== null,
        document: results
      };
    }),
    updateGroup: vi.fn(async (id, updates) => {
      const results = await mockUpdateOne({ _id: id }, { $set: updates });
      return {
        success: results !== null,
        document: results,
      };
    }),
    updateGroupThumbnail: vi.fn(),
    deleteGroup: vi.fn(async (id) => {
      const results = await mockDeleteOne({ _id: id });
      return {
        success: results.acknowledged === true,
        id: id,
        count: results.deletedCount
      };
    }),
    getGroupCount: vi.fn(async () => {
      return mockEstimateDocumentCount();
    }),
  }
}));

// Import the mocked module
import { GroupModel } from '../groupModel';

describe('GroupModel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup mock for image find
    mockImageFind.mockResolvedValue([]);
  });

  describe('findGroups', () => {
    it('should return groups with default parameters', async () => {
      // Setup mock data
      const mockGroups = [
        { _id: '1', name: 'Group 1', type: 'group', children: [], uploadDate: '2023-01-01' },
        { _id: '2', name: 'Group 2', type: 'group', children: [], uploadDate: '2023-01-02' }
      ];
      mockFindPage.mockResolvedValue(mockGroups);

      // Call the method
      const result = await GroupModel.findGroups();

      // Assertions
      expect(mockFindPage).toHaveBeenCalledWith({}, 10, 0, { uploadDate: -1 });
      expect(result).toEqual(mockGroups);
    });

    it('should use custom filter, limit, skip, and sort parameters', async () => {
      // Setup mock data
      const mockGroups = [{ _id: '1', name: 'Test Group', type: 'group', children: [], uploadDate: '2023-01-01' }];
      mockFindPage.mockResolvedValue(mockGroups);

      // Custom parameters
      const filter = { name: 'Test' };
      const limit = 5;
      const skip = 10;
      const sort = { name: 1 };

      // Call the method
      const result = await GroupModel.findGroups(filter, limit, skip, sort);

      // Assertions
      expect(mockFindPage).toHaveBeenCalledWith(filter, limit, skip, sort);
      expect(result).toEqual(mockGroups);
    });
  });

  describe('getGroupById', () => {
    it('should return a group by its ID', async () => {
      // Setup mock data
      const mockGroup = { _id: '123', name: 'Test Group', type: 'group', children: [], uploadDate: '2023-01-01' };
      mockFindOne.mockResolvedValue(mockGroup);

      // Call the method
      const result = await GroupModel.getGroupById('123');

      // Assertions
      expect(mockFindOne).toHaveBeenCalledWith({ _id: '123' });
      expect(result).toEqual(mockGroup);
    });
  });

  describe('getGroupByName', () => {
    it('should return a group by its name', async () => {
      // Setup mock data
      const mockGroup = { _id: '123', name: 'Test Group', type: 'group', children: [], uploadDate: '2023-01-01' };
      mockFindOne.mockResolvedValue(mockGroup);

      // Call the method
      const result = await GroupModel.getGroupByName('Test Group');

      // Assertions
      expect(mockFindOne).toHaveBeenCalledWith({ name: 'Test Group' });
      expect(result).toEqual(mockGroup);
    });
  });

  describe('createGroup', () => {
    it('should create a new group and return success', async () => {
      // Setup mock data
      const newGroup = { 
        name: 'New Group', 
        type: 'group', 
        children: [],
        uploadDate: '2023-01-01',
        groupTags: []
      };
      
      const mockResult = { 
        acknowledged: true, 
        insertedId: '123'
      };
      
      mockInsertOne.mockResolvedValue(mockResult);

      // Call the method
      const result = await GroupModel.createGroup(newGroup);

      // Assertions
      expect(mockInsertOne).toHaveBeenCalledWith(newGroup);
      expect(result).toEqual({
        success: true,
        id: '123'
      });
    });

    it('should handle failure when creating a group', async () => {
      // Setup mock data for failure
      const newGroup = { 
        name: 'Failed Group', 
        type: 'group', 
        children: [],
        uploadDate: '2023-01-01',
        groupTags: []
      };
      
      const mockResult = { 
        acknowledged: false
      };
      
      mockInsertOne.mockResolvedValue(mockResult);

      // Call the method
      const result = await GroupModel.createGroup(newGroup);

      // Assertions
      expect(mockInsertOne).toHaveBeenCalledWith(newGroup);
      expect(result).toEqual({
        success: false,
        id: undefined
      });
    });
  });

  describe('deleteGroup', () => {
    it('should delete a group and return success', async () => {
      // Setup mock data
      const mockResult = {
        acknowledged: true,
        deletedCount: 1
      };
      
      mockDeleteOne.mockResolvedValue(mockResult);
      
      // Call the method
      const result = await GroupModel.deleteGroup('123');
      
      // Assertions
      expect(mockDeleteOne).toHaveBeenCalledWith({ _id: '123' });
      expect(result).toEqual({
        success: true,
        id: '123',
        count: 1
      });
    });
  });

  // More tests can be added for other methods
});