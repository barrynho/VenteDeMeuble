import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Message, Order, User, DeliveryPerson, Notification } from './models/index.js';

let io;
let activeVisitors = 0;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware d'authentification Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // Allow guest connections for global notifications
      socket.user = { id: 'guest', type: 'guest' };
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      // Even if token is invalid, allow as guest
      socket.user = { id: 'guest', type: 'guest' };
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connecté:', socket.id);
    activeVisitors++;
    io.emit('visitor_count_update', activeVisitors);

    const userId = socket.user?.id;
    const userType = socket.user?.type;

    // Rejoindre la room de l'utilisateur
    socket.join(`user_${userId}`);

    // Rejoindre les rooms des commandes actives
    if (userType === 'delivery_person') {
      // Pour un livreur, rejoindre les rooms de ses commandes assignées
      Order.findAll({ where: { deliveryPersonId: userId } }).then(orders => {
        orders.forEach(order => {
          socket.join(`order_${order.id}`);
        });
      });
    } else {
      // Pour un client, rejoindre les rooms de ses commandes
      Order.findAll({ where: { userId } }).then(orders => {
        orders.forEach(order => {
          socket.join(`order_${order.id}`);
        });
      });
    }

    // Envoyer un message dans une conversation
    socket.on('send_message', async (data) => {
      try {
        const { orderId, content, receiverId, receiverType } = data;

        // Créer le message dans la base de données
        const message = await Message.create({
          orderId,
          senderId: userId,
          senderType: userType,
          receiverId,
          receiverType,
          content,
        });

        // Envoyer le message à la room de la commande
        io.to(`order_${orderId}`).emit('new_message', message);

        // Envoyer une notification au receveur
        if (receiverType === 'client') {
          await Notification.create({
            userId: receiverId,
            title: 'Nouveau message',
            message: `Vous avez reçu un nouveau message concernant votre commande`,
            type: 'message',
          });
          io.to(`user_${receiverId}`).emit('new_notification', {
            title: 'Nouveau message',
            message: `Vous avez reçu un nouveau message concernant votre commande`,
          });
        } else if (receiverType === 'delivery_person') {
          // Pour les livreurs, on peut utiliser un système de notifications similaire
          io.to(`user_${receiverId}`).emit('new_notification', {
            title: 'Nouveau message',
            message: `Vous avez reçu un nouveau message du client`,
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      }
    });

    // Marquer les messages comme lus
    socket.on('mark_messages_read', async (data) => {
      try {
        const { orderId } = data;

        await Message.update(
          { isRead: true, readAt: new Date() },
          {
            where: {
              orderId,
              receiverId: userId,
              receiverType: userType,
              isRead: false,
            },
          }
        );

        // Notifier l'autre partie que les messages sont lus
        io.to(`order_${orderId}`).emit('messages_read', { orderId, userId });
      } catch (error) {
        console.error('Erreur lors du marquage des messages:', error);
      }
    });

    // Mettre à jour la localisation du livreur
    socket.on('update_location', async (data) => {
      try {
        if (userType === 'delivery_person') {
          const { latitude, longitude } = data;
          
          await DeliveryPerson.update(
            { currentLocation: { latitude, longitude } },
            { where: { id: userId } }
          );

          // Diffuser la localisation aux clients concernés
          const orders = await Order.findAll({ where: { deliveryPersonId: userId } });
          orders.forEach(order => {
            io.to(`order_${order.id}`).emit('delivery_location_updated', {
              deliveryPersonId: userId,
              latitude,
              longitude,
            });
          });
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la localisation:', error);
      }
    });

    // Rejoindre une room de commande spécifique
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
    });

    // Quitter une room de commande
    socket.on('leave_order', (orderId) => {
      socket.leave(`order_${orderId}`);
    });

    // Déconnexion
    socket.on('disconnect', () => {
      console.log('Client déconnecté:', socket.id);
      activeVisitors--;
      io.emit('visitor_count_update', activeVisitors);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io non initialisé');
  }
  return io;
};

// Fonction pour envoyer une notification à un utilisateur spécifique
export const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('new_notification', notification);
  }
};

// Fonction pour envoyer une notification à tous les admins
export const sendNotificationToAdmins = (notification) => {
  if (io) {
    io.emit('admin_notification', notification);
  }
};

// Fonction pour envoyer une notification à un livreur spécifique
export const sendNotificationToDeliveryPerson = (deliveryPersonId, notification) => {
  if (io) {
    io.to(`user_${deliveryPersonId}`).emit('new_notification', notification);
  }
};

// Fonction pour envoyer une notification globale (à tous les clients connectés)
export const sendNotificationToAllUsers = (notification) => {
  if (io) {
    io.emit('new_notification', notification);
  }
};
