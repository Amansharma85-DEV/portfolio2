/**
 * Strict Input Schema Validator & Express Middleware
 * Enforces strict type, length, format, and property constraints.
 * Rejects non-conforming inputs with HTTP 400 Bad Request.
 */

'use strict';

// Common Regex Patterns
const PATTERNS = {
  email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
  phone: /^[+\d\s()-]{7,20}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  alphanumeric: /^[a-zA-Z0-9_]+$/,
  name: /^[a-zA-Z\s'.-]{2,100}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,128}$/
};

/**
 * Validate data against a schema object
 */
function validateData(schema, data) {
  const errors = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Payload must be a valid JSON object.', code: 'INVALID_TYPE' }]
    };
  }

  // 1. Check for Unknown / Extra Fields if allowUnknown is false (default: false)
  const allowUnknown = schema.allowUnknown === true;
  const allowedKeys = Object.keys(schema.properties || {});
  const dataKeys = Object.keys(data);

  if (!allowUnknown) {
    for (const key of dataKeys) {
      if (!allowedKeys.includes(key)) {
        errors.push({
          field: key,
          message: `Unexpected property '${key}' is not allowed in schema.`,
          code: 'UNEXPECTED_PROPERTY'
        });
      }
    }
  }

  // 2. Check Required Fields
  const requiredFields = schema.required || [];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({
        field,
        message: `Field '${field}' is required and cannot be empty.`,
        code: 'MISSING_REQUIRED_FIELD'
      });
    }
  }

  // 3. Check Properties (Type, Length, Format, Range, Regex)
  const props = schema.properties || {};

  for (const [field, rules] of Object.entries(props)) {
    const value = data[field];

    // Skip optional undefined fields
    if (value === undefined || value === null) continue;

    // Type Check
    if (rules.type) {
      const actualType = typeof value;
      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push({ field, message: `'${field}' must be an Array.`, code: 'INVALID_TYPE' });
        continue;
      } else if (rules.type !== 'array' && actualType !== rules.type) {
        errors.push({ field, message: `'${field}' must be of type ${rules.type}, received ${actualType}.`, code: 'INVALID_TYPE' });
        continue;
      }
    }

    // String Specific Checks
    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (rules.minLength !== undefined && trimmed.length < rules.minLength) {
        errors.push({
          field,
          message: `'${field}' must be at least ${rules.minLength} characters long (received ${trimmed.length}).`,
          code: 'MIN_LENGTH_VIOLATION'
        });
      }

      if (rules.maxLength !== undefined && trimmed.length > rules.maxLength) {
        errors.push({
          field,
          message: `'${field}' must not exceed ${rules.maxLength} characters (received ${trimmed.length}).`,
          code: 'MAX_LENGTH_VIOLATION'
        });
      }

      // Format Checks (email, phone, url, name, etc.)
      if (rules.format && PATTERNS[rules.format]) {
        if (!PATTERNS[rules.format].test(trimmed)) {
          errors.push({
            field,
            message: `'${field}' contains an invalid ${rules.format} format.`,
            code: 'INVALID_FORMAT'
          });
        }
      }

      // Custom Regex Pattern
      if (rules.pattern && rules.pattern instanceof RegExp) {
        if (!rules.pattern.test(value)) {
          errors.push({
            field,
            message: `'${field}' does not match required format pattern.`,
            code: 'PATTERN_MISMATCH'
          });
        }
      }

      // Enum Allowed Values
      if (rules.enum && Array.isArray(rules.enum)) {
        if (!rules.enum.includes(value)) {
          errors.push({
            field,
            message: `'${field}' must be one of: [${rules.enum.join(', ')}].`,
            code: 'INVALID_ENUM'
          });
        }
      }
    }

    // Number Specific Checks
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push({ field, message: `'${field}' must be at least ${rules.min}.`, code: 'MIN_VALUE_VIOLATION' });
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push({ field, message: `'${field}' must not exceed ${rules.max}.`, code: 'MAX_VALUE_VIOLATION' });
      }
    }

    // Array Specific Checks
    if (Array.isArray(value)) {
      if (rules.minItems !== undefined && value.length < rules.minItems) {
        errors.push({ field, message: `'${field}' must contain at least ${rules.minItems} items.`, code: 'MIN_ITEMS_VIOLATION' });
      }
      if (rules.maxItems !== undefined && value.length > rules.maxItems) {
        errors.push({ field, message: `'${field}' must not contain more than ${rules.maxItems} items.`, code: 'MAX_ITEMS_VIOLATION' });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Express Middleware for strict Body validation
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = validateData(schema, req.body || {});
    if (!result.valid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Input validation failed. Request payload does not match required schema.',
        validationErrors: result.errors
      });
    }
    next();
  };
}

/**
 * Express Middleware for strict Query validation
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const result = validateData(schema, req.query || {});
    if (!result.valid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter validation failed.',
        validationErrors: result.errors
      });
    }
    next();
  };
}

module.exports = {
  validateData,
  validateBody,
  validateQuery,
  PATTERNS
};
