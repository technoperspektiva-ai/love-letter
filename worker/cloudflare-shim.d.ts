interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
interface R2ObjectBody {
  body: ReadableStream;
  writeHttpMetadata(headers: Headers): void;
}
interface R2Bucket {
  put(key: string, value: ArrayBuffer, options?: unknown): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
}
interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}
