"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SavedItem extends Model {
    static associate(models) {
      SavedItem.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  SavedItem.init(
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

      item_type: {
        type: DataTypes.ENUM("book", "market_item"),
        allowNull: false,
      },

      work_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      market_item_id: {
        type: DataTypes.INTEGER(10),
        allowNull: true,
      },

      preview_image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },

      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      redirect_url: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "SavedItem",
      tableName: "saved_items",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["user_id"],
          name: "idx_saved_items_user_id",
        },
        {
          fields: ["user_id", "created_at"],
          name: "idx_saved_items_user_created",
        },
        {
          unique: true,
          fields: ["user_id", "item_type", "work_id"],
          name: "uk_saved_items_user_book",
        },
        {
          unique: true,
          fields: ["user_id", "item_type", "market_item_id"],
          name: "uk_saved_items_user_market_item",
        },
      ],
      validate: {
        validItemReference() {
          if (this.item_type === "book" && !this.work_id) {
            throw new Error("work_id is required when item_type is book");
          }

          if (this.item_type === "market_item" && !this.market_item_id) {
            throw new Error(
              "market_item_id is required when item_type is market_item",
            );
          }

          if (this.item_type === "book" && this.market_item_id) {
            throw new Error("market_item_id must be null when item_type is book");
          }

          if (this.item_type === "market_item" && this.work_id) {
            throw new Error("work_id must be null when item_type is market_item");
          }
        },
      },
    },
  );

  return SavedItem;
};
