import bcrypt from 'bcryptjs';
import sequelize, { initializeDatabase } from './config/db.js';
import {
  User,
  Category,
  Product,
  Color,
  Size,
  ProductVariant,
  ProductImage,
  Coupon
} from './models/index.js';

async function seed() {
  try {
    // 1. Verify/create database if it doesn't exist
    await initializeDatabase();

    // 2. Sync database schema (drop tables first with force: true)
    console.log('Syncing database schema (dropping existing tables)...');
    await sequelize.sync({ force: true });
    console.log('Database synced successfully.');

    // 3. Create Users
    console.log('Seeding users...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedClientPassword = await bcrypt.hash('client123', 10);

    const admin = await User.create({
      email: 'admin@ecom.com',
      password: hashedAdminPassword,
      role: 'admin',
      name: 'Admin E-Commerce',
      phone: '+242060000001',
    });

    const client = await User.create({
      email: 'client@ecom.com',
      password: hashedClientPassword,
      role: 'client',
      name: 'Jean Dupont',
      phone: '+242068888888',
      addresses: [
        {
          label: 'Domicile',
          name: 'Jean Dupont',
          phone: '+242068888888',
          street: '12 Rue des Pâquerettes',
          city: 'Brazzaville',
          country: 'Congo',
          instructions: 'Sonner au portail noir.'
        }
      ],
      paymentMethods: [
        {
          type: 'mobile_money',
          phone: '+242068888888',
          provider: 'Airtel Money'
        }
      ]
    });

    // 4. Create Colors
    console.log('Seeding colors...');
    const colors = await Color.bulkCreate([
      { name: 'Noir', hexCode: '#111111' },
      { name: 'Blanc', hexCode: '#FFFFFF' },
      { name: 'Rouge', hexCode: '#E50914' },
      { name: 'Bleu', hexCode: '#0047AB' },
      { name: 'Vert', hexCode: '#10B981' },
      { name: 'Beige', hexCode: '#F5F5DC' }
    ]);
    const colorMap = {};
    colors.forEach(c => { colorMap[c.name] = c.id; });

    // 5. Create Sizes
    console.log('Seeding sizes...');
    const sizes = await Size.bulkCreate([
      { name: 'XS' },
      { name: 'S' },
      { name: 'M' },
      { name: 'L' },
      { name: 'XL' },
      { name: 'XXL' },
      { name: 'XXXL' }
    ]);
    const sizeMap = {};
    sizes.forEach(s => { sizeMap[s.name] = s.id; });

    // 6. Create Categories
    console.log('Seeding categories...');
    const catUnique = await Category.create({ name: 'meubles sans peinture', slug: 'meubles-sans-peinture', imageUrl: '/uploads/WhatsApp Image 2026-07-01 at 20.31.11.jpeg' });

    // 7. Create Products
    console.log('Seeding products...');
    
    // Product 1: Armoire de Rangement 2 Portes
    const pArmoire = await Product.create({
      name: 'Armoire de Rangement 2 Portes',
      slug: 'armoire-rangement-2-portes',
      description: 'Armoire élégante avec deux grandes portes et penderie intégrée. Finition bois naturel pour s\'adapter à toutes les chambres.',
      price: 150000,
      oldPrice: 180000,
      discountPercentage: 16,
      rating: 4.8,
      brand: 'BS Dressing Service',
      isPopular: true,
      isPromo: true,
      categoryId: catUnique.id,
      stock: 15
    });

    // Product 2: Commode 3 Tiroirs Chêne
    const pCommode = await Product.create({
      name: 'Commode 3 Tiroirs Chêne',
      slug: 'commode-3-tiroirs-chene',
      description: 'Commode spacieuse avec trois tiroirs profonds. Parfaite pour le rangement de vos vêtements et accessoires.',
      price: 85000,
      oldPrice: 100000,
      discountPercentage: 15,
      rating: 4.6,
      brand: 'DesignHome',
      isPopular: true,
      isPromo: true,
      categoryId: catUnique.id,
      stock: 20
    });

    // Product 3: Étagère Murale Asymétrique
    const pEtagere = await Product.create({
      name: 'Étagère Murale Asymétrique',
      slug: 'etagere-murale-asymetrique',
      description: 'Donnez du style à votre salon avec cette étagère murale au design moderne et asymétrique. Facile à installer.',
      price: 45000,
      rating: 4.7,
      brand: 'DecoRangement',
      isPopular: false,
      isPromo: false,
      categoryId: catUnique.id,
      stock: 30
    });

    // Product 4: Meuble TV Scandinave
    const pMeubleTV = await Product.create({
      name: 'Meuble TV Scandinave',
      slug: 'meuble-tv-scandinave',
      description: 'Meuble TV bas avec rangements fermés et niches ouvertes. Style scandinave épuré, pieds en bois massif.',
      price: 120000,
      rating: 4.9,
      brand: 'BS Dressing Service',
      isPopular: true,
      isPromo: false,
      categoryId: catUnique.id,
      stock: 10
    });

    // 8. Seeding Images for Products
    console.log('Seeding product images...');
    
    await ProductImage.create({ productId: pArmoire.id, colorId: colorMap['Beige'], imageUrl: '/uploads/WhatsApp Image 2026-07-01 at 20.31.11.jpeg' });
    await ProductImage.create({ productId: pArmoire.id, colorId: colorMap['Noir'], imageUrl: '/uploads/WhatsApp Image 2026-07-01 at 20.31.12 (1).jpeg' });
    
    await ProductImage.create({ productId: pCommode.id, colorId: colorMap['Blanc'], imageUrl: '/uploads/WhatsApp Image 2026-07-01 at 20.31.12 (2).jpeg' });
    await ProductImage.create({ productId: pCommode.id, colorId: colorMap['Beige'], imageUrl: '/uploads/WhatsApp Image 2026-07-01 at 20.31.12.jpeg' });

    await ProductImage.create({ productId: pEtagere.id, colorId: colorMap['Noir'], imageUrl: '/uploads/WhatsApp Image 2026-07-01 at 20.31.13 (1).jpeg' });

    await ProductImage.create({ productId: pMeubleTV.id, colorId: colorMap['Beige'], imageUrl: '/uploads/WhatsApp Image 2026-07-01 at 20.31.13.jpeg' });

    // 9. Seeding Variants (stock levels for specific sizes and colors)
    console.log('Seeding product variants...');
    
    // Variants for Armoire
    for (const colorName of ['Beige', 'Noir']) {
      for (const sizeName of ['L', 'XL']) {
        await ProductVariant.create({
          productId: pArmoire.id,
          colorId: colorMap[colorName],
          sizeId: sizeMap[sizeName],
          stock: Math.floor(Math.random() * 5) + 2
        });
      }
    }

    // Variants for Commode
    for (const colorName of ['Blanc', 'Beige']) {
      for (const sizeName of ['M', 'L']) {
        await ProductVariant.create({
          productId: pCommode.id,
          colorId: colorMap[colorName],
          sizeId: sizeMap[sizeName],
          stock: Math.floor(Math.random() * 5) + 5
        });
      }
    }

    // Variants for Etagere
    for (const sizeName of ['S', 'M']) {
      await ProductVariant.create({
        productId: pEtagere.id,
        colorId: colorMap['Noir'],
        sizeId: sizeMap[sizeName],
        stock: Math.floor(Math.random() * 8) + 2
      });
    }

    // Variants for MeubleTV
    for (const sizeName of ['L', 'XL']) {
      await ProductVariant.create({
        productId: pMeubleTV.id,
        colorId: colorMap['Beige'],
        sizeId: sizeMap[sizeName],
        stock: Math.floor(Math.random() * 3) + 2
      });
    }

    // 10. Seeding Coupons
    console.log('Seeding coupons...');
    await Coupon.bulkCreate([
      { code: 'ECOM20', type: 'percent', value: 20, minOrderValue: 50, expiresAt: new Date('2026-12-31') },
      { code: 'FREEKDO', type: 'free_shipping', value: 0, minOrderValue: 30, expiresAt: new Date('2026-12-31') },
      { code: 'LUXE10', type: 'fixed', value: 10, minOrderValue: 100, expiresAt: new Date('2026-12-31') }
    ]);

    console.log('Seeding database completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
