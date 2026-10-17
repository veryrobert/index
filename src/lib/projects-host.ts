// True when the index is being viewed on this machine rather than the live site.
export const isLocalHost = (hostname: string) =>
  hostname === 'localhost' || hostname.endsWith('.test') || hostname.startsWith('127.')
