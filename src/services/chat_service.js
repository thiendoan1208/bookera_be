const express = require("express");
const socketIo = require("socket.io");
const http = require("http");
const chatService = require('../service/chat.service');
const user = require("../models/user");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);



io.on("connection", (socket) => {
    const user = {
        user: Model.user.username,
        userId: Model.user.id

    }; // Lấy thông tin user từ token hoặc session
    console.log("New client connected", user);   
   
  socket.on('chat message', (data) => {
    console.log('message: ' + data.msg + ' from user: ' + data.user);
 
    io.emit('chat message', data);
}
)
});
const UserConversation = require("../models/userconversation");
const Conversation = require("../models/conversation");
const User = require("../models/user");

exports.addUserToConversation = async (userId, conversationId) => {
  return UserConversation.create({
    user_id: userId,
    conversation_id: conversationId,
  });
};

exports.removeUserFromConversation = async (userId, conversationId) => {
  return UserConversation.destroy({
    where: {
      user_id: userId,
      conversation_id: conversationId,
    },
  });
};

exports.getUserConversations = async (userId) => {
  return Conversation.findAll({
    include: [
      {
        model: UserConversation,
        where: { user_id: userId },
        attributes: [],
      },
    ],
    order: [["last_message_at", "DESC"]],
  });
};

exports.getConversationMembers = async (conversationId) => {
  return User.findAll({
    include: [
      {
        model: UserConversation,
        where: { conversation_id: conversationId },
        attributes: [],
      },
    ],
    attributes: ["id", "username", "email"],
  });
};

exports.isUserInConversation = async (userId, conversationId) => {
  const member = await UserConversation.findOne({
    where: {
      user_id: userId,
      conversation_id: conversationId,
    },
  });

  return !!member;
};

//tính năng thêm 
exports.sendMessage = async ({ conversationId, senderId, content, type }) => {}
exports.editMessage = async (messageId, userId, newContent) => {}
exports.deleteMessage = async (messageId, userId) => {}
exports.replyMessage = async ({ parentId, senderId, content }) => {}
exports.forwardMessage = async ({ originalMessageId, newConversationId, senderId }) => {}
exports.addReaction = async (messageId, userId, emoji) => {}
exports.removeReaction = async (messageId, userId, emoji) => {}
exports.markSeen = async (conversationId, userId) => {}
exports.markDelivered = async (conversationId, userId) => {}
exports.getMessages = async (conversationId, page, limit) => {}
exports.searchMessages = async (conversationId, keyword) => {}
exports.sendFile = async ({ conversationId, senderId, fileMetadata }) => {}
exports.typing = async (conversationId, userId) => {}


io.on("disconnect", () => {
    console.log("Client disconnected");
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Chat server running on port ${PORT}`));  