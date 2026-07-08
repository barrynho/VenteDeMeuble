import express from 'express';
import { authenticateToken, requireDeliveryPerson, requireAdmin } from '../middlewares/authMiddleware.js';
import {
  registerDeliveryPerson,
  loginDeliveryPerson,
  getDeliveryPersonProfile,
  updateAvailability,
  updateLocation,
  getAssignedOrders,
  acceptOrder,
  updateDeliveryStatus,
  getAllDeliveryPersons,
  updateDeliveryPersonStatus,
} from '../controllers/deliveryPersonController.js';

const router = express.Router();

// Routes publiques
router.post('/register', registerDeliveryPerson);
router.post('/login', loginDeliveryPerson);

// Routes protégées (nécessitent authentification livreur)
router.get('/profile', authenticateToken, requireDeliveryPerson, getDeliveryPersonProfile);
router.put('/availability', authenticateToken, requireDeliveryPerson, updateAvailability);
router.put('/location', authenticateToken, requireDeliveryPerson, updateLocation);
router.get('/orders', authenticateToken, requireDeliveryPerson, getAssignedOrders);
router.put('/orders/:orderId/accept', authenticateToken, requireDeliveryPerson, acceptOrder);
router.put('/orders/:orderId/status', authenticateToken, requireDeliveryPerson, updateDeliveryStatus);

// Routes admin
router.get('/all', authenticateToken, requireAdmin, getAllDeliveryPersons);
router.put('/:id/status', authenticateToken, requireAdmin, updateDeliveryPersonStatus);

export default router;
