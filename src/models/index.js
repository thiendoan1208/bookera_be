"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config,
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    const isHidden = file.indexOf(".") === 0;
    const isIndex = file === basename;
    const isAssociate = file === "associate.js";
    const isJs = file.slice(-3) === ".js" || file.slice(-3) === ".ts";
    return !isHidden && !isIndex && !isAssociate && isJs;
  })
  .forEach((file) => {
    const modelFactory = require(path.join(__dirname, file));

    // Nếu file không export ra function (model factory) thì bỏ qua
    if (typeof modelFactory !== "function") {
      return;
    }

    const model = modelFactory(sequelize, Sequelize.DataTypes);

    if (!model || !model.name) {
      return;
    }

    db[model.name] = model;
  });

const associate = require("./associate");
associate(db);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
