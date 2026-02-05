const UserConversation = require("../models/userconversation");
const Conversation = require("../models/conversation");
const User = require("../models/user");

// Thêm user vào conversation
exports.addUserToConversation = async (userId, conversationId) => {
  return UserConversation.create({
    user_id: userId,
    conversation_id: conversationId,
  });
};

// Xóa user khỏi conversation
exports.removeUserFromConversation = async (userId, conversationId) => {
  return UserConversation.destroy({
    where: {
      user_id: userId,
      conversation_id: conversationId,
    },
  });
};

// Lấy tất cả conversation của 1 user
exports.getUserConversations = async (userId) => {
  return Conversation.findAll({
    include: [
      {
        model: UserConversation,
        where: { user_id: userId },
        attributes: [], // không lấy thông tin join
      },
    ],
    order: [["last_message_at", "DESC"]], // mới nhất lên đầu
  });
};

// Lấy tất cả thành viên trong 1 conversation
exports.getConversationMembers = async (conversationId) => {
  return User.findAll({
    include: [
      {
        model: UserConversation,
        where: { conversation_id: conversationId },
        attributes: [],
      },
    ],
    attributes: ["id", "username", "email"], // lấy thông tin cơ bản
  });
};

// Kiểm tra user có thuộc conversation hay không
exports.isUserInConversation = async (userId, conversationId) => {
  const member = await UserConversation.findOne({
    where: { user_id: userId, conversation_id: conversationId },
  });
  return !!member;
};

// Lấy số lượng user trong conversation
exports.getMemberCount = async (conversationId) => {
  return UserConversation.count({
    where: { conversation_id: conversationId },
  });
};
