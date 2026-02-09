const { Server } = require("socket.io");
const { config } = require("dotenv");
config();

let io = null;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.BOOKERA_FE_URL,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a user room for notifications
    socket.on("join_user_room", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user_${userId}`);
    });

    // Join a conversation room
    socket.on("join_conversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation_${conversationId}`);
    });

    // Leave a conversation room
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} left conversation_${conversationId}`);
    });

    // Join messages page room (to suppress message notifications)
    socket.on("join_messages_page", (userId) => {
      socket.join(`messages_page_${userId}`);
      console.log(`Socket ${socket.id} joined messages_page_${userId}`);
    });

    // Leave messages page room
    socket.on("leave_messages_page", (userId) => {
      socket.leave(`messages_page_${userId}`);
      console.log(`Socket ${socket.id} left messages_page_${userId}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
