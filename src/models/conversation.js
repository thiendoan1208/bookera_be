"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      // Conversation belongs to a listing (UserBook)
      Conversation.belongsTo(models.UserBook, {
        foreignKey: "listing_id",
        as: "listing",
      });

      // Conversation belongs to buyer (User)
      Conversation.belongsTo(models.User, {
        foreignKey: "buyer_id",
        as: "buyer",
      });

      // Conversation belongs to seller (User)
      Conversation.belongsTo(models.User, {
        foreignKey: "seller_id",
        as: "seller",
      });

      // Conversation has many messages
      Conversation.hasMany(models.Message, {
        foreignKey: "conversation_id",
        as: "messages",
      });
    }
  }

  Conversation.init(
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
      last_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      last_message_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_sender_id: {
        type: DataTypes.INTEGER(10),
        allowNull: true,
      },
      deleted_by_buyer_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deleted_by_seller_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      buyer_messages_hidden_before_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      seller_messages_hidden_before_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Conversation",
      tableName: "conversations",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["listing_id", "buyer_id"],
          name: "unique_conversation_per_listing_buyer",
        },
      ],
    },
  );

  return Conversation;
};
