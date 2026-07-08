import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import {
  sendMessage,
  getOrderMessages,
  markMessagesAsRead,
  getUserConversations,
  getDeliveryPersonConversations,
  getUnreadCount,
} from '../controllers/messageController.js';

const router = express.Router();

// Routes protégées (nécessitent authentification)
router.post('/', authenticateToken, sendMessage);
router.get('/order/:orderId', authenticateToken, getOrderMessages);
router.put('/order/:orderId/read', authenticateToken, markMessagesAsRead);
router.get('/conversations/user', authenticateToken, getUserConversations);
router.get('/conversations/delivery', authenticateToken, getDeliveryPersonConversations);
router.get('/unread/count', authenticateToken, getUnreadCount);

export default router;
