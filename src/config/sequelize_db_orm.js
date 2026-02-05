const { Sequelize, Model } = require("sequelize");
const { config } = require("dotenv");
config();

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize(
  String(process.env.MYSQL_DATABASE),
  String(process.env.MYSQL_USER),
  String(process.env.MYSQL_PASSWORD),
  {
    host: String(process.env.MYSQL_HOST),
    port: Number(process.env.MYSQL_PORT),
    dialect: "mysql",
  },
);

const connectSequelize = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = {
  sequelize,
  connectSequelize,
};