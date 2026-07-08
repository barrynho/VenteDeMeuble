import { Router } from 'express';
import { createOrder, getOrders, getOrderById, getInvoice } from '../controllers/orderController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getOrders);
router.get('/:id', authenticateToken, getOrderById);
router.get('/:id/invoice', authenticateToken, getInvoice);

export default router;
