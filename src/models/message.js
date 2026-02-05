module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      conversation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'conversation',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },

      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'user',
          key: 'id',
        },
      },

      content: {
        type: DataTypes.STRING(1000),
        allowNull: false,
      },

      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'text',
      },

      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );

  return Message;
};
