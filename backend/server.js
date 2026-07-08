import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer } from 'http';

import sequelize, { initializeDatabase } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import deliveryPersonRoutes from './routes/deliveryPersonRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { initializeSocket } from './socket.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded product images
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery', deliveryPersonRoutes);
app.use('/api/messages', messageRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API E-Commerce Premium.' });
});

// Start DB and Express server
async function startServer() {
  try {
    // 1. Initialize and sync database
    await initializeDatabase();
    
    // Test connection & sync models
    await sequelize.authenticate();
    console.log('Database connection authenticated.');
    
    await sequelize.sync();
    // await sequelize.sync({ alter: true });
    console.log('Database models synchronized (created missing tables safely).');

    // 2. Initialize Socket.io
    initializeSocket(server);
    console.log('Socket.io initialized.');

    // 3. Start HTTP server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Uploaded photos served at http://localhost:${PORT}/uploads/`);
      console.log(`WebSocket server ready for real-time communication`);
    });
  } catch (error) {
    console.error('Failed to initialize database or start server:', error);
    console.log('Express server starting in offline mode (please launch WampServer MySQL)...');
    
    initializeSocket(server);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running in offline fallback mode on http://localhost:${PORT}`);
    });
  }
}

startServer();
