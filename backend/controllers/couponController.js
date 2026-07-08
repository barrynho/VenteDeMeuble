import { Coupon } from '../models/index.js';
import { Op } from 'sequelize';

export async function validateCoupon(req, res) {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Veuillez fournir un code promo.' });
    }

    const coupon = await Coupon.findOne({
      where: {
        code: code.trim().toUpperCase(),
        isActive: true,
        [Op.or]: [
          { expiresAt: { [Op.gt]: new Date() } },
          { expiresAt: null }
        ]
      }
    });

    if (!coupon) {
      return res.status(400).json({ message: 'Code promo invalide, expiré ou inactif.' });
    }

    if (subtotal && parseFloat(subtotal) < parseFloat(coupon.minOrderValue)) {
      return res.status(400).json({
        message: `Ce code promo nécessite un achat minimum de ${coupon.minOrderValue} €.`
      });
    }

    return res.json({
      message: 'Code promo appliqué avec succès !',
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    return res.status(500).json({ message: 'Erreur lors de la validation du code promo.' });
  }
}
