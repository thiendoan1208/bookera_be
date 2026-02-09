const express = require("express");
const {
  getConversationsController,
  createConversationController,
  getMessagesController,
  sendMessageController,
  markMessagesAsReadController,
  markAllConversationsAsReadController,
  deleteConversationsController,
  uploadMessageImageController,
} = require("../controller/message_controller");
const { verifyAuth } = require("../middleware/auth_middleware");
const { upload } = require("../middleware/multer");

const messageRoutes = express.Router();

// All message routes require authentication
messageRoutes.use(verifyAuth);

// Get all conversations for current user
messageRoutes.get("/conversations", getConversationsController);

// Create or get conversation for a listing
messageRoutes.post("/conversations", createConversationController);

// Delete conversations
messageRoutes.delete("/conversations", deleteConversationsController);

// Upload message image
messageRoutes.post(
  "/upload-image",
  upload.single("image"),
  uploadMessageImageController,
);

// Get messages for a specific conversation
messageRoutes.get("/conversations/:id/messages", getMessagesController);

// Send a message in a conversation
messageRoutes.post("/conversations/:id/messages", sendMessageController);

// Mark messages as read
messageRoutes.patch("/conversations/:id/read", markMessagesAsReadController);

// Mark all conversations as read
messageRoutes.patch(
  "/conversations-read-all",
  markAllConversationsAsReadController,
);

module.exports = {
  messageRoutes,
};
