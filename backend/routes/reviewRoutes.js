import { Router } from 'express';
import { getReviews, createReview } from '../controllers/reviewController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/:productId', getReviews);
router.post('/:productId', authenticateToken, createReview);

export default router;
