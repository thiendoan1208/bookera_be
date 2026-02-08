"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserBook extends Model {
    static associate(models) {
      UserBook.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      UserBook.belongsTo(models.User, {
        foreignKey: "buyer_id",
        as: "buyer",
      });

      UserBook.hasMany(models.UserBookImage, {
        foreignKey: "user_book_id",
        as: "images",
      });

      UserBook.hasMany(models.Order, {
        foreignKey: "listing_id",
        as: "orders",
      });
    }
  }

  UserBook.init(
    {
      id: {
        type: DataTypes.INTEGER(10),
        primaryKey: true,
        autoIncrement: true,
      },

      user_id: {
        type: DataTypes.INTEGER(10),
        allowNull: false,
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      author: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      price: {
        type: DataTypes.INTEGER(10),
        allowNull: true,
      },

      upload_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      condition: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      category: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      sold: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      buyer_id: {
        type: DataTypes.INTEGER(10),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "UserBook",
      tableName: "user_book",
      timestamps: true,
      underscored: true,
    },
  );
  return UserBook;
};
