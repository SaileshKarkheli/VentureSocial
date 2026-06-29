export const logger = {
  info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
  warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ''),
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error || '');
    // Remote observability hooks can be connected here in the future
  }
};
