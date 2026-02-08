"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.UserBook, {
        foreignKey: "listing_id",
        as: "listing",
      });

      Order.belongsTo(models.User, {
        foreignKey: "buyer_id",
        as: "buyer",
      });

      Order.belongsTo(models.User, {
        foreignKey: "seller_id",
        as: "seller",
      });
    }
  }

  Order.init(
    {
      id: {
        type: DataTypes.INTEGER(10),
        primaryKey: true,
        autoIncrement: true,
      },
      listing_id: {
        type: DataTypes.INTEGER(10),
        allowNull: false,
      },
      buyer_id: {
        type: DataTypes.INTEGER(10),
        allowNull: false,
      },
      seller_id: {
        type: DataTypes.INTEGER(10),
        allowNull: false,
      },
      stripe_session_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      stripe_payment_intent_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      amount: {
        type: DataTypes.INTEGER(10),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "cad",
      },
      payment_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      timestamps: true,
      underscored: true,
    },
  );

  return Order;
};
