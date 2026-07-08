import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Color = sequelize.define('Color', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  hexCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default Color;
