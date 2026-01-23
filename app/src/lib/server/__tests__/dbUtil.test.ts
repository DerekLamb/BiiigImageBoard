import { describe, it, expect } from 'vitest';
import { ObjectId, type Document } from 'mongodb';
import { databaseDocUtil } from '../utility/dbUtil';

describe('databaseDocUtil', () => {
  describe('convertIdToString', () => {
    it('should convert ObjectId to string', () => {
      // Setup - create a document with ObjectId
      const dbDoc = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        name: 'Test Document'
      };

      // Execute - convert to string ID
      const result = databaseDocUtil.convertIdToString(dbDoc as any);

      // Assert - check the result
      expect(result._id).toBe('507f1f77bcf86cd799439011');
      expect(result.name).toBe('Test Document');
    });

    it('should handle document without _id', () => {
      // Setup - create a document without _id
      const dbDoc = {
        name: 'Test Document'
      };

      // Execute
      const result = databaseDocUtil.convertIdToString(dbDoc as any);

      // Assert
      expect(result._id).toBeUndefined();
      expect(result.name).toBe('Test Document');
    });
  });

  describe('convertStringToId', () => {
    it('should convert string to ObjectId', () => {
      // Setup - create a document with string ID
      const appDoc = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Document'
      };

      // Execute - convert to ObjectId
      const result = databaseDocUtil.convertStringToId(appDoc as any);

      // Assert - check the result
      expect(result._id).toBeInstanceOf(ObjectId);
      expect(result.name).toBe('Test Document');
    });

    it('should handle document without _id', () => {
      // Setup - create a document without _id
      const appDoc = {
        name: 'Test Document'
      };

      // Execute
      const result = databaseDocUtil.convertStringToId(appDoc as any);

      // Assert
      expect(result._id).toBeUndefined();
      expect(result.name).toBe('Test Document');
    });
  });
});
