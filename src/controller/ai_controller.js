const {
  getAIConversationsService,
  getAIMessagesService,
  createAIConversationService,
  sendAIMessageService,
  deleteAIConversationService,
} = require("../services/ai_service");

/**
 * Get all AI conversations for the authenticated user
 */
const getAIConversationsController = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await getAIConversationsService(userId);

    res.status(200).json({
      message: "AI conversations retrieved successfully",
      data: conversations,
    });
  } catch (error) {
    console.error("Get AI conversations error:", error);
    res.status(500).json({
      message: "Failed to get AI conversations",
      error: error.message,
    });
  }
};

/**
 * Get messages for a specific AI conversation
 */
const getAIMessagesController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const messages = await getAIMessagesService(userId, conversationId);

    res.status(200).json({
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Get AI messages error:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      message: "Failed to get messages",
      error: error.message,
    });
  }
};

/**
 * Create a new AI conversation
 */
const createAIConversationController = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversation = await createAIConversationService(userId);

    res.status(201).json({
      message: "AI conversation created successfully",
      data: conversation,
    });
  } catch (error) {
    console.error("Create AI conversation error:", error);
    res.status(500).json({
      message: "Failed to create AI conversation",
      error: error.message,
    });
  }
};

/**
 * Send a message to AI
 */
const sendAIMessageController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const result = await sendAIMessageService(userId, conversationId, message);

    res.status(200).json({
      message: "Message sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Send AI message error:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};

/**
 * Delete an AI conversation
 */
const deleteAIConversationController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const result = await deleteAIConversationService(userId, conversationId);

    res.status(200).json(result);
  } catch (error) {
    console.error("Delete AI conversation error:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({
      message: "Failed to delete conversation",
      error: error.message,
    });
  }
};

module.exports = {
  getAIConversationsController,
  getAIMessagesController,
  createAIConversationController,
  sendAIMessageController,
  deleteAIConversationController,
};
