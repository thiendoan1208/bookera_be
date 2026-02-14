"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("auctions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      seller_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        // Nếu muốn FK tới users:
        // references: { model: "users", key: "id" },
        // onUpdate: "CASCADE",
        // onDelete: "CASCADE",
      },

      book_key: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      book_snapshot: {
        type: Sequelize.JSON,
        allowNull: false,
      },

      start_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },

      current_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },

      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      end_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM(
          "pending", // chưa bắt đầu
          "active", // đang đấu giá
          "finished", // hết giờ
          "paid", // đã thanh toán
          "cancelled",
        ),
        allowNull: false,
        defaultValue: "pending",
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("auctions");
  },
};
