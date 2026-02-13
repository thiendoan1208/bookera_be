const express = require("express");
const {
  getAIConversationsController,
  getAIMessagesController,
  createAIConversationController,
  sendAIMessageController,
  deleteAIConversationController,
} = require("../controller/ai_controller");
const { verifyAuth } = require("../middleware/auth_middleware");

const router = express.Router();

// Get all AI conversations
router.get("/conversations", verifyAuth, getAIConversationsController);

// Get messages for a specific conversation
router.get(
  "/conversations/:conversationId/messages",
  verifyAuth,
  getAIMessagesController,
);

// Create a new AI conversation
router.post("/conversations", verifyAuth, createAIConversationController);

// Send a message to AI
router.post("/messages", verifyAuth, sendAIMessageController);

// Delete an AI conversation
router.delete(
  "/conversations/:conversationId",
  verifyAuth,
  deleteAIConversationController,
);

module.exports = router;
