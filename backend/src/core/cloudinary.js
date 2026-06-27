const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getExtension = (buffer) => {
  if (buffer && buffer.length > 4) {
    const hex = buffer.toString('hex', 0, 4).toUpperCase();
    if (hex.startsWith('89504E47')) return '.png';
    if (hex.startsWith('FFD8FF')) return '.jpg';
    if (hex.startsWith('47494638')) return '.gif';
    if (hex.startsWith('52494646')) return '.webp';
  }
  return '.jpg';
};

const getUploadsDir = () => {
  const cwd = process.cwd();
  if (cwd.endsWith('backend') || cwd.endsWith('backend\\') || cwd.endsWith('backend/')) {
    return path.join(cwd, 'uploads');
  }
  return path.join(cwd, 'backend', 'uploads');
};

const saveToLocalStorage = (buffer) => {
  const uploadsDir = getUploadsDir();
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const ext = getExtension(buffer);
  const filename = crypto.randomBytes(16).toString('hex') + ext;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);
  return `uploads/${filename}`;
};

const uploadToCloudinary = (buffer, folder = 'aura/products') => {
  return new Promise((resolve, reject) => {
    const hasInvalidName = !process.env.CLOUDINARY_CLOUD_NAME || 
                          process.env.CLOUDINARY_CLOUD_NAME === 'AURA-DARE' || 
                          process.env.CLOUDINARY_CLOUD_NAME.includes('your_');
    const hasMissingKeys = !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET;

    if (hasInvalidName || hasMissingKeys) {
      if (process.env.VERCEL) {
        reject(new Error('Cloudinary credentials are required for image uploads on Vercel. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel environment variables.'));
        return;
      }
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
