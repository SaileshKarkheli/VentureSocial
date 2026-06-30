import { pushToQueue } from './logQueue';

export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(`[INFO] ${msg}`, meta || '');
    pushToQueue('info', msg, meta);
  },
  warn: (msg: string, meta?: any) => {
    console.warn(`[WARN] ${msg}`, meta || '');
    pushToQueue('warn', msg, meta);
  },
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error || '');
    pushToQueue('error', msg, error);
  },
  critical: (msg: string, error?: any) => {
    console.error(`[CRITICAL] ${msg}`, error || '');
    pushToQueue('critical', msg, error);
  }
};
