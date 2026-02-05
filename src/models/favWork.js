module.exports = (sequelize, DataTypes) => {
  const FavWork = sequelize.define(
    'FavWork',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      work_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      work_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      cover_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      first_publish_year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
    }
  );

  return FavWork;
};
