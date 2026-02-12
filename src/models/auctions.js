module.exports = (sequelize, DataTypes) => {
  const Auction = sequelize.define(
    "Auction",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      seller_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      // ID từ Open Library
      book_key: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // Snapshot tại thời điểm tạo auction
      book_snapshot: {
        type: DataTypes.JSON,
        allowNull: false,
      },

      start_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      current_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM(
          "pending",   // chưa bắt đầu
          "active",    // đang đấu giá
          "finished",  // hết giờ
          "paid",      // đã thanh toán
          "cancelled"
        ),
        defaultValue: "pending",
      },
    },
    {
      tableName: "auctions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Auction.associate = (models) => {
    Auction.belongsTo(models.User, {
      foreignKey: "seller_id",
      as: "seller",
    });

    Auction.hasMany(models.Bid, {
      foreignKey: "auction_id",
      as: "bids",
    });
  };

  return Auction;
};
