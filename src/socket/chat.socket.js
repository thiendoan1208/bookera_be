const chatService = require("../services/chat.service");
const jwt = require("jsonwebtoken");

module.exports = (io) => {
  // JWT middleware cho socket
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const user = jwt.verify(token, process.env.JWT_SECRET_KEY);
      socket.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user.username);

    socket.on("joinRoom", (roomId) => {
      socket.join(`conversation_${roomId}`);
    });

   socket.on("joinConversation", async (conversationId) => {
  socket.join(`conversation_${conversationId}`);
});

socket.on("typing", async ({ conversationId, isTyping }) => {
  await userConversationService.setTyping(socket.user.id, conversationId, isTyping);
  socket.to(`conversation_${conversationId}`).emit("typing", { userId: socket.user.id, isTyping });
});

socket.on("messageSent", async ({ conversationId, messageId }) => {
  await userConversationService.incrementUnread(conversationId, socket.user.id);
});
  });
};
