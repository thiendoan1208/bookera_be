const express = require("express");
const socketIo = require("socket.io");
const http = require("http");
const chatService = require('../service/chat.service');
const user = require("../models/user");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const db = require("../models");



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
const e = require("express");

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
exports.sendMessage = async ({ conversationId, senderId, content, type }) => {
try{
if(!content || content.trim() === '' || typeof content !== 'string'){
  throw new Error("Invalid message content");
}

const insertMessage = await db.Message.create(
    `INSERT INTO messages (user_id, conversation_id, content, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [senderId, conversationId, content.trim()]
); 


io.emit("newMessage", {  conversationId,
  message: insertMessage,
});
}catch(err){
  console.error('Error handling message:', err);
    throw err;
}
}

exports.getMessages = async (conversationId,page = 1, limit = 20) => {
  const offset = (page - 1) * limit;  //dùng để giới hạn số trang trả về giảm tải db
  const messages = await db.Message.create(
  `SELECT * FROM messages
   WHERE conversation_id = $1
   ORDER BY created_at DESC
   LIMIT $2 OFFSET $3`,
  [conversationId, limit, offset]
  );
  return messages;
}


exports.editMessage = async (messageId, userId, newContent) => {
  if(userId !== role.userId){
    throw new Error("Unauthorized to edit this message");
  }else{
    const limit = 10; // giới hạn số lần chỉ đc 10 lần 

    if(limit <= 0){
    const updatedMessage = await db.Message.update(
      `UPDATE messages
       SET content = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [newContent, messageId]
    );
    limit--;
    return updatedMessage;
  }
  
  }
    return updatedMessage;
}
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