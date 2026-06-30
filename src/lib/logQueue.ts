import { supabase } from '../supabaseClient';

export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  meta?: any;
  timestamp: string;
  location: string;
  userId?: string | null;
  sessionId?: string | null;
}

const QUEUE_KEY = 'venturesocial_log_queue';
const MAX_QUEUE_SIZE = 100;
let queue: LogEntry[] = [];

// Session and User ID caching from Supabase
let cachedUserId: string | null = null;
let cachedSessionId: string | null = null;

if (typeof window !== 'undefined') {
  try {
    supabase.auth.getSession().then(({ data }) => {
      cachedUserId = data.session?.user?.id || null;
      cachedSessionId = data.session?.access_token ? data.session.access_token.substring(0, 12) : null;
    });

    supabase.auth.onAuthStateChange((_, session) => {
      cachedUserId = session?.user?.id || null;
      cachedSessionId = session?.access_token ? session.access_token.substring(0, 12) : null;
    });
  } catch (e) {
    console.warn('[LogQueue] Failed to initialize Supabase session listeners:', e);
  }
}

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
let currentInterval = 8000; // Base interval: 8 seconds
const MIN_INTERVAL = 8000;
const MAX_INTERVAL = 60000; // Max backoff: 60 seconds

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
      // Reset backoff on success
      currentInterval = MIN_INTERVAL;
      resetTimer();
    } else {
      triggerBackoff();
    }
  } catch (e) {
    triggerBackoff();
  } finally {
    isProcessing = false;
  }
};

const triggerBackoff = () => {
  currentInterval = Math.min(currentInterval * 2, MAX_INTERVAL);
  resetTimer();
};

let timerId: any = null;
const resetTimer = () => {
  if (typeof window !== 'undefined') {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(processQueue, currentInterval);
  }
};

export const pushToQueue = (level: LogLevel, message: string, meta?: any) => {
  try {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      level,
      message,
      meta: meta instanceof Error ? { message: meta.message, stack: meta.stack } : meta,
      timestamp: new Date().toISOString(),
      location: typeof window !== 'undefined' ? window.location.href : 'server',
      userId: cachedUserId,
      sessionId: cachedSessionId
    };
    
    queue.push(entry);
    
    // Evict oldest logs if queue size limit exceeded
    if (queue.length > MAX_QUEUE_SIZE) {
      queue.shift();
    }
    
    saveQueue();
    
    // Process queue immediately without blocking main execution thread
    setTimeout(processQueue, 0);
  } catch (e) {
    console.error('[LogQueue] Fallback fail during pushToQueue:', e);
  }
};

// Initialize retry loop
resetTimer();
