import { v2 as cloudinary } from 'cloudinary';

class CloudinaryService {
  static isConfigured() {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  static configure() {
    if (this.isConfigured()) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      return true;
    }
    return false;
  }

  static async uploadImage(buffer, originalFilename) {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary not configured');
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'qams/images',
          resource_type: 'image',
          public_id: `img_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(buffer);
    });
  }

  static getFallbackUrl(filename, isProduction = false) {
    if (isProduction) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      return `${backendUrl}/uploads/images/questions/${filename}`;
    }
    return `/uploads/images/questions/${filename}`;
  }
}

// Auto-configure if available
CloudinaryService.configure();

export default CloudinaryService;