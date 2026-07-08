import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getStats,
  getAdminOrders,
  updateOrderStatus,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  exportSalesCSV,
  assignDeliveryPerson,
  getAvailableDeliveryPersons
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Multer disk storage configuration for product photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Erreur : Seules les images sont autorisées !'));
    }
  }
});

// Protect all admin routes with authentication & admin role guards
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', getStats);

// Orders management
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.put('/orders/:orderId/assign-delivery', assignDeliveryPerson);
router.get('/delivery/available', getAvailableDeliveryPersons);

// Products CRUD (with upload.array for multiple image uploads)
router.post('/products', upload.array('images', 5), createAdminProduct);
router.put('/products/:id', upload.array('images', 5), updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);

// Coupons CRUD
router.get('/coupons', getAdminCoupons);
router.post('/coupons', createAdminCoupon);
router.put('/coupons/:id', updateAdminCoupon);
router.delete('/coupons/:id', deleteAdminCoupon);

// Sales CSV export
router.get('/exports/sales', exportSalesCSV);

export default router;
