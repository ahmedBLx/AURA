const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Get file extension based on image buffer signature
 * @param {Buffer} buffer 
 * @returns {string}
 */
const getExtension = (buffer) => {
  if (buffer && buffer.length > 4) {
    const hex = buffer.toString('hex', 0, 4).toUpperCase();
    if (hex.startsWith('89504E47')) return '.png';
    if (hex.startsWith('FFD8FF')) return '.jpg';
    if (hex.startsWith('47494638')) return '.gif';
    if (hex.startsWith('52494646')) return '.webp';
  }
  return '.jpg'; // default fallback
};

/**
 * Helper to save image buffer directly to local storage
 * @param {Buffer} buffer 
 * @returns {string} - relative file path
 */
const saveToLocalStorage = (buffer) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const ext = getExtension(buffer);
  const filename = crypto.randomBytes(16).toString('hex') + ext;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);
  return `uploads/${filename}`;
};

/**
 * Upload a buffer to Cloudinary, with a robust local storage fallback.
 * @param {Buffer} buffer  - File buffer from multer memoryStorage
 * @param {string} folder  - Cloudinary folder (e.g. 'aura/products')
 * @returns {Promise<string>} - Secure URL or local path of the uploaded image
 */
const uploadToCloudinary = (buffer, folder = 'aura/products') => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured or has invalid placeholder name
    const hasInvalidName = !process.env.CLOUDINARY_CLOUD_NAME || 
                          process.env.CLOUDINARY_CLOUD_NAME === 'AURA-DARE' || 
                          process.env.CLOUDINARY_CLOUD_NAME.includes('your_');
    const hasMissingKeys = !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET;

    if (hasInvalidName || hasMissingKeys) {
      // Vercel filesystem is read-only — local fallback cannot work there.
      if (process.env.VERCEL) {
        reject(new Error('Cloudinary credentials are required for image uploads on Vercel. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel environment variables.'));
        return;
      }
      // Local dev only — writable filesystem, acceptable for development without Cloudinary.
      console.warn('Cloudinary not configured — saving to local uploads/ for development only.');
      try {
        const localPath = saveToLocalStorage(buffer);
        resolve(localPath);
      } catch (localErr) {
        reject(new Error(`Local storage fallback failed: ${localErr.message}`));
      }
      return;
    }

    try {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
            return;
          }
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    } catch (syncError) {
      reject(new Error(`Cloudinary upload error: ${syncError.message}`));
    }
  });
};

module.exports = { cloudinary, uploadToCloudinary };
