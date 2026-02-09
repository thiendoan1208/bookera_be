const {
  getOrCreateConversationService,
  getConversationsService,
  getMessagesService,
  sendMessageService,
  markMessagesAsReadService,
  markAllConversationsAsReadService,
  deleteConversationsService,
} = require("../services/message_service");
const { cloudinary } = require("../config/cloudinary");

/**
 * Get all conversations for the authenticated user
 */
const getConversationsController = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await getConversationsService(userId);

    res.status(200).json({
      message: "Conversations retrieved successfully",
      data: conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      message: "Failed to get conversations",
      error: error.message,
    });
  }
};

/**
 * Create or get a conversation for a listing
 */
const createConversationController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listing_id } = req.body;

    if (!listing_id) {
      return res.status(400).json({
        message: "listing_id is required",
      });
    }

    const conversation = await getOrCreateConversationService(
      userId,
      listing_id,
    );

    res.status(200).json({
      message: "Conversation retrieved successfully",
      data: conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    // Handle specific errors
    if (
      error.message === "Listing not found" ||
      error.message === "Cannot create conversation with yourself"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};

/**
 * Get messages for a specific conversation
 */
const getMessagesController = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    const messages = await getMessagesService(conversationId, userId);

    res.status(200).json({
      message: "Messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    // Handle specific errors
    if (error.message === "Conversation not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (error.message === "Unauthorized access to conversation") {
      return res.status(403).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to get messages",
      error: error.message,
    });
  }
};

/**
 * Send a message in a conversation
 */
const sendMessageController = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const { message, image_url } = req.body;

    if ((!message || message.trim() === "") && !image_url) {
      return res.status(400).json({
        message: "Message or image is required",
      });
    }

    const newMessage = await sendMessageService(
      conversationId,
      userId,
      message?.trim() || "",
      image_url || null,
    );

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    // Handle specific errors
    if (error.message === "Conversation not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (error.message === "Unauthorized to send message in this conversation") {
      return res.status(403).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to send message",
      error: error.message,
    });
  }
};

/**
 * Mark messages as read in a conversation
 */
const markMessagesAsReadController = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    const result = await markMessagesAsReadService(conversationId, userId);

    res.status(200).json({
      message: "Messages marked as read successfully",
      data: result,
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);

    // Handle specific errors
    if (error.message === "Conversation not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (error.message === "Unauthorized access to conversation") {
      return res.status(403).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
};

/**
 * Mark all conversations as read for the authenticated user
 */
const markAllConversationsAsReadController = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await markAllConversationsAsReadService(userId);

    res.status(200).json({
      message: "All conversations marked as read successfully",
      data: result,
    });
  } catch (error) {
    console.error("Mark all conversations as read error:", error);
    res.status(500).json({
      message: "Failed to mark all conversations as read",
      error: error.message,
    });
  }
};

/**
 * Delete conversations for the authenticated user
 */
const deleteConversationsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversation_ids } = req.body;

    if (
      !conversation_ids ||
      !Array.isArray(conversation_ids) ||
      conversation_ids.length === 0
    ) {
      return res.status(400).json({
        message: "conversation_ids array is required",
      });
    }

    const results = await deleteConversationsService(conversation_ids, userId);

    res.status(200).json({
      message: "Conversations deleted successfully",
      data: results,
    });
  } catch (error) {
    console.error("Delete conversations error:", error);
    res.status(500).json({
      message: "Failed to delete conversations",
      error: error.message,
    });
  }
};

/**
 * Upload message image to Cloudinary
 */
const uploadMessageImageController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided",
      });
    }

    // Upload to Cloudinary using buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "bookera/messages",
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      uploadStream.end(req.file.buffer);
    });

    res.status(200).json({
      message: "Image uploaded successfully",
      data: {
        image_url: result.secure_url,
      },
    });
  } catch (error) {
    console.error("Upload message image error:", error);
    res.status(500).json({
      message: "Failed to upload image",
      error: error.message,
    });
  }
};

module.exports = {
  getConversationsController,
  createConversationController,
  getMessagesController,
  sendMessageController,
  markMessagesAsReadController,
  markAllConversationsAsReadController,
  deleteConversationsController,
  uploadMessageImageController,
};
