import { Review, User } from '../models/index.js';

export async function getReviews(req, res) {
  try {
    const { productId } = req.params;
    const reviews = await Review.findAll({
      where: { productId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'photoUrl'] }],
      order: [['createdAt', 'DESC']]
    });
    return res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ message: 'Erreur lors du chargement des avis.' });
  }
}

export async function createReview(req, res) {
  try {
    const { productId } = req.params;
    const { rating, comment, images } = req.body;
    const userId = req.user.id;

    if (!rating) {
      return res.status(400).json({ message: 'La note est obligatoire.' });
    }

    const review = await Review.create({
      productId,
      userId,
      rating: parseInt(rating),
      comment,
      images: images || []
    });

    const populatedReview = await Review.findByPk(review.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'photoUrl'] }]
    });

    return res.status(201).json({
      message: 'Avis publié avec succès.',
      review: populatedReview
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ message: 'Erreur lors de la publication de l\'avis.' });
  }
}
