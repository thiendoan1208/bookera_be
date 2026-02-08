const express = require("express");
const { config } = require("dotenv");
const { apiRoutes } = require("./routes/API_routes");
const { webhookRoutes } = require("./routes/webhook_routes");
const { configCORS } = require("./config/cors");
const cookieParser = require("cookie-parser");
const { connectSequelize } = require("./config/sequelize_db_orm");
config();

const app = express();
const port = process.env.BOOKERA_BE_PORT || 8080;
const hostname = process.env.BOOKERA_BE_HOSTNAME;

configCORS(app);

// Webhook routes MUST come before JSON middleware (needs raw body)
app.use("/webhook", webhookRoutes);

// config body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// config cookie-parser
app.use(cookieParser());

// Testing Sequelize connectionnnn
connectSequelize();

// Routes
app.use("/api", apiRoutes);

app.listen(port, () => {
  console.log(`Example app listening on http://${hostname}:${port}`);
});
