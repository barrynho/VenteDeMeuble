import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'shipped', 'delivering', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  shippingMethod: {
    type: DataTypes.ENUM('pickup', 'home', 'relay'),
    defaultValue: 'home',
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  shippingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('mobile_money', 'card', 'whatsapp', 'cash'),
    defaultValue: 'cash',
  },
  paymentDetails: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  couponCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deliveryPersonId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  deliveryStatus: {
    type: DataTypes.ENUM('pending', 'accepted', 'picked_up', 'in_transit', 'delivered'),
    defaultValue: 'pending',
  },
  estimatedDeliveryTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export default Order;
