import sequelize from './config/db.js';
import { Product, Category, Color, Size, ProductVariant, ProductImage } from './models/index.js';

async function createFurnitureProducts() {
  try {
    await sequelize.sync();
    
    // Créer la catégorie meubles de rangement
    const [category] = await Category.findOrCreate({
      where: { name: 'Meubles de Rangement' },
      defaults: { 
        name: 'Meubles de Rangement',
        slug: 'meubles-rangement'
      }
    });
    
    // Créer une couleur par défaut
    const [color] = await Color.findOrCreate({
      where: { name: 'Naturel', hexCode: '#8B7355' },
      defaults: { name: 'Naturel', hexCode: '#8B7355' }
    });
    
    // Créer une taille par défaut
    const [size] = await Size.findOrCreate({
      where: { name: 'Standard' },
      defaults: { name: 'Standard' }
    });
    
    // Images disponibles
    const images = [
      'WhatsApp Image 2026-07-01 at 20.31.11.jpeg',
      'WhatsApp Image 2026-07-01 at 20.31.12.jpeg',
      'WhatsApp Image 2026-07-01 at 20.31.12 (1).jpeg',
      'WhatsApp Image 2026-07-01 at 20.31.12 (2).jpeg',
      'WhatsApp Image 2026-07-01 at 20.31.13.jpeg',
      'WhatsApp Image 2026-07-01 at 20.31.13 (1).jpeg'
    ];
    
    // Créer les produits meubles
    const furnitureProducts = [
      {
        name: 'Placard de Rangement 3 Portes',
        slug: 'placard-rangement-3-portes',
        description: 'Placard de rangement élégant avec 3 portes, idéal pour organiser vos vêtements et accessoires.',
        price: 150000,
        oldPrice: 180000,
        brand: 'BS Dressing',
        categoryId: category.id,
        isPopular: true,
        isPromo: true
      },
      {
        name: 'Armoire à Chaussures',
        slug: 'armoire-chaussures',
        description: 'Armoire à chaussures compacte avec plusieurs niveaux, parfaite pour les petits espaces.',
        price: 75000,
        oldPrice: 90000,
        brand: 'BS Dressing',
        categoryId: category.id,
        isPopular: false,
        isPromo: true
      },
      {
        name: 'Dressing avec Miroir',
        slug: 'dressing-miroir',
        description: 'Dressing complet avec miroir intégré, offrant un espace de rangement optimal et une touche moderne.',
        price: 250000,
        oldPrice: 300000,
        brand: 'BS Dressing',
        categoryId: category.id,
        isPopular: true,
        isPromo: true
      },
      {
        name: 'Étagère de Rangement',
        slug: 'etagere-rangement',
        description: 'Étagère de rangement modulaire, polyvalente et facile à assembler.',
        price: 45000,
        oldPrice: 55000,
        brand: 'BS Dressing',
        categoryId: category.id,
        isPopular: false,
        isPromo: true
      },
      {
        name: 'Commode avec Tiroirs',
        slug: 'commode-tiroirs',
        description: 'Commode élégante avec 4 tiroirs, idéale pour la chambre à coucher.',
        price: 120000,
        oldPrice: 140000,
        brand: 'BS Dressing',
        categoryId: category.id,
        isPopular: true,
        isPromo: true
      },
      {
        name: 'Meuble TV avec Rangement',
        slug: 'meuble-tv-rangement',
        description: 'Meuble TV moderne avec espaces de rangement intégrés pour organiser votre salon.',
        price: 180000,
        oldPrice: 210000,
        brand: 'BS Dressing',
        categoryId: category.id,
        isPopular: false,
        isPromo: true
      }
    ];
    
    for (let i = 0; i < furnitureProducts.length; i++) {
      const productData = furnitureProducts[i];
      const [product] = await Product.findOrCreate({
        where: { name: productData.name },
        defaults: productData
      });
      
      // Créer le variant
      const [variant] = await ProductVariant.findOrCreate({
        where: { 
          productId: product.id,
          colorId: color.id,
          sizeId: size.id
        },
        defaults: {
          productId: product.id,
          colorId: color.id,
          sizeId: size.id,
          stock: 10
        }
      });
      
      // Ajouter l'image
      const imagePath = '/uploads/' + images[i % images.length];
      await ProductImage.findOrCreate({
        where: { 
          productId: product.id,
          imageUrl: imagePath
        },
        defaults: {
          productId: product.id,
          imageUrl: imagePath,
          colorId: color.id
        }
      });
      
      console.log('Produit créé:', product.name);
    }
    
    console.log('Tous les produits meubles ont été créés avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

createFurnitureProducts();
