import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User, DeliveryPerson } from '../models/index.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123456789';

// Authenticate any logged-in user (client or admin)
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token d\'authentification manquant.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type === 'delivery_person') {
      // Authentification livreur
      const deliveryPerson = await DeliveryPerson.findByPk(decoded.id);
      if (!deliveryPerson) {
        return res.status(401).json({ message: 'Livreur non trouvé.' });
      }
      req.deliveryPerson = deliveryPerson;
      req.deliveryPersonId = decoded.id;
    } else {
      // Authentification client/admin
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé.' });
      }
      req.user = user;
      req.userId = decoded.id;
    }
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token invalide ou expiré.' });
  }
}

// Authenticate only Admin users
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Rôle administrateur requis.' });
  }
  next();
}

// Authenticate only Delivery Persons
export function requireDeliveryPerson(req, res, next) {
  if (!req.deliveryPerson) {
    return res.status(403).json({ message: 'Accès refusé. Rôle livreur requis.' });
  }
  next();
}

// Authenticate only Clients
export function requireClient(req, res, next) {
  if (!req.user || req.user.role !== 'client') {
    return res.status(403).json({ message: 'Accès refusé. Rôle client requis.' });
  }
  next();
}
