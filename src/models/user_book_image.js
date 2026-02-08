"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class UserBookImage extends Model {
    static associate(models) {
      UserBookImage.belongsTo(models.UserBook, {
        foreignKey: "user_book_id",
        as: "user_book",
      });
    }
  }

  UserBookImage.init(
    {
      id: {
        type: DataTypes.INTEGER(10),
        primaryKey: true,
        autoIncrement: true,
      },

      user_book_id: {
        type: DataTypes.INTEGER(10),
        allowNull: false,
      },

      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "UserBookImage",
      tableName: "user_book_image",
      timestamps: true,
      underscored: true,
    },
  );
  return UserBookImage;
};
