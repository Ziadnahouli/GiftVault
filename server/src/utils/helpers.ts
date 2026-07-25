import xss from 'xss';

/**
 * Sanitize a string input against XSS attacks.
 */
export function sanitize(input: string): string {
  if (typeof input !== 'string') return '';
  return xss(input.trim());
}

/**
 * Sanitize an object's string values recursively.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitize(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Generate a slug from text.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Generate a unique order number.
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GV-${timestamp}-${random}`;
}

/**
 * Paginate query params.
 */
export function getPagination(query: any): { limit: number; offset: number; page: number } {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 12));
  const offset = (page - 1) * limit;
  return { limit, offset, page };
}
