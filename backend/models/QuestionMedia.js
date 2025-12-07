// backend/models/QuestionMedia.js
import { pool } from "../config/db.js";
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import CloudinaryService from "../services/CloudinaryService.js";

export class QuestionMedia {
  static _ensureInteger(val, name) {
    const n = Number(val);
    if (!Number.isInteger(n)) throw new Error(`${name} must be an integer.`);
    return n;
  }
  
  static _ensureNonEmptyString(val, name) {
    if (val === undefined || val === null || String(val).trim() === "") {
      throw new Error(`${name} is required and cannot be empty.`);
    }
  }
  
  static _ensureBuffer(val, name) {
    if (!Buffer.isBuffer(val)) throw new Error(`${name} must be a Buffer.`);
  }

  static allowedMimeTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };

  static maxFileSize = 5 * 1024 * 1024; // 5MB

  /**
   * Validate file object
   */
  static validateFile(file) {
    this._ensureNonEmptyString(file?.originalname, 'File name');
    this._ensureNonEmptyString(file?.mimetype, 'File MIME type');
    this._ensureBuffer(file?.buffer, 'File buffer');

    if (file.size > this.maxFileSize) {
      throw new Error(`File size too large. Max: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    if (!this.allowedMimeTypes[file.mimetype]) {
      throw new Error(`Invalid file type. Allowed: ${Object.keys(this.allowedMimeTypes).join(', ')}`);
    }

    return true;
  }

  /**
   * Validate file signature (magic bytes)
   */
  static isBufferSignatureValid(buffer, mimetype) {
    this._ensureBuffer(buffer, 'File buffer');
    this._ensureNonEmptyString(mimetype, 'MIME type');

    if (buffer.length < 4) return false;

    try {
      if (mimetype === 'image/png') {
        return buffer.slice(0, 8).equals(Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]));
      }
      if (mimetype === 'image/jpeg') {
        return buffer[0] === 0xFF && buffer[1] === 0xD8;
      }
      if (mimetype === 'image/gif') {
        const signature = buffer.slice(0,6).toString('ascii');
        return signature === 'GIF89a' || signature === 'GIF87a';
      }
      if (mimetype === 'image/webp') {
        return buffer.slice(0,4).toString('ascii') === 'RIFF' && buffer.slice(8,12).toString('ascii') === 'WEBP';
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Generate safe filename
   */
  static generateFilename(originalName, mimetype) {
    this._ensureNonEmptyString(originalName, 'Original file name');
    this._ensureNonEmptyString(mimetype, 'MIME type');

    const ext = this.allowedMimeTypes[mimetype] || 'bin';
    const random = crypto.randomBytes(10).toString('hex');
    return `${Date.now()}-${random}.${ext}`;
  }

  /**
   * Basic filename sanitizer - ensure no path traversal
   */
  static sanitizeFilename(filename) {
    if (!filename) throw new Error('Filename is required');
    const base = path.basename(filename);
    if (base !== filename) throw new Error('Invalid filename');
    if (filename.includes('..')) throw new Error('Invalid filename');
    return base;
  }

  /**
   * Save file to disk
   */
  static async saveFileToDisk(buffer, filename, subfolder = 'images/questions') {
    this._ensureBuffer(buffer, 'File buffer');
    this._ensureNonEmptyString(filename, 'Filename');
    this._ensureNonEmptyString(subfolder, 'Subfolder');

    const safeFilename = this.sanitizeFilename(filename);

    const uploadDir = path.join(process.cwd(), 'uploads', subfolder);
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeFilename);
    await fs.promises.writeFile(filePath, buffer);

    return filePath;
  }

  /**
   * Delete file if exists
   */
  static async deleteFileIfExists(filename, subfolder = 'images/questions') {
    this._ensureNonEmptyString(filename, 'Filename');
    const safeFilename = this.sanitizeFilename(filename);

    try {
      const fullPath = path.join(process.cwd(), 'uploads', subfolder, safeFilename);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (err) {
      console.warn('Failed to delete file during cleanup', err);
    }
  }

  /**
   * Create media record
   */
  static async create({ filename, mimetype, uploadResult, question_id = null, paper_id = null }) {
  this._ensureNonEmptyString(filename, 'Filename');
  this._ensureNonEmptyString(mimetype, 'MIME type');

  const safeFilename = this.sanitizeFilename(filename);
  
  // Use URL from uploadResult if available, otherwise generate local URL
  const mediaUrl = uploadResult?.url || `/uploads/images/questions/${safeFilename}`;

  const query = `
    INSERT INTO question_media (
      question_id,
      paper_id,
      media_url,
      media_type,
      is_used,
      created_at
    )
    VALUES ($1, $2, $3, $4, false, NOW())
    RETURNING media_id, question_id, paper_id, media_url, media_type, created_at
  `;

  const values = [question_id, paper_id, mediaUrl, mimetype];

  const result = await pool.query(query, values);
  return result.rows[0];
}

  /**
   * Find by media_id
   */
  static async findById(mediaId) {
    this._ensureInteger(mediaId, 'Media ID');

    const query = `
      SELECT * FROM question_media 
      WHERE media_id = $1 AND deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [mediaId]);
    return result.rows[0];
  }

  /**
   * Find by question_id
   */
  static async findByQuestionId(questionId) {
    this._ensureInteger(questionId, 'Question ID');

    const query = `
      SELECT * FROM question_media 
      WHERE question_id = $1 AND deleted_at IS NULL
      ORDER BY created_at
    `;
    
    const result = await pool.query(query, [questionId]);
    return result.rows;
  }

  /**
   * Find by paper_id
   */
  static async findByPaperId(paperId) {
    this._ensureInteger(paperId, 'Paper ID');

    const query = `
      SELECT * FROM question_media 
      WHERE paper_id = $1 AND deleted_at IS NULL
      ORDER BY created_at
    `;
    
    const result = await pool.query(query, [paperId]);
    return result.rows;
  }

  /**
   * Update media record
   */
  static async update(mediaId, updates) {
    this._ensureInteger(mediaId, 'Media ID');

    const allowedFields = ['question_id', 'paper_id', 'is_used'];
    const setClauses = [];
    const values = [];
    let paramCount = 0;

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        paramCount++;
        setClauses.push(`${field} = $${paramCount}`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramCount++;
    setClauses.push(`updated_at = NOW()`);
    values.push(mediaId);

    const query = `
      UPDATE question_media 
      SET ${setClauses.join(', ')}
      WHERE media_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Link media to question
   */
  static async linkToQuestion(mediaId, questionId) {
    this._ensureInteger(mediaId, 'Media ID');
    this._ensureInteger(questionId, 'Question ID');

    const query = `
      UPDATE question_media 
      SET question_id = $1, is_used = true, updated_at = NOW()
      WHERE media_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [questionId, mediaId]);
    return result.rows[0];
  }

  /**
   * Unlink media from question
   */
  static async unlinkFromQuestion(mediaId) {
    this._ensureInteger(mediaId, 'Media ID');

    const query = `
      UPDATE question_media 
      SET question_id = NULL, is_used = FALSE, updated_at = NOW()
      WHERE media_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [mediaId]);
    return result.rows[0];
  }

  /**
   * Delete media record (hard delete)
   */
  static async delete(mediaId) {
    this._ensureInteger(mediaId, 'Media ID');

    const query = `
      DELETE FROM question_media 
      WHERE media_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [mediaId]);
    return result.rows[0];
  }

  /**
   * Get public URL for filename
   */
  static getPublicUrl(filename) {
    this._ensureNonEmptyString(filename, 'Filename');
    const safeFilename = path.basename(filename);
    return `/uploads/images/questions/${safeFilename}`;
  }

  /**
   * Extract media URLs from HTML content (same regex as Question)
   */
  static extractMediaUrls(htmlContent) {
    if (!htmlContent) return [];

    const mediaUrls = [];
    const imgRegex = /<img[^>]+src=["']((?:https?:\/\/|\/)[^"']+)["'][^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(htmlContent)) !== null) {
      if (match[1]) {
        mediaUrls.push(match[1]);
      }
    }

    return mediaUrls;
  }

  /**
   * Find media records by URLs
   */
  static async findByUrls(urls) {
    if (!Array.isArray(urls) || urls.length === 0) return [];

    const placeholders = urls.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT * FROM question_media 
      WHERE media_url IN (${placeholders}) AND deleted_at IS NULL
    `;

    const result = await pool.query(query, urls);
    return result.rows;
  }
  static async saveFileHybrid(buffer, filename, mimetype) {
  this._ensureBuffer(buffer, 'File buffer');
  this._ensureNonEmptyString(filename, 'Filename');
  
  const safeFilename = this.sanitizeFilename(filename);
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Try Cloudinary in production if configured
  if (isProduction && CloudinaryService.isConfigured()) {
    try {
      const result = await CloudinaryService.uploadImage(buffer, safeFilename);
      return {
        url: result.secure_url,
        isCloudinary: true,
        cloudinaryId: result.public_id
      };
    } catch (cloudinaryError) {
      console.warn('Cloudinary upload failed, using local storage:', cloudinaryError.message);
      // Fall through to local storage
    }
  }
  
  // Local storage (works for both dev and prod fallback)
  const filePath = await this.saveFileToDisk(buffer, safeFilename, 'images/questions');
  
  return {
    url: CloudinaryService.getFallbackUrl(safeFilename, isProduction),
    isCloudinary: false,
    filePath
  };
}

/**
 * Update getPublicUrl to handle hybrid approach
 */
static getPublicUrl(uploadResult) {
  if (!uploadResult || !uploadResult.url) return '';
  return uploadResult.url;
}
}
