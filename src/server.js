const express = require("express");
const http = require("http");
const { config } = require("dotenv");
const { apiRoutes } = require("./routes/API_routes");
const { configCORS } = require("./config/cors");
const cookieParser = require("cookie-parser");
const { connectSequelize } = require("./config/sequelize_db_orm");
const { initAuctionSocket } = require("./socket/auction.socket");

config();

const app = express();
const server = http.createServer(app);

const port = process.env.BOOKERA_BE_PORT || 8080;
const hostname = process.env.BOOKERA_BE_HOSTNAME;

configCORS(app);

// config body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// config cookie-parser
app.use(cookieParser());

// Testing Sequelize connectionnnn
connectSequelize();

// Routes
app.use("/api", apiRoutes);

// Socket.IO for auctions
initAuctionSocket(server);

server.listen(port, () => {
  console.log(`Example app listening on http://${hostname}:${port}`);
});
