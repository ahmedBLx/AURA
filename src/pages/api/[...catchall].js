import app from '../../../backend/server';
import { Server } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  // Initialize Socket.io only once on the Next.js server instance (when not running in serverless Vercel environment)
  if (!res.socket.server.io && !process.env.VERCEL) {
    console.log('Initializing Socket.io server on Next.js...');
    const io = new Server(res.socket.server, {
      path: '/socket.io',
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      },
    });
    res.socket.server.io = io;
    
    io.on('connection', (socket) => {
      console.log(`Socket client connected to Next.js: ${socket.id}`);
      socket.on('disconnect', () => {
        console.log(`Socket client disconnected from Next.js: ${socket.id}`);
      });
    });
  }

  // Ensure the current hot-reloaded Express app instance has reference to the active socket server
  if (res.socket.server.io) {
    app.set('io', res.socket.server.io);
  }

  return new Promise((resolve) => {
    app(req, res, (err) => {
      if (err) {
        console.error('Express sub-app error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: err.message || 'Internal Server Error' });
        }
      }
      resolve();
    });
  });
}
