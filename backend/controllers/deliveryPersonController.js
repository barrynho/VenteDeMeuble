import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DeliveryPerson, Order, Notification } from '../models/index.js';

// Inscription livreur
export const registerDeliveryPerson = async (req, res) => {
  try {
    const { email, password, name, phone, vehicleType, vehicleNumber } = req.body;

    // Vérifier si l'email existe déjà
    const existingDeliveryPerson = await DeliveryPerson.findOne({ where: { email } });
    if (existingDeliveryPerson) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le livreur
    const deliveryPerson = await DeliveryPerson.create({
      email,
      password: hashedPassword,
      name,
      phone,
      vehicleType,
      vehicleNumber,
      status: 'pending', // Par défaut en attente de validation
    });

    res.status(201).json({
      message: 'Compte livreur créé avec succès. Votre compte est en attente de validation par l\'administration.',
      deliveryPerson: {
        id: deliveryPerson.id,
        email: deliveryPerson.email,
        name: deliveryPerson.name,
        phone: deliveryPerson.phone,
        vehicleType: deliveryPerson.vehicleType,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la création du livreur:', error);
    res.status(500).json({ message: 'Erreur lors de la création du compte livreur' });
  }
};

// Connexion livreur
export const loginDeliveryPerson = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trouver le livreur
    const deliveryPerson = await DeliveryPerson.findOne({ where: { email } });
    if (!deliveryPerson) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le statut
    if (deliveryPerson.status === 'pending') {
      return res.status(403).json({ message: 'Votre compte est en attente de validation par l\'administration.' });
    }

    if (deliveryPerson.status === 'rejected') {
      return res.status(403).json({ message: 'Votre compte a été refusé par l\'administration.' });
    }

    if (deliveryPerson.status === 'suspended') {
      return res.status(403).json({ message: 'Votre compte a été suspendu. Contactez l\'administration.' });
    }

    if (deliveryPerson.status !== 'active' && deliveryPerson.status !== 'approved') {
      return res.status(403).json({ message: 'Compte livreur désactivé ou suspendu' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, deliveryPerson.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: deliveryPerson.id, type: 'delivery_person' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      deliveryPerson: {
        id: deliveryPerson.id,
        email: deliveryPerson.email,
        name: deliveryPerson.name,
        phone: deliveryPerson.phone,
        vehicleType: deliveryPerson.vehicleType,
        vehicleNumber: deliveryPerson.vehicleNumber,
        isAvailable: deliveryPerson.isAvailable,
        rating: deliveryPerson.rating,
        totalDeliveries: deliveryPerson.totalDeliveries,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

// Obtenir le profil du livreur
export const getDeliveryPersonProfile = async (req, res) => {
  try {
    const deliveryPersonId = req.deliveryPersonId;

    const deliveryPerson = await DeliveryPerson.findByPk(deliveryPersonId, {
      attributes: { exclude: ['password'] },
    });

    if (!deliveryPerson) {
      return res.status(404).json({ message: 'Livreur non trouvé' });
    }

    res.json(deliveryPerson);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
  }
};

// Mettre à jour la disponibilité du livreur
export const updateAvailability = async (req, res) => {
  try {
    const deliveryPersonId = req.deliveryPersonId;
    const { isAvailable } = req.body;

    await DeliveryPerson.update(
      { isAvailable },
      { where: { id: deliveryPersonId } }
    );

    res.json({ message: 'Disponibilité mise à jour' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la disponibilité:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

// Mettre à jour la localisation du livreur
export const updateLocation = async (req, res) => {
  try {
    const deliveryPersonId = req.deliveryPersonId;
    const { latitude, longitude } = req.body;

    await DeliveryPerson.update(
      { currentLocation: { latitude, longitude } },
      { where: { id: deliveryPersonId } }
    );

    res.json({ message: 'Localisation mise à jour' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la localisation:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

// Obtenir les commandes assignées au livreur
export const getAssignedOrders = async (req, res) => {
  try {
    const deliveryPersonId = req.deliveryPersonId;

    const orders = await Order.findAll({
      where: { deliveryPersonId },
      include: [
        {
          model: Order,
          as: 'items',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes' });
  }
};

// Accepter une commande
export const acceptOrder = async (req, res) => {
  try {
    const deliveryPersonId = req.deliveryPersonId;
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (order.deliveryPersonId !== parseInt(deliveryPersonId)) {
      return res.status(403).json({ message: 'Cette commande ne vous est pas assignée' });
    }

    await order.update({
      deliveryStatus: 'accepted',
      status: 'delivering',
    });

    // Créer une notification pour le client
    await Notification.create({
      userId: order.userId,
      title: 'Commande acceptée',
      message: `Votre commande #${order.orderNumber} a été acceptée par le livreur`,
      type: 'order',
    });

    res.json({ message: 'Commande acceptée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'acceptation de la commande:', error);
    res.status(500).json({ message: 'Erreur lors de l\'acceptation' });
  }
};

// Mettre à jour le statut de livraison
export const updateDeliveryStatus = async (req, res) => {
  try {
    const deliveryPersonId = req.deliveryPersonId;
    const { orderId } = req.params;
    const { status, estimatedDeliveryTime } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (order.deliveryPersonId !== parseInt(deliveryPersonId)) {
      return res.status(403).json({ message: 'Cette commande ne vous est pas assignée' });
    }

    const updateData = { deliveryStatus: status };
    if (estimatedDeliveryTime) {
      updateData.estimatedDeliveryTime = estimatedDeliveryTime;
    }

    await order.update(updateData);

    // Mettre à jour le statut de la commande principale
    if (status === 'delivered') {
      await order.update({ status: 'delivered' });
      
      // Incrémenter le nombre de livraisons du livreur
      const deliveryPerson = await DeliveryPerson.findByPk(deliveryPersonId);
      await deliveryPerson.update({
        totalDeliveries: deliveryPerson.totalDeliveries + 1,
      });
    }

    // Notifier le client
    const statusMessages = {
      picked_up: 'Commande récupérée par le livreur',
      in_transit: 'Commande en cours de livraison',
      delivered: 'Commande livrée avec succès',
    };

    if (statusMessages[status]) {
      await Notification.create({
        userId: order.userId,
        title: 'Mise à jour de livraison',
        message: `${statusMessages[status]} - Commande #${order.orderNumber}`,
        type: 'order',
      });
    }

    res.json({ message: 'Statut de livraison mis à jour' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

// Obtenir tous les livreurs (pour admin)
export const getAllDeliveryPersons = async (req, res) => {
  try {
    const deliveryPersons = await DeliveryPerson.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });

    res.json(deliveryPersons);
  } catch (error) {
    console.error('Erreur lors de la récupération des livreurs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
};

// Mettre à jour le statut d'un livreur (admin)
export const updateDeliveryPersonStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await DeliveryPerson.update(
      { status },
      { where: { id } }
    );

    res.json({ message: 'Statut du livreur mis à jour' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};
