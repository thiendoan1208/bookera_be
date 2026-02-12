module.exports = (sequelize, DataTypes) => {
  const Bid = sequelize.define(
    "Bid",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      auction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: "bids",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  Bid.associate = (models) => {
    Bid.belongsTo(models.Auction, {
      foreignKey: "auction_id",
    });

    Bid.belongsTo(models.User, {
      foreignKey: "user_id",
    });
  };

  return Bid;
};
