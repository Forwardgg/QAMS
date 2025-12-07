// controllers/UploadController.js
import { QuestionMedia } from "../models/QuestionMedia.js"; // Add .js extension

const logRequest = (req) => {
  console.log('Upload request:', {
    method: req.method,
    path: req.path,
    userId: req.user?.user_id ?? null,
    role: req.user?.role ?? null,
    timestamp: new Date().toISOString()
  });
};

export const uploadFile = async (req, res) => {
  logRequest(req);

  try {
    const userId = req.user?.user_id ?? null;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File upload details:', {
      userId,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Use QuestionMedia instead of UploadService
    QuestionMedia.validateFile(req.file);

    // Validate signature
    if (!QuestionMedia.isBufferSignatureValid(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({ error: 'File signature does not match declared mimetype' });
    }

    // Generate unique filename
    const filename = QuestionMedia.generateFilename(req.file.originalname, req.file.mimetype);

    // Save file using hybrid approach
    const uploadResult = await QuestionMedia.saveFileHybrid(
      req.file.buffer, 
      filename, 
      req.file.mimetype
    );

    // Parse optional relation IDs
    const question_id = req.body.question_id ? Number(req.body.question_id) : null;
    const paper_id = req.body.paper_id ? Number(req.body.paper_id) : null;

    // Save media record to DB using QuestionMedia
    let mediaRecord;
    try {
      mediaRecord = await QuestionMedia.create({
        filename,
        mimetype: req.file.mimetype,
        uploadResult,
        question_id,
        paper_id
      });
    } catch (dbErr) {
      // Cleanup file on DB failure
      if (!uploadResult.isCloudinary) {
        try {
          await QuestionMedia.deleteFileIfExists(filename, 'images/questions');
        } catch (cleanupErr) {
          console.warn('Failed to cleanup uploaded file after DB error', cleanupErr);
        }
      }
      throw dbErr;
    }

    console.log('File uploaded successfully:', {
      mediaId: mediaRecord?.media_id,
      filename,
      userId,
      isCloudinary: uploadResult.isCloudinary,
      url: uploadResult.url
    });

    return res.status(201).json({
      success: true,
      media_id: mediaRecord.media_id,
      url: uploadResult.url, // Return the URL that CKEditor should use
      publicUrl: uploadResult.url,
      isCloudinary: uploadResult.isCloudinary || false,
      message: 'File uploaded successfully'
    });

  } catch (err) {
    console.error('uploadFile error:', err?.stack ?? err?.message ?? err);
    const status = (err && /no file uploaded|file size|invalid file type|signature/i.test(err.message || '')) ? 400 : 500;
    return res.status(status).json({ error: err.message ?? 'Upload failed' });
  }
};

export const getUploadConfig = async (req, res) => {
  logRequest(req);
  try {
    return res.json({
      allowed_types: Object.keys(QuestionMedia.allowedMimeTypes),
      max_file_size: QuestionMedia.maxFileSize,
      upload_url: '/api/uploads' // This should match your route
    });
  } catch (err) {
    console.error('getUploadConfig error:', err?.stack ?? err?.message ?? err);
    return res.status(500).json({ error: 'Server error while fetching upload config' });
  }
};