const user = require("../models/user");
const chatService = require("../services/chat.service");
const userConversationService = require("../services/userConversation.service");

//  Conversation 
exports.createConversation = async (req, res) => {
  try {
    const { title, type, members } = req.body;
    const conversation = await chatService.createConversation({
      title,
      type,
      createdBy: req.user.id,
    });

    // add creator + members
    await userConversationService.addUserToConversation(
      req.user.id,
      conversation.id
    );

    if (Array.isArray(members)) {
      for (const memberId of members) {
        await userConversationService.addUserToConversation(
          memberId,
          conversation.id
        );
      }
    }

    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyConversations = async (req, res) => {
  try {
    const conversations = await userConversationService.getUserConversations(
      req.user.id
    );
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConversationById = async (req, res) => {
  try {
    const conversation = await chatService.getConversationById(
      req.params.id
    );
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateConversation = async (req, res) => {
  try {
    const { title } = req.body;
    const updated = await chatService.updateConversation(
      req.params.id,
      title
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    await chatService.deleteConversation(req.params.id);
    res.json({ message: "Conversation deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Members
exports.addMember = async (req, res) => {
  try {
    const { userId, conversationId } = req.body;
    await userConversationService.addUserToConversation(userId, conversationId);
    res.status(201).json({ message: "User added" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { userId, conversationId } = req.body;
    await userConversationService.removeUserFromConversation(userId, conversationId);
    res.json({ message: "User removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConversationMembers = async (req, res) => {
  try {
    const members = await userConversationService.getConversationMembers(req.params.conversationId);
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Messages 
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type } = req.body;
    const message = await chatService.sendMessage({
      conversationId,
      senderId: req.user.id,
      content,
      type,
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await chatService.getMessages(req.params.conversationId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId, content } = req.body;
    const message = await chatService.editMessage(messageId, req.user.id, content);
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    await chatService.deleteMessage(messageId, req.user.id);
    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Reactions 
exports.addReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const reaction = await chatService.addReaction(messageId, req.user.id, emoji);
    res.json(reaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    await chatService.removeReaction(messageId, req.user.id, emoji);
    res.json({ message: "Reaction removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Seen / Typing 
exports.markSeen = async (req, res) => {
  try {
    const { conversationId } = req.body;
    await chatService.markSeen(conversationId, req.user.id);
    res.json({ message: "Conversation marked as seen" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.typing = async (req, res) => {
  try {
    const { conversationId } = req.body;
    await chatService.typing(conversationId, req.user.id);
    res.json({ message: "Typing event sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== Search / Utilities ====================
exports.searchMessages = async (req, res) => {
  try {
    const { conversationId, keyword } = req.query;
    const results = await chatService.searchMessages(conversationId, keyword);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const counts = await chatService.getUnreadCount(req.user.id);
    
    res.json(counts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 
// chuẩn bị là Có thể tiếp tục thêm pagination, mentions, pinned messages, file upload ...
exports.mentions = async (req, res) => {
  try {
    const message = await chatService.mentions(req.params.conversationId);

    if (!message || message.length === 0) {
      return res.status(404).json({
        message: "No mentions found",
        userId: req.user.id,
        conversationId: req.params.conversationId,
      });
    }

    return res.json(message);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      error: "Failed to fetch mentions",
    });
  }
};

exports.pinnedMessages = async (req, res) => {
  try {
    const msg = req.body.message;
    const time = Date.now();

    if (!msg || msg.trim().length === 0) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (msg.trim().length > 25) {
      return res.status(400).json({
        message: "Message must be less than or equal to 25 characters long",
      });
    }

    const pinned = await chatService.pinnedMessages(req.params.conversationId);

    if (!pinned) {
      return res.status(404).json({ message: "No pinned messages found" });
    }

    return res.json({
      pinned,
      time,
      userId: req.user.id,
      conversationId: req.params.conversationId,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};