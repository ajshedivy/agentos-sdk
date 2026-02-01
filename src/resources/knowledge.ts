import type { AgentOSClient } from "../client";
import type { components } from "../generated/types";
import type { FileInput } from "../types/files";
import { normalizeFileInput } from "../utils/files";

// Extract types from generated schemas
type ContentResponse = components["schemas"]["ContentResponseSchema"];
type ContentStatusResponse = components["schemas"]["ContentStatusResponse"];
type ConfigResponse = components["schemas"]["ConfigResponse"];
type VectorSearchResult = components["schemas"]["VectorSearchResult"];

/**
 * Paginated response for list and search operations
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total_pages: number;
    total_count: number;
  };
}

/**
 * Options for uploading content to knowledge base
 */
export interface UploadOptions {
  /** File to upload (one of: file, url, or textContent required) */
  file?: FileInput;
  /** URL to fetch content from (single URL or JSON array of URLs) */
  url?: string;
  /** Raw text content to process */
  textContent?: string;
  /** Content name (auto-generated from file/URL if not provided) */
  name?: string;
  /** Content description */
  description?: string;
  /** JSON metadata object */
  metadata?: Record<string, unknown>;
  /** ID of the reader to use for processing */
  readerId?: string;
  /** Chunking strategy (e.g., 'RecursiveChunker', 'SemanticChunker') */
  chunker?: string;
  /** Chunk size for processing */
  chunkSize?: number;
  /** Chunk overlap for processing */
  chunkOverlap?: number;
  /** Database ID to use for storage */
  dbId?: string;
}

/**
 * Options for listing knowledge content
 */
export interface ListKnowledgeOptions {
  /** Number of entries to return (default: 20) */
  limit?: number;
  /** Page number (default: 1) */
  page?: number;
  /** Field to sort by (default: 'created_at') */
  sortBy?: string;
  /** Sort order: 'asc' or 'desc' (default: 'desc') */
  sortOrder?: "asc" | "desc";
  /** Database ID to filter by */
  dbId?: string;
}

/**
 * Options for searching knowledge base
 */
export interface SearchOptions {
  /** Database ID to search in */
  dbId?: string;
  /** Vector database IDs to search in */
  vectorDbIds?: string[];
  /** Search type: 'vector', 'keyword', or 'hybrid' */
  searchType?: "vector" | "keyword" | "hybrid";
  /** Maximum number of results (1-1000) */
  maxResults?: number;
  /** Additional filters for search */
  filters?: Record<string, unknown>;
  /** Pagination: page number */
  page?: number;
  /** Pagination: results per page */
  limit?: number;
}

/**
 * Options for updating content
 */
export interface UpdateContentOptions {
  /** New content name */
  name?: string;
  /** New description */
  description?: string;
  /** Updated metadata (as JSON string) */
  metadata?: Record<string, unknown>;
  /** New reader ID for reprocessing */
  readerId?: string;
  /** Database ID */
  dbId?: string;
}

/**
 * Resource class for knowledge base operations
 *
 * Provides methods to:
 * - Get knowledge configuration
 * - Upload content (files, URLs, text)
 * - List and search content
 * - Update and delete content
 *
 * @example
 * ```typescript
 * const client = new AgentOSClient({ baseUrl: '...' });
 *
 * // Upload a file
 * const content = await client.knowledge.upload({
 *   file: '/path/to/document.pdf',
 *   name: 'My Document',
 * });
 *
 * // Search knowledge base
 * const results = await client.knowledge.search('JavaScript best practices', {
 *   maxResults: 10,
 * });
 * ```
 */
export class KnowledgeResource {
  constructor(private readonly client: AgentOSClient) {}

  /**
   * Get knowledge base configuration
   *
   * Returns available readers, chunkers, and processing options.
   */
  async getConfig(dbId?: string): Promise<ConfigResponse> {
    const params = new URLSearchParams();
    if (dbId) params.append("db_id", dbId);

    const query = params.toString();
    const path = query ? `/knowledge/config?${query}` : "/knowledge/config";

    return this.client.request<ConfigResponse>("GET", path);
  }

  /**
   * List all content in knowledge base
   *
   * @param options - Filtering and pagination options
   */
  async list(
    options?: ListKnowledgeOptions,
  ): Promise<PaginatedResponse<ContentResponse>> {
    const params = new URLSearchParams();

    if (options?.limit !== undefined)
      params.append("limit", String(options.limit));
    if (options?.page !== undefined)
      params.append("page", String(options.page));
    if (options?.sortBy) params.append("sort_by", options.sortBy);
    if (options?.sortOrder) params.append("sort_order", options.sortOrder);
    if (options?.dbId) params.append("db_id", options.dbId);

    const query = params.toString();
    const path = query ? `/knowledge/content?${query}` : "/knowledge/content";

    return this.client.request<PaginatedResponse<ContentResponse>>("GET", path);
  }

  /**
   * Upload content to knowledge base
   *
   * Supports file uploads, URLs, or raw text content.
   * Content is processed asynchronously - use getStatus() to check progress.
   *
   * @param options - Upload options (one of file, url, or textContent required)
   */
  async upload(options: UploadOptions): Promise<ContentResponse> {
    const formData = new FormData();

    // Content source (one of: file, url, textContent)
    if (options.file) {
      formData.append("file", normalizeFileInput(options.file));
    }
    if (options.url) {
      formData.append("url", options.url);
    }
    if (options.textContent) {
      formData.append("text_content", options.textContent);
    }

    // Optional fields
    if (options.name) formData.append("name", options.name);
    if (options.description)
      formData.append("description", options.description);
    if (options.metadata)
      formData.append("metadata", JSON.stringify(options.metadata));
    if (options.readerId) formData.append("reader_id", options.readerId);
    if (options.chunker) formData.append("chunker", options.chunker);
    if (options.chunkSize !== undefined)
      formData.append("chunk_size", String(options.chunkSize));
    if (options.chunkOverlap !== undefined)
      formData.append("chunk_overlap", String(options.chunkOverlap));

    // Add db_id as query param
    const params = new URLSearchParams();
    if (options.dbId) params.append("db_id", options.dbId);
    const query = params.toString();
    const path = query ? `/knowledge/content?${query}` : "/knowledge/content";

    return this.client.request<ContentResponse>("POST", path, {
      body: formData,
    });
  }

  /**
   * Get content by ID
   *
   * @param contentId - Content identifier
   * @param dbId - Optional database ID
   */
  async get(contentId: string, dbId?: string): Promise<ContentResponse> {
    const params = new URLSearchParams();
    if (dbId) params.append("db_id", dbId);

    const query = params.toString();
    const basePath = `/knowledge/content/${encodeURIComponent(contentId)}`;
    const path = query ? `${basePath}?${query}` : basePath;

    return this.client.request<ContentResponse>("GET", path);
  }

  /**
   * Get processing status for content
   *
   * @param contentId - Content identifier
   * @param dbId - Optional database ID
   */
  async getStatus(
    contentId: string,
    dbId?: string,
  ): Promise<ContentStatusResponse> {
    const params = new URLSearchParams();
    if (dbId) params.append("db_id", dbId);

    const query = params.toString();
    const basePath = `/knowledge/content/${encodeURIComponent(contentId)}/status`;
    const path = query ? `${basePath}?${query}` : basePath;

    return this.client.request<ContentStatusResponse>("GET", path);
  }

  /**
   * Update content properties
   *
   * @param contentId - Content identifier
   * @param options - Properties to update
   */
  async update(
    contentId: string,
    options: UpdateContentOptions,
  ): Promise<ContentResponse> {
    const formData = new FormData();

    if (options.name) formData.append("name", options.name);
    if (options.description)
      formData.append("description", options.description);
    if (options.metadata)
      formData.append("metadata", JSON.stringify(options.metadata));
    if (options.readerId) formData.append("reader_id", options.readerId);

    const params = new URLSearchParams();
    if (options.dbId) params.append("db_id", options.dbId);
    const query = params.toString();
    const basePath = `/knowledge/content/${encodeURIComponent(contentId)}`;
    const path = query ? `${basePath}?${query}` : basePath;

    return this.client.request<ContentResponse>("PATCH", path, {
      body: formData,
    });
  }

  /**
   * Delete content by ID
   *
   * @param contentId - Content identifier
   * @param dbId - Optional database ID
   */
  async delete(contentId: string, dbId?: string): Promise<void> {
    const params = new URLSearchParams();
    if (dbId) params.append("db_id", dbId);

    const query = params.toString();
    const basePath = `/knowledge/content/${encodeURIComponent(contentId)}`;
    const path = query ? `${basePath}?${query}` : basePath;

    await this.client.request<void>("DELETE", path);
  }

  /**
   * Delete all content from knowledge base
   *
   * WARNING: This is a destructive operation that cannot be undone.
   *
   * @param dbId - Optional database ID to scope deletion
   */
  async deleteAll(dbId?: string): Promise<void> {
    const params = new URLSearchParams();
    if (dbId) params.append("db_id", dbId);

    const query = params.toString();
    const path = query ? `/knowledge/content?${query}` : "/knowledge/content";

    await this.client.request<void>("DELETE", path);
  }

  /**
   * Search knowledge base
   *
   * Performs vector/keyword/hybrid search across content.
   *
   * @param query - Search query text
   * @param options - Search options (filters, pagination, search type)
   */
  async search(
    query: string,
    options?: SearchOptions,
  ): Promise<PaginatedResponse<VectorSearchResult>> {
    const body: Record<string, unknown> = { query };

    if (options?.dbId) body.db_id = options.dbId;
    if (options?.vectorDbIds) body.vector_db_ids = options.vectorDbIds;
    if (options?.searchType) body.search_type = options.searchType;
    if (options?.maxResults) body.max_results = options.maxResults;
    if (options?.filters) body.filters = options.filters;
    if (options?.page !== undefined || options?.limit !== undefined) {
      body.meta = {
        page: options?.page,
        limit: options?.limit,
      };
    }

    return this.client.request<PaginatedResponse<VectorSearchResult>>(
      "POST",
      "/knowledge/search",
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
