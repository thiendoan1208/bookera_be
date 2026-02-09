"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role",
      });

      User.hasOne(models.UserAccess, {
        foreignKey: "user_id",
        as: "user_accesses",
      });

      User.hasOne(models.UserRecover, {
        foreignKey: "user_id",
        as: "user_recover",
      });

      User.hasMany(models.UserBook, {
        foreignKey: "user_id",
        as: "user_books",
      });

      User.hasMany(models.Order, {
        foreignKey: "buyer_id",
        as: "purchases",
      });

      User.hasMany(models.Order, {
        foreignKey: "seller_id",
        as: "sales",
      });

      User.hasMany(models.Conversation, {
        foreignKey: "buyer_id",
        as: "conversations_as_buyer",
      });

      User.hasMany(models.Conversation, {
        foreignKey: "seller_id",
        as: "conversations_as_seller",
      });

      User.hasMany(models.Notification, {
        foreignKey: "user_id",
        as: "notifications",
      });

      User.hasMany(models.Message, {
        foreignKey: "sender_id",
        as: "messages",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },

      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      avatar_url: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      name_change_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },

      billing_address: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },

      phone_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: null,
      },

      phone_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },

      role_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      underscored: true,
    },
  );
  return User;
};
