import path from 'path';
import fs from 'fs';

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
};

export default function handler(req, res) {
  const { path: filePathParts } = req.query;
  const fileRelativePath = Array.isArray(filePathParts) ? filePathParts.join('/') : filePathParts;
  
  // Resolve path safely relative to the project root
  const absolutePath = path.resolve(process.cwd(), 'backend', 'uploads', fileRelativePath);

  // Prevent directory traversal attacks
  const uploadsDir = path.resolve(process.cwd(), 'backend', 'uploads');
  if (!absolutePath.startsWith(uploadsDir)) {
    return res.status(403).end('Forbidden');
  }

  if (fs.existsSync(absolutePath)) {
    try {
      const stat = fs.statSync(absolutePath);
      const ext = path.extname(absolutePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      
      const readStream = fs.createReadStream(absolutePath);
      readStream.pipe(res);
    } catch (err) {
      console.error('Error serving upload file:', err);
      res.status(500).end('Internal Server Error');
    }
  } else {
    res.status(404).end('Not Found');
  }
}
