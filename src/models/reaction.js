module.exports = (sequelize, DataTypes) => {
  const Reaction = sequelize.define(
    'Reaction',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      message_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      emoji: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      tableName: 'reactions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Reaction;
};
