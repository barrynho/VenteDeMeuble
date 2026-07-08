import { Op, fn, col } from 'sequelize';
import {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  ProductImage,
  User,
  Coupon,
  Notification,
  Color,
  Size,
  DeliveryPerson
} from '../models/index.js';
import { sendNotificationToDeliveryPerson, sendNotificationToAllUsers } from '../socket.js';

// 1. Dashboard Stats
export async function getStats(req, res) {
  try {
    // Total Revenue (excluding cancelled orders)
    const revenueResult = await Order.sum('total', {
      where: { status: { [Op.ne]: 'cancelled' } }
    });
    const totalRevenue = revenueResult || 0;

    // Number of Orders
    const totalOrders = await Order.count();

    // Number of Clients
    const totalClients = await User.count({ where: { role: 'client' } });

    // Number of Products Sold
    const soldResult = await OrderItem.sum('quantity', {
      include: [{ model: Order, as: 'order', where: { status: { [Op.ne]: 'cancelled' } } }]
    });
    const totalProductsSold = soldResult || 0;

    // Top Selling Products
    const topProducts = await OrderItem.findAll({
      attributes: [
        'productId',
        [fn('SUM', col('quantity')), 'soldQuantity']
      ],
      include: [
        { model: Product, as: 'product', attributes: ['name', 'price', 'brand'] }
      ],
      group: ['productId', 'product.id'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: 5
    });

    // Sales by month (for charts)
    const salesByMonth = await Order.findAll({
      attributes: [
        [fn('MONTH', col('createdAt')), 'month'],
        [fn('SUM', col('total')), 'sales']
      ],
      where: {
        status: { [Op.ne]: 'cancelled' },
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), 0, 1) // current year only
        }
      },
      group: [fn('MONTH', col('createdAt'))],
      order: [[fn('MONTH', col('createdAt')), 'ASC']]
    });

    return res.json({
      totalRevenue,
      totalOrders,
      totalClients,
      totalProductsSold,
      topProducts,
      salesByMonth
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.' });
  }
}

// 2. Orders Management
export async function getAdminOrders(req, res) {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        {
          model: OrderItem,
          as: 'items',
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'price'] },
            { model: Color, as: 'color', attributes: ['id', 'name'] },
            { model: Size, as: 'size', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.json(orders);
  } catch (error) {
    console.error('Admin get orders error:', error);
    return res.status(500).json({ message: 'Erreur lors du chargement des commandes.' });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    order.status = status;
    await order.save();

    // Notify user
    let notificationTitle = 'Mise à jour de votre commande';
    let notificationContent = `Le statut de votre commande ${order.orderNumber} est maintenant : ${status}.`;

    if (status === 'confirmed') {
      notificationTitle = 'Commande confirmée !';
      notificationContent = `Votre commande ${order.orderNumber} a été confirmée et va être préparée.`;
    } else if (status === 'shipped') {
      notificationTitle = 'Commande expédiée !';
      notificationContent = `Bonne nouvelle ! Votre commande ${order.orderNumber} a été expédiée.`;
    } else if (status === 'delivered') {
      notificationTitle = 'Commande livrée !';
      notificationContent = `Votre commande ${order.orderNumber} a été marquée comme livrée. Merci d'avoir acheté chez nous !`;
    }

    await Notification.create({
      userId: order.userId,
      title: notificationTitle,
      content: notificationContent,
      type: 'order'
    });

    return res.json({ message: 'Statut de la commande mis à jour.', order });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de la commande.' });
  }
}

// 3. Products Management (CRUD)
export async function createAdminProduct(req, res) {
  try {
    const { name, description, price, oldPrice, brand, categoryId, variants } = req.body;
    // variants is a JSON string of array of { colorId, sizeId, stock }

    if (!name || !price || !categoryId) {
      return res.status(400).json({ message: 'Nom, prix et catégorie requis.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const product = await Product.create({
      name,
      slug,
      description,
      price: parseFloat(price),
      oldPrice: oldPrice ? parseFloat(oldPrice) : null,
      discountPercentage: oldPrice ? Math.round(((parseFloat(oldPrice) - parseFloat(price)) / parseFloat(oldPrice)) * 100) : 0,
      brand,
      categoryId: parseInt(categoryId),
      isAvailable: true
    });

    // Save uploaded images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await ProductImage.create({
          productId: product.id,
          imageUrl: `/uploads/${file.filename}`
        });
      }
    }

    // Save variants
    if (variants) {
      const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      let totalStock = 0;
      for (const v of parsedVariants) {
        await ProductVariant.create({
          productId: product.id,
          colorId: parseInt(v.colorId),
          sizeId: parseInt(v.sizeId),
          stock: parseInt(v.stock)
        });
        totalStock += parseInt(v.stock);
      }
      product.stock = totalStock;
      await product.save();
    }

    const fullProduct = await Product.findByPk(product.id, {
      include: [
        { model: ProductImage, as: 'images' },
        { model: ProductVariant, as: 'variants', include: [{ model: Color, as: 'color' }, { model: Size, as: 'size' }] }
      ]
    });

    // Notify all connected clients about the new product
    sendNotificationToAllUsers({
      title: 'Nouveau Produit Disponible !',
      message: `Venez découvrir notre nouvel arrivage : ${fullProduct.name}.`,
      type: 'info'
    });

    return res.status(201).json({ message: 'Produit créé avec succès.', product: fullProduct });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ message: 'Erreur lors de la création du produit.' });
  }
}

export async function updateAdminProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, description, price, oldPrice, brand, categoryId, variants, isAvailable, isPopular, isPromo } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }

    if (name) {
      product.name = name;
      product.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    if (description !== undefined) product.description = description;
    if (price) product.price = parseFloat(price);
    if (oldPrice !== undefined) {
      product.oldPrice = oldPrice ? parseFloat(oldPrice) : null;
      if (oldPrice && price) {
        product.discountPercentage = Math.round(((parseFloat(oldPrice) - parseFloat(price)) / parseFloat(oldPrice)) * 100);
      } else {
        product.discountPercentage = 0;
      }
    }
    if (brand !== undefined) product.brand = brand;
    if (categoryId) product.categoryId = parseInt(categoryId);
    if (isAvailable !== undefined) product.isAvailable = isAvailable === 'true' || isAvailable === true;
    if (isPopular !== undefined) product.isPopular = isPopular === 'true' || isPopular === true;
    if (isPromo !== undefined) product.isPromo = isPromo === 'true' || isPromo === true;

    // Handle new uploads if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await ProductImage.create({
          productId: product.id,
          imageUrl: `/uploads/${file.filename}`
        });
      }
    }

    // Handle updating variants
    if (variants) {
      const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
      // Delete old variants
      await ProductVariant.destroy({ where: { productId: product.id } });
      
      let totalStock = 0;
      for (const v of parsedVariants) {
        await ProductVariant.create({
          productId: product.id,
          colorId: parseInt(v.colorId),
          sizeId: parseInt(v.sizeId),
          stock: parseInt(v.stock)
        });
        totalStock += parseInt(v.stock);
      }
      product.stock = totalStock;
    }

    await product.save();

    const fullProduct = await Product.findByPk(product.id, {
      include: [
        { model: ProductImage, as: 'images' },
        { model: ProductVariant, as: 'variants', include: [{ model: Color, as: 'color' }, { model: Size, as: 'size' }] }
      ]
    });

    return res.json({ message: 'Produit mis à jour avec succès.', product: fullProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du produit.' });
  }
}

export async function deleteAdminProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }
    
    // Clear associations manually to avoid SequelizeForeignKeyConstraintError
    await ProductImage.destroy({ where: { productId: id } });
    await ProductVariant.destroy({ where: { productId: id } });
    await Review.destroy({ where: { productId: id } });
    
    // Nullify order items referencing this product to keep order history intact
    await OrderItem.update({ productId: null }, { where: { productId: id } });

    await product.destroy();
    return res.json({ message: 'Produit supprimé avec succès.' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression du produit.' });
  }
}

// 4. Coupons Management (CRUD)
export async function getAdminCoupons(req, res) {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    return res.json(coupons);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération des coupons.' });
  }
}

export async function createAdminCoupon(req, res) {
  try {
    const { code, type, value, minOrderValue, expiresAt } = req.body;
    if (!code || !value) {
      return res.status(400).json({ message: 'Code et valeur requis.' });
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      type,
      value: parseFloat(value),
      minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true
    });

    return res.status(201).json({ message: 'Code promo créé.', coupon });
  } catch (error) {
    console.error('Create coupon error:', error);
    return res.status(500).json({ message: 'Erreur lors de la création du code promo.' });
  }
}

export async function updateAdminCoupon(req, res) {
  try {
    const { id } = req.params;
    const { code, type, value, minOrderValue, expiresAt, isActive } = req.body;

    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      return res.status(404).json({ message: 'Code promo non trouvé.' });
    }

    if (code) coupon.code = code.trim().toUpperCase();
    if (type) coupon.type = type;
    if (value !== undefined) coupon.value = parseFloat(value);
    if (minOrderValue !== undefined) coupon.minOrderValue = parseFloat(minOrderValue);
    if (expiresAt !== undefined) coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();
    return res.json({ message: 'Code promo mis à jour.', coupon });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la mise à jour.' });
  }
}

export async function deleteAdminCoupon(req, res) {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      return res.status(404).json({ message: 'Code promo non trouvé.' });
    }
    await coupon.destroy();
    return res.json({ message: 'Code promo supprimé.' });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
}

// 5. Delivery Assignment
export async function assignDeliveryPerson(req, res) {
  try {
    const { orderId } = req.params;
    const { deliveryPersonId } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée.' });
    }

    const deliveryPerson = await DeliveryPerson.findByPk(deliveryPersonId);
    if (!deliveryPerson) {
      return res.status(404).json({ message: 'Livreur non trouvé.' });
    }

    if (!deliveryPerson.isAvailable) {
      return res.status(400).json({ message: 'Ce livreur n\'est pas disponible.' });
    }

    // Assigner le livreur à la commande
    await order.update({
      deliveryPersonId,
      deliveryStatus: 'pending',
      status: 'delivering',
    });

    // Créer une notification pour le livreur
    await Notification.create({
      userId: deliveryPersonId,
      title: 'Nouvelle commande assignée',
      message: `Vous avez été assigné à la commande #${order.orderNumber}`,
      type: 'delivery',
    });

    // Envoyer notification en temps réel via Socket.io
    sendNotificationToDeliveryPerson(deliveryPersonId, {
      title: 'Nouvelle commande assignée',
      message: `Vous avez été assigné à la commande #${order.orderNumber}`,
      orderId: order.id,
    });

    // Notifier le client
    await Notification.create({
      userId: order.userId,
      title: 'Livreur assigné',
      message: `Un livreur a été assigné à votre commande #${order.orderNumber}`,
      type: 'order',
    });

    return res.json({ 
      message: 'Livreur assigné avec succès.', 
      order,
      deliveryPerson: {
        id: deliveryPerson.id,
        name: deliveryPerson.name,
        phone: deliveryPerson.phone,
        vehicleType: deliveryPerson.vehicleType,
      }
    });
  } catch (error) {
    console.error('Assign delivery person error:', error);
    return res.status(500).json({ message: 'Erreur lors de l\'assignation du livreur.' });
  }
}

export async function getAvailableDeliveryPersons(req, res) {
  try {
    const deliveryPersons = await DeliveryPerson.findAll({
      where: { 
        isAvailable: true,
        status: 'active'
      },
      attributes: { exclude: ['password'] },
      order: [['rating', 'DESC']],
    });

    return res.json(deliveryPersons);
  } catch (error) {
    console.error('Get available delivery persons error:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des livreurs disponibles.' });
  }
}

// 6. CSV Exports
export async function exportSalesCSV(req, res) {
  try {
    const orders = await Order.findAll({
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    // CSV Headers (adding UTF-8 BOM so Excel opens it with correct encoding)
    let csvContent = '\uFEFF'; 
    csvContent += 'Numéro de Commande,Client,Email Client,Date,Mode de Paiement,Livraison,Sous-total,Frais Livraison,Total,Statut\n';

    orders.forEach((o) => {
      const clientName = o.user ? o.user.name.replace(/,/g, ' ') : 'Inconnu';
      const clientEmail = o.user ? o.user.email : 'Inconnu';
      const formattedDate = new Date(o.createdAt).toLocaleDateString('fr-FR');
      
      csvContent += `"${o.orderNumber}","${clientName}","${clientEmail}","${formattedDate}","${o.paymentMethod}","${o.shippingMethod}",${o.subtotal},${o.shippingFee},${o.total},"${o.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=ventes-export.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    return res.status(500).json({ message: 'Erreur lors de l\'exportation des ventes.' });
  }
}
