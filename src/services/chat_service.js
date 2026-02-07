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
const { type } = require("os");
const { where } = require("sequelize");
const { error } = require("console");

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
exports.deleteMessage = async (messageId, userId, content) => {
  try {
    const message = content.trim() === '' ? '[message deleted]' : content;
  if(userId !== role.userId){
    throw new Error("Unauthorized to delete this message");
  }else{
    const deletedMessage = await db.Message.update(
      `UPDATE messages
       SET content = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [message, messageId]
    );
    return deletedMessage;
  }
  return this.deleteMessage;
    
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
  
}
exports.replyMessage = async ({ parentId, senderId, content }) => {
  try {
      if(!content || content.trim() === '' || typeof content !== 'string'){
    throw new Error("Invalid message content");
  }
  if(!parentId || typeof parentId !== 'number'){
    throw new Error("Invalid parent message ID"); 
  }
    if(!senderId || typeof senderId !== 'number'){
    throw new Error("Invalid sender ID"); 
  }
  const rootMessage = await db.Message.findByPk(parentId);
  if(!rootMessage){
    throw new Error("Parent message not found");
  }
  const user = await db.User.findAll({
    where:{id:senderId},
    attributes: ['id', 'username']
  });
  const currentMessage = content.trim();
  const newmessage = await db.Message.create(
    `INSERT INTO messages (conversation_id, sender_id, content, type, created_at)
     VALUES ($1, $2, $3, 'reply', NOW()) RETURNING *`,
     [rootMessage.conversation_id, senderId, content.trim()]
  );
  io.emit("newReply", {
    conversationId: rootMessage.conversation_id,
    message: currentMessage,
    sender: user
  });
 return newmessage;
    
  } catch (error) {
    throw error;
  }

}
exports.forwardMessage = async ({ originalMessageId, newConversationId, senderId }) => {
  try{  
   if(!originalMessageId || typeof originalMessageId !== 'number'){
    throw new Error("Invalid original message ID")
   }
   if(!newConversationId || typeof newConversationId !== 'number'){   
    throw new Error("Invalid new conversation ID");
   }
   if(!senderId || typeof senderId !== 'number')
   {
    throw new Error("Invalid sender Id");
   }
   const originalMessage = await db.Message.findByPk(originalMessageId);
   if(!originalMessage){
    throw new Error("Original message not found");
   }
   const forwardedMessage = await db.Message.create(
    `INSERT INTO messages (conversation_id, sender_id, content, type, created_at)
     VALUES ($1, $2, $3, 'forward', NOW()) RETURNING *`,
     [newConversationId, senderId, originalMessage.content]
   );
    io.emit("newForwardedMessage", {
      newConversationId: newConversationId,
      message: forwardedMessage,
      senderId: senderId
    });
   return forwardedMessage;
  }catch(err){
    throw err;
  }


}
exports.addReaction = async (messageId, userId, emoji) => {
  try {
     if(!messageId || typeof messageId !== 'number'){
    throw new Error("Invalid message ID");
  }
  if(!userId || typeof userId !== 'number'){
    throw new Error("Invalid user ID");
  } 
  if(!emoji || typeof emoji !== 'string' || emoji.trim() === ''){
      throw new Error("Invalid emoji"); 
  }
  const checkUsers = await db.User.findByPk(userId);
  if(!checkUsers){
    throw new Error("User not found or not in this chat");
  }
  const checkMessage = await db.Message.findByPk(messageId);
  if(!checkMessage){
    throw new Error("Message not found"); }
  const existingReaction = await db.Reaction.findOne({
    where:{
      message_id: messageId,
      user_id: userId,
      emoji: emoji.trim()
    }
  });
  if(existingReaction){
    await db.Reaction.destroy({
      where:{
        id: existingReaction.id
      }
    });
    io.emit("reactionRemoved", {
      messageId: messageId,
      userId: userId,
      emoji: emoji.trim()
    });
  }else{
    const newReaction = await db.Reaction.create({
      message_id: messageId, 
      emoji: emoji.trim(),
      user_id: userId
    });
    io.emit("reactionAdded", {
      messageId: messageId,
      userId: userId,         
      emoji: emoji.trim()
    });
    return newReaction;
    }

  } catch (error) {
    throw error;
  }
 

}
exports.removeReaction = async (io, messageId, userId, emoji) => {
  try {
    // ===== Validate =====
    const msgId = Number(messageId);
    const uId = Number(userId);
    const e = String(emoji || "").trim();

    if (!Number.isInteger(msgId) || msgId <= 0) {
      throw new Error("Invalid message ID");
    }

    if (!Number.isInteger(uId) || uId <= 0) {
      throw new Error("Invalid user ID");
    }

    if (!e) {
      throw new Error("Invalid emoji");
    }

    // ===== Find reaction =====
    const existingReaction = await db.Reaction.findOne({
      where: {
        emoji: e,
        message_id: msgId,
        user_id: uId,
      },
    });

    if (!existingReaction) {
      throw new Error("Reaction not found");
    }

    // ===== Delete =====
    const deletedCount = await db.Reaction.destroy({
      where: {
        emoji: e,
        message_id: msgId,
        user_id: uId,
      },
    });

    if (deletedCount === 0) {
      throw new Error("Failed to delete reaction");
    }

    // ===== Emit socket =====
    if (io) {
      io.emit("reactionRemoved", {
        messageId: msgId,
        userId: uId,
        emoji: e,
      });
    }

    return {
      message: "Reaction removed",
      messageId: msgId,
      userId: uId,
      emoji: e,
    };
  } catch (error) {
    // giữ lỗi thật để debug
    throw new Error(error.message || "Failed to remove reaction");
  }
};

exports.markSeen = async (conversationId, userId) => {
  try {
    if(!conversationId || typeof conversationId !== 'number'){
      throw new Error("Invalid conversation ID");
    }
    if(!userId || typeof userId !== 'number'){
      throw new Error("Invalid user ID");
    }

    const messageStatus = await db.message.create({
    conversation_id: conversationId,
    user_id: userId,
    status: "seen",
    seen_at: new Date()
  });

  const saveMessageStatus = await messageStatus.save({
    messageStatus: messageStatus,
  });
  return saveMessageStatus;
  } catch (error) {
    throw error;
  }
}
exports.markDelivered = async (conversationId, userId) => {
try {
  if(!conversationId || typeof conversationId !=="number")
  {
    throw new error("invalid consversationId");
  }
  if(!userId || typeof userId !=="number")
  {
    throw new error("invalid userId");
  }
  const markDelivered = await db.message.create({
    conversationId: conversationId,
    user_Id : userId,  
   last_delivered_at: "now",
    seen_at: new Date()
  });

  return markDelivered;


} catch (error) {
  throw error
}
}

exports.searchMessages = async (conversationId, keyword) => {
  if (!conversationId) throw new Error("conversationId is required");
  if (!keyword || keyword.trim() === "") return [];

  const results = await db.Message.findAll({
    where: {
      conversation_id: conversationId,
      content: { [Op.like]: `%${keyword.trim()}%` },
    },
    include: [
      {
        model: db.User,
        as: "sender",
        attributes: ["id", "name", "avatar"],
      },
    ],
    order: [["created_at", "DESC"]],
    limit: 50,
  });

  return results;
};

    
  
exports.sendFile = async ({ conversationId, senderId, fileMetadata }) => {
  if (!conversationId) throw new Error("conversationId is required");
  if (!senderId) throw new Error("senderId is required");
  if (!fileMetadata) throw new Error("fileMetadata is required");

  const msg = await db.Message.create({
    conversation_id: conversationId,
    sender_id: senderId,
    content: fileMetadata.url,      // hoặc JSON.stringify(fileMetadata)
    type: "file",
  });

  const fullMsg = await db.Message.findByPk(msg.id, {
    include: [
      { model: db.User, as: "sender", attributes: ["id", "name", "avatar"] },
    ],
  });

  io.to(`conversation_${conversationId}`).emit("newMessage", fullMsg);

  return fullMsg;
};

exports.typing = async (conversationId, userId) => {
  if (!conversationId) throw new Error("conversationId is required");
  if (!userId) throw new Error("userId is required");

  io.to(`conversation_${conversationId}`).emit("typing", {
    conversationId,
    userId,
    time: Date.now(),
  });

  return true;
};



io.on("disconnect", () => {
    console.log("Client disconnected");
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Chat server running on port ${PORT}`));  