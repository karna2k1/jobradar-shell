// Types for the micro frontends loaded via Module Federation (no top-level imports: keeps this an ambient file).

declare module 'jobsFeed/JobsFeed' {
  const JobsFeed: import('react').ComponentType<{ http: import('./lib/http-types').HttpClient }>;
  export default JobsFeed;
}

declare module 'insights/Insights' {
  type Http = import('./lib/http-types').HttpClient;
  const Insights: import('react').ComponentType<{ core: Http; ingest: Http; match: Http }>;
  export default Insights;
}
