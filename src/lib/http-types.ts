/** The slice of Axios that micro frontends receive as a prop (keeps them free of shell internals). */
export interface HttpClient {
  get<T = unknown>(url: string, config?: { params?: Record<string, unknown> }): Promise<{ data: T }>;
  post<T = unknown>(url: string, body?: unknown): Promise<{ data: T }>;
  patch<T = unknown>(url: string, body?: unknown): Promise<{ data: T }>;
}
