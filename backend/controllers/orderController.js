import sequelize from '../config/db.js';
import {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Color,
  Size,
  Coupon,
  Notification
} from '../models/index.js';
import { generateInvoicePDF } from '../services/invoiceService.js';

export async function createOrder(req, res) {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const {
      items, // array of { productId, colorId, sizeId, quantity }
      shippingMethod, // 'pickup', 'home', 'relay'
      shippingAddress, // object: { name, phone, street, city, country, instructions }
      paymentMethod, // 'mobile_money', 'card', 'whatsapp', 'cash'
      couponCode,
      paymentDetails // e.g. mobile money transaction reference
    } = req.body;

    if (!items || items.length === 0 || !shippingAddress) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Panier vide ou adresse de livraison manquante.' });
    }

    // 1. Validate items, calculate pricing and check stock
    let subtotal = 0;
    const orderItemsToCreate = [];
    const variantsToUpdate = [];

    for (const item of items) {
      const { productId, colorId, sizeId, quantity } = item;

      // Find the product
      const product = await Product.findByPk(productId);
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ message: `Produit ${productId} non trouvé.` });
      }

      // Find the specific variant
      const variant = await ProductVariant.findOne({
        where: { productId, colorId, sizeId }
      });

      if (!variant) {
        await transaction.rollback();
        return res.status(400).json({
          message: `La variante (Taille/Couleur) du produit ${product.name} n'existe pas.`
        });
      }

      if (variant.stock < quantity) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Stock insuffisant pour le produit ${product.name}. Stock disponible: ${variant.stock}`
        });
      }

      const price = parseFloat(product.price);
      subtotal += price * quantity;

      orderItemsToCreate.push({
        productId,
        colorId,
        sizeId,
        quantity,
        price
      });

      variantsToUpdate.push({
        variant,
        newStock: variant.stock - quantity
      });
    }

    // 2. Shipping fees & Tax
    let shippingFee = 0;
    if (shippingMethod === 'home') {
      shippingFee = 5.00; // Flat rate for home delivery
    } else if (shippingMethod === 'relay') {
      shippingFee = 3.00; // Relay point delivery
    }

    // 3. Apply coupon if provided
    let discountAmount = 0;
    let validCouponCode = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        where: { code: couponCode.trim().toUpperCase(), isActive: true }
      });

      if (coupon && subtotal >= parseFloat(coupon.minOrderValue)) {
        validCouponCode = coupon.code;
        if (coupon.type === 'percent') {
          discountAmount = subtotal * (parseFloat(coupon.value) / 100);
        } else if (coupon.type === 'fixed') {
          discountAmount = parseFloat(coupon.value);
        } else if (coupon.type === 'free_shipping') {
          discountAmount = shippingFee;
          shippingFee = 0;
        }
      }
    }

    const total = subtotal + shippingFee - discountAmount;

    // 4. Update stock in DB
    for (const item of variantsToUpdate) {
      item.variant.stock = item.newStock;
      await item.variant.save({ transaction });
    }

    // 5. Create Order
    const orderNumber = 'CMD-' + Date.now().toString().slice(-8).toUpperCase();
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://premium-boutique.com/orders/${orderNumber}`;

    const order = await Order.create({
      userId,
      orderNumber,
      status: paymentMethod === 'whatsapp' ? 'confirmed' : 'pending',
      shippingMethod,
      shippingAddress,
      subtotal,
      shippingFee,
      total,
      paymentMethod,
      paymentDetails: paymentDetails || {},
      couponCode: validCouponCode,
      discountAmount,
      qrCode
    }, { transaction });

    // 6. Create Order Items
    for (const orderItem of orderItemsToCreate) {
      await OrderItem.create({
        orderId: order.id,
        productId: orderItem.productId,
        colorId: orderItem.colorId,
        sizeId: orderItem.sizeId,
        quantity: orderItem.quantity,
        price: orderItem.price
      }, { transaction });
    }

    // 7. Create Notification in DB
    await Notification.create({
      userId,
      title: 'Commande reçue !',
      content: `Votre commande ${orderNumber} a été enregistrée avec succès. Mode de paiement : ${paymentMethod}.`,
      type: 'order'
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: 'Commande validée avec succès.',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        qrCode: order.qrCode
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Erreur lors de la validation de la commande.' });
  }
}

export async function getOrders(req, res) {
  try {
    const userId = req.user.id;
    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'brand'] },
            { model: Color, as: 'color', attributes: ['id', 'name'] },
            { model: Size, as: 'size', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ message: 'Erreur lors du chargement des commandes.' });
  }
}

export async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'brand'] },
            { model: Color, as: 'color', attributes: ['id', 'name', 'hexCode'] },
            { model: Size, as: 'size', attributes: ['id', 'name'] }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Get order by id error:', error);
    return res.status(500).json({ message: 'Erreur lors du chargement de la commande.' });
  }
}

// Generate invoice PDF and stream it to the client
export async function getInvoice(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['name'] },
            { model: Color, as: 'color', attributes: ['name'] },
            { model: Size, as: 'size', attributes: ['name'] }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${order.orderNumber}.pdf`);

    generateInvoicePDF(order, res);
  } catch (error) {
    console.error('Get invoice error:', error);
    return res.status(500).json({ message: 'Erreur lors de la génération de la facture.' });
  }
}
