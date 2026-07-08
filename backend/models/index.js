import sequelize from '../config/db.js';
import User from './User.js';
import Category from './Category.js';
import Product from './Product.js';
import Color from './Color.js';
import Size from './Size.js';
import ProductVariant from './ProductVariant.js';
import ProductImage from './ProductImage.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import Coupon from './Coupon.js';
import Review from './Review.js';
import Notification from './Notification.js';
import DeliveryPerson from './DeliveryPerson.js';
import Message from './Message.js';

// Associations

// Category <-> Product
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Product <-> ProductImage
Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Color <-> ProductImage (to filter image by color)
Color.hasMany(ProductImage, { foreignKey: 'colorId', as: 'images' });
ProductImage.belongsTo(Color, { foreignKey: 'colorId', as: 'color' });

// Product <-> ProductVariant
Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Color <-> ProductVariant
Color.hasMany(ProductVariant, { foreignKey: 'colorId', as: 'variants' });
ProductVariant.belongsTo(Color, { foreignKey: 'colorId', as: 'color' });

// Size <-> ProductVariant
Size.hasMany(ProductVariant, { foreignKey: 'sizeId', as: 'variants' });
ProductVariant.belongsTo(Size, { foreignKey: 'sizeId', as: 'size' });

// User <-> Order
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Product/Color/Size <-> OrderItem
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Color.hasMany(OrderItem, { foreignKey: 'colorId', as: 'orderItems' });
OrderItem.belongsTo(Color, { foreignKey: 'colorId', as: 'color' });

Size.hasMany(OrderItem, { foreignKey: 'sizeId', as: 'orderItems' });
OrderItem.belongsTo(Size, { foreignKey: 'sizeId', as: 'size' });

// Product <-> Review
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// User <-> Review
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// DeliveryPerson <-> Order
DeliveryPerson.hasMany(Order, { foreignKey: 'deliveryPersonId', as: 'deliveries' });
Order.belongsTo(DeliveryPerson, { foreignKey: 'deliveryPersonId', as: 'deliveryPerson' });

// Order <-> Message
Order.hasMany(Message, { foreignKey: 'orderId', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// User <-> Message (as client)
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// DeliveryPerson <-> Message
DeliveryPerson.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages', onDelete: 'CASCADE' });
Message.belongsTo(DeliveryPerson, { foreignKey: 'senderId', as: 'deliverySender' });

export {
  sequelize,
  User,
  Category,
  Product,
  Color,
  Size,
  ProductVariant,
  ProductImage,
  Order,
  OrderItem,
  Coupon,
  Review,
  Notification,
  DeliveryPerson,
  Message
};
