export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  meta?: any;
  timestamp: string;
  location: string;
}

const QUEUE_KEY = 'venturesocial_log_queue';
let queue: LogEntry[] = [];

// Load logs from localStorage on initialization
try {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(QUEUE_KEY);
    if (stored) {
      queue = JSON.parse(stored);
    }
  }
} catch (e) {
  console.warn('[LogQueue] Failed to load queue from localStorage', e);
}

const saveQueue = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    console.warn('[LogQueue] Failed to save queue to localStorage', e);
  }
};

let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;
  
  const batch = [...queue];
  try {
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: batch })
    });
    
    if (response.ok) {
      queue = queue.filter(item => !batch.some(b => b.id === item.id));
      saveQueue();
    }
  } catch (e) {
    // Log transmission failed, queue items remain to be retried
  } finally {
    isProcessing = false;
  }
};

export const pushToQueue = (level: 'info' | 'warn' | 'error', message: string, meta?: any) => {
  try {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      level,
      message,
      meta: meta instanceof Error ? { message: meta.message, stack: meta.stack } : meta,
      timestamp: new Date().toISOString(),
      location: typeof window !== 'undefined' ? window.location.href : 'server'
    };
    
    queue.push(entry);
    saveQueue();
    
    // Run async transmission without blocking main execution thread
    setTimeout(processQueue, 0);
  } catch (e) {
    console.error('[LogQueue] Fallback fail during pushToQueue:', e);
  }
};

// Periodic retry trigger (every 8 seconds)
if (typeof window !== 'undefined') {
  setInterval(processQueue, 8000);
}
