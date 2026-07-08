import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/index.js';
import { sendNotificationToAdmins } from '../socket.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123456789';

export async function register(req, res) {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires (email, mot de passe, nom).' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet e-mail est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role: 'client',
      addresses: [],
      paymentMethods: []
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    sendNotificationToAdmins({
      title: 'Nouveau client inscrit !',
      message: `Le client ${user.name} vient de s'inscrire.`,
      type: 'success',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });

    return res.status(201).json({
      message: 'Inscription réussie.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        paymentMethods: user.paymentMethods
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Erreur lors de l\'inscription.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Veuillez saisir votre e-mail et mot de passe.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Connexion réussie.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        paymentMethods: user.paymentMethods,
        photoUrl: user.photoUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
}

export async function getProfile(req, res) {
  try {
    const user = req.user;
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        paymentMethods: user.paymentMethods,
        photoUrl: user.photoUrl
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur lors de la récupération du profil.' });
  }
}

export async function updateProfile(req, res) {
  try {
    const user = req.user;
    const { name, phone, addresses, paymentMethods, photoUrl } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (addresses) user.addresses = addresses;
    if (paymentMethods) user.paymentMethods = paymentMethods;
    if (photoUrl !== undefined) user.photoUrl = photoUrl;

    await user.save();

    return res.json({
      message: 'Profil mis à jour.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        paymentMethods: user.paymentMethods,
        photoUrl: user.photoUrl
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.' });
  }
}
