/**
 * Error logging service
 *
 * This service handles error logging and reporting.
 * In a production environment, you would send these errors to a service like
 * Sentry, LogRocket, or your own backend error tracking system.
 */

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error context interface
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

// Error log entry interface
export interface ErrorLogEntry {
  timestamp: string;
  message: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  stack?: string;
}

// Maximum number of errors to store locally
const MAX_LOCAL_ERRORS = 50;

// Local storage key for errors
const ERROR_STORAGE_KEY = 'app_error_log';

/**
 * Log an error to the console and optionally to a remote service
 */
export function logError(
  error: Error | string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  context: ErrorContext = {}
): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const stack = error instanceof Error ? error.stack : undefined;

  // Create error log entry
  const logEntry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    message: errorMessage,
    severity,
    context: {
      ...context,
      url: window.location.href
    },
    stack
  };

  // Log to console
  const consoleMethod = severity === ErrorSeverity.INFO
    ? console.info
    : severity === ErrorSeverity.WARNING
      ? console.warn
      : console.error;

  consoleMethod(
    `[${severity.toUpperCase()}] ${errorMessage}`,
    { context: logEntry.context, stack }
  );

  // Store locally for potential later submission
  storeErrorLocally(logEntry);

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    sendErrorToService(logEntry).catch(e => {
      console.error('Failed to send error to service:', e);
    });
  }
}

/**
 * Store error in local storage for later submission
 */
function storeErrorLocally(logEntry: ErrorLogEntry): void {
  try {
    // Get existing errors
    const storedErrors = localStorage.getItem(ERROR_STORAGE_KEY);
    let errors: ErrorLogEntry[] = storedErrors ? JSON.parse(storedErrors) : [];

    // Add new error
    errors.push(logEntry);

    // Limit the number of stored errors
    if (errors.length > MAX_LOCAL_ERRORS) {
      errors = errors.slice(-MAX_LOCAL_ERRORS);
    }

    // Save back to storage
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
  } catch (e) {
    // If localStorage fails, just log to console
    console.error('Failed to store error locally:', e);
  }
}

/**
 * Send error to remote error tracking service
 */
async function sendErrorToService(logEntry: ErrorLogEntry): Promise<void> {
  // In a real app, you would send this to your error tracking service
  // For example, using Sentry:
  // Sentry.captureException(new Error(logEntry.message), {
  //   level: logEntry.severity,
  //   extra: logEntry.context
  // });

  // For now, we'll just simulate sending it to a backend endpoint
  if (navigator.onLine) {
    try {
      // This is a placeholder - replace with your actual error reporting endpoint
      await fetch('/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry),
        // Don't wait for response
        keepalive: true
      });
    } catch (e) {
      console.error('Failed to send error to service:', e);
    }
  }
}

/**
 * Submit all stored errors to the error tracking service
 * Call this when the app comes back online
 */
export async function submitStoredErrors(): Promise<void> {
  if (!navigator.onLine) return;

  try {
    const storedErrors = localStorage.getItem(ERROR_STORAGE_KEY);
    if (!storedErrors) return;

    const errors: ErrorLogEntry[] = JSON.parse(storedErrors);
    if (errors.length === 0) return;

    // In a real app, you would batch send these to your error tracking service
    // For now, we'll just simulate sending them to a backend endpoint
    await fetch('/api/log-errors-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ errors }),
      keepalive: true
    });

    // Clear stored errors after successful submission
    localStorage.removeItem(ERROR_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to submit stored errors:', e);
  }
}

/**
 * Initialize error logging service
 * Sets up listeners for online/offline events
 */
export function initErrorLogging(): void {
  // Set up global error handler
  window.addEventListener('error', (event) => {
    logError(event.error || new Error(event.message), ErrorSeverity.ERROR, {
      action: 'global_error',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });

    // Don't prevent default - let the browser handle it too
    return false;
  });

  // Set up unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));

    logError(error, ErrorSeverity.ERROR, {
      action: 'unhandled_promise_rejection'
    });

    // Don't prevent default
    return false;
  });

  // Set up online listener to submit stored errors
  window.addEventListener('online', () => {
    submitStoredErrors().catch(console.error);
  });

  // If online, try to submit any stored errors on startup
  if (navigator.onLine) {
    submitStoredErrors().catch(console.error);
  }
}
