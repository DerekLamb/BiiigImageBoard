import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TagModel } from '../tagModel';
import * as db from '$lib/db.server';

// Mock the imageCollection
vi.mock('$lib/db.server', () => ({
  imageCollection: {
    distinct: vi.fn()
  }
}));

describe('TagModel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getAll', () => {
    it('should return all non-empty tags', async () => {
      // Mock implementation for the distinct method
      const mockTags = ['tag1', 'tag2', '', null, 'tag3'];
      vi.mocked(db.imageCollection.distinct).mockResolvedValue(mockTags);

      // Call the method being tested
      const result = await TagModel.getAll();

      // Assertions
      expect(db.imageCollection.distinct).toHaveBeenCalledWith('tags');
      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
      expect(result).not.toContain('');
      expect(result).not.toContain(null);
    });

    it('should return an empty array when no tags exist', async () => {
      // Mock implementation for empty tags
      vi.mocked(db.imageCollection.distinct).mockResolvedValue([]);

      // Call the method being tested
      const result = await TagModel.getAll();

      // Assertions
      expect(db.imageCollection.distinct).toHaveBeenCalledWith('tags');
      expect(result).toEqual([]);
    });

    it('should handle errors from database', async () => {
      // Mock implementation to throw an error
      vi.mocked(db.imageCollection.distinct).mockRejectedValue(new Error('Database error'));

      // Call the method and expect it to reject
      await expect(TagModel.getAll()).rejects.toThrow('Database error');
      expect(db.imageCollection.distinct).toHaveBeenCalledWith('tags');
    });
  });
});