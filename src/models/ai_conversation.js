"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AIConversation extends Model {
    static associate(models) {
      // AI Conversation belongs to User
      AIConversation.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      // AI Conversation has many AI Messages
      AIConversation.hasMany(models.AIMessage, {
        foreignKey: "ai_conversation_id",
        as: "messages",
      });
    }
  }

  AIConversation.init(
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
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      last_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      last_message_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      daily_message_limit: {
        type: DataTypes.INTEGER(10),
        allowNull: false,
        defaultValue: 0,
      },
      last_message_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "AIConversation",
      tableName: "ai_conversations",
      timestamps: true,
      underscored: true,
    },
  );

  return AIConversation;
};
