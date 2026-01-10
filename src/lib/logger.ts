/**
 * Dev-only logger utility.
 * In production, logs are suppressed to reduce noise and improve performance.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('[Component]', 'message', data);
 *   logger.warn('[Component]', 'warning message');
 *   logger.error('[Component]', 'error message', error);
 */

const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  log: (level: LogLevel, ...args: unknown[]) => void;
}

function createLogger(): Logger {
  const noop = () => {};

  const log = (level: LogLevel, ...args: unknown[]) => {
    if (!isDev && level !== 'error') return;
    
    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = `[${timestamp}]`;
    
    switch (level) {
      case 'debug':
        console.debug(prefix, ...args);
        break;
      case 'info':
        console.info(prefix, ...args);
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'error':
        console.error(prefix, ...args);
        break;
    }
  };

  if (!isDev) {
    return {
      debug: noop,
      info: noop,
      warn: noop,
      error: (...args: unknown[]) => log('error', ...args),
      log: (level: LogLevel, ...args: unknown[]) => {
        if (level === 'error') log('error', ...args);
      },
    };
  }

  return {
    debug: (...args: unknown[]) => log('debug', ...args),
    info: (...args: unknown[]) => log('info', ...args),
    warn: (...args: unknown[]) => log('warn', ...args),
    error: (...args: unknown[]) => log('error', ...args),
    log,
  };
}

export const logger = createLogger();
