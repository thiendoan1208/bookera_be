"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AIMessage extends Model {
    static associate(models) {
      // AI Message belongs to AI Conversation
      AIMessage.belongsTo(models.AIConversation, {
        foreignKey: "ai_conversation_id",
        as: "conversation",
      });
    }
  }

  AIMessage.init(
    {
      id: {
        type: DataTypes.INTEGER(10),
        primaryKey: true,
        autoIncrement: true,
      },
      ai_conversation_id: {
        type: DataTypes.INTEGER(10),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM("user", "assistant"),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "AIMessage",
      tableName: "ai_messages",
      timestamps: true,
      underscored: true,
    },
  );

  return AIMessage;
};
