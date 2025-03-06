import { vi } from 'vitest';

// Mock MongoDB ObjectId
export const ObjectId = vi.fn((id) => id);

// Mock MongoDB Client
export const MongoClient = vi.fn().mockImplementation(() => ({
  db: vi.fn().mockReturnThis(),
  connect: vi.fn().mockResolvedValue({}),
  collection: vi.fn().mockReturnValue({})
}));

// Mock MongoDB Collection
export const Collection = vi.fn();

// Mock other MongoDB exports as needed
export const Sort = vi.fn();
export const Filter = vi.fn();