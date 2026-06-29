export const logger = {
  info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
  warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || ''),
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error || '');
    // Production telemetry / Sentry hooks can be integrated dynamically
    if (typeof window !== 'undefined') {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          error: error?.message || error,
          location: window.location.href,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {}); // catch all network-level rejections to avoid cycles
    }
  }
};
