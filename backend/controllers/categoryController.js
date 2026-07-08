import { Category } from '../models/index.js';

export async function getCategories(req, res) {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    return res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ message: 'Erreur lors du chargement des catégories.' });
  }
}

export async function createCategory(req, res) {
  try {
    const { name, slug, imageUrl } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Le nom de la catégorie est requis.' });
    }
    const slugStr = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newCategory = await Category.create({ name, slug: slugStr, imageUrl });
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ message: 'Erreur lors de la création de la catégorie.' });
  }
}
