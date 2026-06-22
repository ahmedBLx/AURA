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

const saveToLocalStorage = (buffer) => {
  const uploadsDir = path.join(__dirname, '../../uploads');
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
      console.warn('Cloudinary is not configured or holds a placeholder name. Routing to local storage directly.');
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
            console.warn('Cloudinary upload callback failed, falling back to local file storage:', error.message);
            try {
              const localPath = saveToLocalStorage(buffer);
              resolve(localPath);
            } catch (localErr) {
              reject(new Error(`Cloudinary upload failed (${error.message}) and local fallback failed (${localErr.message})`));
            }
            return;
          }
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    } catch (syncError) {
      console.warn('Cloudinary stream creation failed synchronously, falling back to local file storage:', syncError.message);
      try {
        const localPath = saveToLocalStorage(buffer);
        resolve(localPath);
      } catch (localErr) {
        reject(new Error(`Cloudinary sync error (${syncError.message}) and local fallback failed (${localErr.message})`));
      }
    }
  });
};

module.exports = { cloudinary, uploadToCloudinary };
