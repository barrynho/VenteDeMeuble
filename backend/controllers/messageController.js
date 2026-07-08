import { Message, Order, User, DeliveryPerson } from '../models/index.js';

// Envoyer un message
export const sendMessage = async (req, res) => {
  try {
    const { orderId, content, senderType, senderId, receiverId, receiverType } = req.body;

    // Vérifier que la commande existe
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Créer le message
    const message = await Message.create({
      orderId,
      senderId,
      senderType,
      receiverId,
      receiverType,
      content,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
};

// Obtenir les messages d'une commande
export const getOrderMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    const deliveryPersonId = req.deliveryPersonId;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Vérifier que l'utilisateur a le droit de voir les messages
    if (userId && order.userId !== parseInt(userId)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    if (deliveryPersonId && order.deliveryPersonId !== parseInt(deliveryPersonId)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const messages = await Message.findAll({
      where: { orderId },
      order: [['createdAt', 'ASC']],
    });

    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
  }
};

// Marquer les messages comme lus
export const markMessagesAsRead = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    const deliveryPersonId = req.deliveryPersonId;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // Déterminer qui est le receveur
    let receiverId;
    let receiverType;

    if (userId) {
      receiverId = userId;
      receiverType = 'client';
    } else if (deliveryPersonId) {
      receiverId = deliveryPersonId;
      receiverType = 'delivery_person';
    } else {
      return res.status(400).json({ message: 'Utilisateur non identifié' });
    }

    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          orderId,
          receiverId,
          receiverType,
          isRead: false,
        },
      }
    );

    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    console.error('Erreur lors du marquage des messages:', error);
    res.status(500).json({ message: 'Erreur lors du marquage' });
  }
};

// Obtenir les conversations d'un utilisateur
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.userId;

    // Récupérer les commandes de l'utilisateur avec des messages
    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: Message,
          as: 'messages',
          required: true,
        },
        {
          model: DeliveryPerson,
          as: 'deliveryPerson',
          attributes: { exclude: ['password'] },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
};

// Obtenir les conversations d'un livreur
export const getDeliveryPersonConversations = async (req, res) => {
  try {
    const deliveryPersonId = req.deliveryPersonId;

    // Récupérer les commandes assignées au livreur avec des messages
    const orders = await Order.findAll({
      where: { deliveryPersonId },
      include: [
        {
          model: Message,
          as: 'messages',
          required: true,
        },
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
};

// Obtenir le nombre de messages non lus
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;
    const deliveryPersonId = req.deliveryPersonId;

    let unreadCount = 0;

    if (userId) {
      // Pour un client
      const orders = await Order.findAll({ where: { userId } });
      const orderIds = orders.map(o => o.id);

      unreadCount = await Message.count({
        where: {
          orderId: orderIds,
          receiverId: userId,
          receiverType: 'client',
          isRead: false,
        },
      });
    } else if (deliveryPersonId) {
      // Pour un livreur
      const orders = await Order.findAll({ where: { deliveryPersonId } });
      const orderIds = orders.map(o => o.id);

      unreadCount = await Message.count({
        where: {
          orderId: orderIds,
          receiverId: deliveryPersonId,
          receiverType: 'delivery_person',
          isRead: false,
        },
      });
    }

    res.json({ unreadCount });
  } catch (error) {
    console.error('Erreur lors de la récupération du compteur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération' });
  }
};
