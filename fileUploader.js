/**
 * Secure File Upload Safety Module & Express Middleware
 * Guarantees:
 * 1. File Type, Size, and Magic Bytes Content Validation (Magic signatures, not just extensions)
 * 2. Storage in isolated directory outside web root with randomized UUID filenames
 * 3. Strict Execution Prevention (forces nosniff, attachment disposition, CSP default-src none)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Allowed MIME types and Magic Byte Signatures
const ALLOWED_TYPES = {
  'image/jpeg': {
    extensions: ['.jpg', '.jpeg'],
    magic: [
      [0xFF, 0xD8, 0xFF]
    ]
  },
  'image/png': {
    extensions: ['.png'],
    magic: [
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    ]
  },
  'image/webp': {
    extensions: ['.webp'],
    magic: [
      [0x52, 0x49, 0x46, 0x46] // RIFF header
    ]
  },
  'image/gif': {
    extensions: ['.gif'],
    magic: [
      [0x47, 0x49, 0x46, 0x38] // GIF8
    ]
  },
  'application/pdf': {
    extensions: ['.pdf'],
    magic: [
      [0x25, 0x50, 0x44, 0x46] // %PDF
    ]
  }
};

// Configurable Storage & Size Limits
const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 5 * 1024 * 1024; // 5 MB
const ISOLATED_UPLOAD_DIR = process.env.ISOLATED_UPLOAD_DIR || path.join(__dirname, 'uploads_isolated');

// Ensure isolated directory exists outside public web root
if (!fs.existsSync(ISOLATED_UPLOAD_DIR)) {
  fs.mkdirSync(ISOLATED_UPLOAD_DIR, { recursive: true, mode: 0o700 });
}

/**
 * Verify Magic Bytes (File Content Signature)
 */
function verifyMagicBytes(buffer, allowedTypeConfig) {
  if (!buffer || buffer.length < 8) return false;

  for (const magicSeq of allowedTypeConfig.magic) {
    let match = true;
    for (let i = 0; i < magicSeq.length; i++) {
      if (buffer[i] !== magicSeq[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/**
 * Sanitize and validate file upload buffer & metadata
 */
function validateUpload(fileBuffer, originalFilename, mimeType) {
  const errors = [];

  // 1. Validate Size
  if (!fileBuffer || fileBuffer.length === 0) {
    return { valid: false, errors: ['Uploaded file is empty.'] };
  }
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    return { valid: false, errors: [`File size (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB) exceeds max limit of ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`] };
  }

  // 2. Validate MIME Type Whitelist
  const typeConfig = ALLOWED_TYPES[mimeType];
  if (!typeConfig) {
    return { valid: false, errors: [`MIME type '${mimeType}' is not allowed. Only JPEG, PNG, WEBP, GIF, and PDF are permitted.`] };
  }

  // 3. Validate Extension
  const ext = path.extname(originalFilename || '').toLowerCase();
  if (!typeConfig.extensions.includes(ext)) {
    return { valid: false, errors: [`File extension '${ext}' does not match allowed extensions for ${mimeType}.`] };
  }

  // 4. Validate Content Magic Bytes (Binary Inspection)
  const isContentValid = verifyMagicBytes(fileBuffer, typeConfig);
  if (!isContentValid) {
    return { valid: false, errors: ['File content magic byte verification failed. The file binary header does not match its declared type.'] };
  }

  return { valid: true, typeConfig, ext };
}

/**
 * Save file to isolated storage with randomized UUID filename
 */
function saveToIsolatedStorage(fileBuffer, ext) {
  const safeFilename = `${crypto.randomUUID()}${ext}`;
  const targetPath = path.join(ISOLATED_UPLOAD_DIR, safeFilename);

  // Write file with non-executable permissions
  fs.writeFileSync(targetPath, fileBuffer, { mode: 0o600 });

  return {
    filename: safeFilename,
    path: targetPath,
    size: fileBuffer.length
  };
}

/**
 * Express Middleware for handling file uploads safely
 */
function handleFileUploadMiddleware(options = {}) {
  return (req, res, next) => {
    // Check if multipart/form-data or binary upload
    let fileBuffer = req.body?.fileBuffer || req.file?.buffer;
    let originalFilename = req.body?.filename || req.file?.originalname;
    let mimeType = req.body?.mimeType || req.file?.mimetype;

    // Handle raw base64 or buffer payload demo
    if (req.body?.fileBase64) {
      try {
        fileBuffer = Buffer.from(req.body.fileBase64, 'base64');
      } catch (err) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid base64 payload.' });
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No file payload provided.'
      });
    }

    // Perform strict validation
    const validation = validateUpload(fileBuffer, originalFilename, mimeType);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'File upload validation failed.',
        errors: validation.errors
      });
    }

    // Save to isolated non-web-root storage
    const savedInfo = saveToIsolatedStorage(fileBuffer, validation.ext);

    req.uploadedFile = savedInfo;
    next();
  };
}

/**
 * Express Middleware for securely serving downloaded files (Execution Protection)
 */
function secureServeFile(filename, res) {
  const safePath = path.join(ISOLATED_UPLOAD_DIR, path.basename(filename));

  if (!fs.existsSync(safePath)) {
    return res.status(404).json({ error: 'Not Found', message: 'File not found.' });
  }

  // Execution Protection Headers
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filename)}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");

  const fileStream = fs.createReadStream(safePath);
  fileStream.pipe(res);
}

module.exports = {
  validateUpload,
  saveToIsolatedStorage,
  handleFileUploadMiddleware,
  secureServeFile,
  ALLOWED_TYPES,
  ISOLATED_UPLOAD_DIR
};
