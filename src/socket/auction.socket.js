const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let ioInstance = null;

// Nếu cần dùng io trong service khác
const getIO = () => ioInstance;

const initAuctionSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  ioInstance = io;

  io.on("connection", (socket) => {
    // optional: auth qua token
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    let user = null;

    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = user;
      } catch (e) {
        // nếu token sai có thể ngắt kết nối hoặc cho vào chế độ anonymous
      }
    }

    // client join vào phòng của 1 auction
    socket.on("join-auction", (auctionId) => {
      if (!auctionId) return;
      const room = `auction_${auctionId}`;
      socket.join(room);
      socket.emit("joined-auction", { auctionId });
    });

    // client rời phòng
    socket.on("leave-auction", (auctionId) => {
      if (!auctionId) return;
      const room = `auction_${auctionId}`;
      socket.leave(room);
    });

    // khi client disconnect
    socket.on("disconnect", () => {
      // có thể log hoặc xử lý thêm
    });
  });
};

module.exports = {
  initAuctionSocket,
  getIO,
};