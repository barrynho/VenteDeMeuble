import { Op } from 'sequelize';
import { Product, Category, ProductVariant, ProductImage, Color, Size } from '../models/index.js';

// List products with search, pagination, and multi-filters
export async function getProducts(req, res) {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      color,
      size,
      brand,
      isPopular,
      isPromo,
      isAvailable,
      sortBy
    } = req.query;

    const where = {};
    const include = [
      { model: Category, as: 'category' },
      { model: ProductImage, as: 'images', include: [{ model: Color, as: 'color' }] }
    ];

    // Search query
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Category filtering
    if (category) {
      where['$category.slug$'] = category;
    }

    // Price range filtering
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    // Brand filtering
    if (brand) {
      where.brand = brand;
    }

    // Flags
    if (isPopular === 'true') where.isPopular = true;
    if (isPromo === 'true') where.isPromo = true;
    if (isAvailable === 'true') where.isAvailable = true;

    // Filter by Variants (Colors or Sizes)
    const variantWhere = {};
    let filterByVariant = false;

    if (color) {
      const colorList = Array.isArray(color) ? color : [color];
      variantWhere.colorId = { [Op.in]: colorList };
      filterByVariant = true;
    }

    if (size) {
      const sizeList = Array.isArray(size) ? size : [size];
      variantWhere.sizeId = { [Op.in]: sizeList };
      filterByVariant = true;
    }

    if (filterByVariant) {
      include.push({
        model: ProductVariant,
        as: 'variants',
        where: variantWhere,
        required: true // Forces INNER JOIN to only return products with matching variants
      });
    } else {
      // Still include variants, but not required
      include.push({
        model: ProductVariant,
        as: 'variants',
        include: [
          { model: Color, as: 'color' },
          { model: Size, as: 'size' }
        ]
      });
    }

    // Sorting
    let order = [['createdAt', 'DESC']]; // default newest
    if (sortBy === 'price_asc') {
      order = [['price', 'ASC']];
    } else if (sortBy === 'price_desc') {
      order = [['price', 'DESC']];
    } else if (sortBy === 'popular') {
      order = [['rating', 'DESC']];
    }

    const products = await Product.findAll({
      where,
      include,
      order,
      distinct: true // Prevents wrong counts due to joined tables
    });

    return res.json(products);
  } catch (error) {
    console.error('Erreur lors du chargement des produits:', error);
    res.status(500).json({ message: 'Erreur lors du chargement des produits.', error: error.message });
  }
}

// Get single product details, variants, images, and recommendations
export async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        {
          model: ProductImage,
          as: 'images',
          include: [{ model: Color, as: 'color' }]
        },
        {
          model: ProductVariant,
          as: 'variants',
          include: [
            { model: Color, as: 'color' },
            { model: Size, as: 'size' }
          ]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }

    // Fetch similar products (same category, excluding current product)
    const similarProducts = await Product.findAll({
      where: {
        categoryId: product.categoryId,
        id: { [Op.ne]: product.id }
      },
      limit: 4,
      include: [
        { model: ProductImage, as: 'images' }
      ]
    });

    return res.json({
      product,
      similarProducts
    });
  } catch (error) {
    console.error('Get product details error:', error);
    return res.status(500).json({ message: 'Erreur lors du chargement des détails du produit.' });
  }
}
