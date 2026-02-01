import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeFileInput } from '../../src/utils/files';

describe('normalizeFileInput', () => {
  describe('string path input (Node.js)', () => {
    it('converts file path to ReadStream', () => {
      // Use test fixture file
      const testFilePath = path.join(__dirname, '../fixtures/test-file.txt');
      const result = normalizeFileInput(testFilePath);

      // Result should be a ReadStream (will have stream properties)
      expect(result).toBeDefined();
      expect(typeof (result as any).pipe).toBe('function');
      expect(typeof (result as any).on).toBe('function');

      // Clean up the stream
      if (typeof (result as any).destroy === 'function') {
        (result as any).destroy();
      }
    });
  });

  describe('Buffer input', () => {
    it('converts Buffer to Blob', () => {
      const buffer = Buffer.from('test content');

      const result = normalizeFileInput(buffer);

      expect(result).toBeInstanceOf(Blob);
    });

    it('converts Buffer to File when filename provided and File exists', () => {
      const buffer = Buffer.from('test content');

      const result = normalizeFileInput(buffer, 'test.txt');

      // In Node.js 20+, File constructor exists
      if (typeof File !== 'undefined') {
        expect(result).toBeInstanceOf(File);
        expect((result as File).name).toBe('test.txt');
      } else {
        expect(result).toBeInstanceOf(Blob);
      }
    });
  });

  describe('Blob input', () => {
    it('passes Blob through unchanged', () => {
      const blob = new Blob(['test content']);

      const result = normalizeFileInput(blob);

      expect(result).toBe(blob);
    });
  });

  describe('File input', () => {
    it('passes File through unchanged', () => {
      // Skip if File constructor not available
      if (typeof File === 'undefined') {
        return;
      }

      const file = new File(['test content'], 'test.txt');

      const result = normalizeFileInput(file);

      expect(result).toBe(file);
    });
  });

  describe('ReadStream input', () => {
    it('passes ReadStream through unchanged', () => {
      const mockStream = { pipe: vi.fn() } as unknown as fs.ReadStream;

      const result = normalizeFileInput(mockStream as unknown as fs.ReadStream);

      expect(result).toBe(mockStream);
    });
  });
});
