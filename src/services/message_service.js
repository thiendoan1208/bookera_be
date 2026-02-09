const {
  Conversation,
  Message,
  User,
  UserBook,
  UserBookImage,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const { getIO } = require("../config/socket");
const { createNotificationService } = require("./notification_service");

/**
 * Get or create a conversation between buyer and seller for a listing
 */
const getOrCreateConversationService = async (buyerId, listingId) => {
  // Get listing info first to validate and get seller_id
  const listing = await UserBook.findByPk(listingId, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "avatar_url"],
      },
    ],
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  const sellerId = listing.user_id;

  // Check if buyer is trying to message themselves
  if (buyerId === sellerId) {
    throw new Error("Cannot create conversation with yourself");
  }

  // Try to find existing conversation
  let conversation = await Conversation.findOne({
    where: {
      listing_id: listingId,
      buyer_id: buyerId,
    },
    include: [
      {
        model: UserBook,
        as: "listing",
        include: [
          {
            model: UserBookImage,
            as: "images",
            attributes: ["image_url"],
            limit: 1,
          },
        ],
      },
      {
        model: User,
        as: "buyer",
        attributes: ["id", "username", "avatar_url"],
      },
      {
        model: User,
        as: "seller",
        attributes: ["id", "username", "avatar_url"],
      },
    ],
  });

  // If conversation doesn't exist, create it
  if (!conversation) {
    conversation = await Conversation.create({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
    });

    // Fetch the full conversation with includes
    conversation = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: UserBook,
          as: "listing",
          include: [
            {
              model: UserBookImage,
              as: "images",
              attributes: ["image_url"],
              limit: 1,
            },
          ],
        },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "username", "avatar_url"],
        },
        {
          model: User,
          as: "seller",
          attributes: ["id", "username", "avatar_url"],
        },
      ],
    });
  } else {
    // Conversation exists - reset deleted_at so it appears in list
    // But keep messages_hidden_before_at to filter old messages
    const updateData = {};
    if (conversation.deleted_by_buyer_at && conversation.buyer_id === buyerId) {
      updateData.deleted_by_buyer_at = null;
      // Clear message preview when restoring conversation
      updateData.last_message = null;
      updateData.last_message_time = null;
      updateData.last_sender_id = null;
    }

    if (Object.keys(updateData).length > 0) {
      await conversation.update(updateData);
    }

    // Refetch with includes
    conversation = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: UserBook,
          as: "listing",
          include: [
            {
              model: UserBookImage,
              as: "images",
              attributes: ["image_url"],
              limit: 1,
            },
          ],
        },
        {
          model: User,
          as: "buyer",
          attributes: ["id", "username", "avatar_url"],
        },
        {
          model: User,
          as: "seller",
          attributes: ["id", "username", "avatar_url"],
        },
      ],
    });
  }

  return conversation;
};

/**
 * Get all conversations for a user
 */
const getConversationsService = async (userId) => {
  const conversations = await Conversation.findAll({
    where: {
      [Op.or]: [
        {
          buyer_id: userId,
          deleted_by_buyer_at: null,
        },
        {
          seller_id: userId,
          deleted_by_seller_at: null,
        },
      ],
    },
    attributes: {
      include: [
        [
          // Count unread messages for this user
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM messages
            WHERE messages.conversation_id = Conversation.id
            AND messages.sender_id != ${userId}
            AND messages.is_read = false
          )`),
          "unread_count",
        ],
      ],
    },
    include: [
      {
        model: UserBook,
        as: "listing",
        attributes: ["id", "title", "price"],
        include: [
          {
            model: UserBookImage,
            as: "images",
            attributes: ["image_url"],
            limit: 1,
          },
        ],
      },
      {
        model: User,
        as: "buyer",
        attributes: ["id", "username", "avatar_url"],
      },
      {
        model: User,
        as: "seller",
        attributes: ["id", "username", "avatar_url"],
      },
    ],
    order: [
      ["last_message_time", "DESC"],
      ["created_at", "DESC"],
    ],
  });

  return conversations;
};

/**
 * Get messages for a specific conversation
 */
const getMessagesService = async (conversationId, userId) => {
  // First verify user is part of this conversation
  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
    throw new Error("Unauthorized access to conversation");
  }

  // Determine which message filter timestamp to check
  const isBuyer = conversation.buyer_id === userId;
  const messagesHiddenBefore = isBuyer
    ? conversation.buyer_messages_hidden_before_at
    : conversation.seller_messages_hidden_before_at;

  // Build where condition for messages
  const messageWhere = { conversation_id: conversationId };

  // If user deleted conversation, only show messages after that time
  if (messagesHiddenBefore) {
    messageWhere.created_at = {
      [Op.gt]: messagesHiddenBefore,
    };
  }

  // Get messages
  const messages = await Message.findAll({
    where: messageWhere,
    include: [
      {
        model: User,
        as: "sender",
        attributes: ["id", "username", "avatar_url"],
      },
    ],
    order: [["created_at", "ASC"]],
  });

  return messages;
};

/**
 * Send a message in a conversation
 */
const sendMessageService = async (
  conversationId,
  senderId,
  messageText,
  imageUrl = null,
) => {
  // Verify user is part of conversation
  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  if (
    conversation.buyer_id !== senderId &&
    conversation.seller_id !== senderId
  ) {
    throw new Error("Unauthorized to send message in this conversation");
  }

  // Create message
  const message = await Message.create({
    conversation_id: conversationId,
    sender_id: senderId,
    message: messageText || (imageUrl ? "[Image]" : ""),
    image_url: imageUrl,
    is_read: false,
  });

  // Check if receiver deleted the conversation, if so restore it for them
  const isSenderBuyer = conversation.buyer_id === senderId;
  const restoreData = {};

  if (isSenderBuyer && conversation.deleted_by_seller_at) {
    // Buyer sending message to seller who deleted conversation
    restoreData.deleted_by_seller_at = null;
    restoreData.last_message = null;
    restoreData.last_message_time = null;
    restoreData.last_sender_id = null;
  } else if (!isSenderBuyer && conversation.deleted_by_buyer_at) {
    // Seller sending message to buyer who deleted conversation
    restoreData.deleted_by_buyer_at = null;
    restoreData.last_message = null;
    restoreData.last_message_time = null;
    restoreData.last_sender_id = null;
  }

  // Update conversation's last_message and last_message_time
  await conversation.update({
    ...restoreData,
    last_message: messageText,
    last_message_time: new Date(),
    last_sender_id: senderId,
  });

  // Fetch message with sender info
  const fullMessage = await Message.findByPk(message.id, {
    include: [
      {
        model: User,
        as: "sender",
        attributes: ["id", "username", "avatar_url"],
      },
    ],
  });

  // Emit Socket.IO event to conversation room
  try {
    const io = getIO();
    io.to(`conversation_${conversationId}`).emit("new_message", fullMessage);
  } catch (error) {
    console.error("Socket.IO emit error:", error);
    // Don't throw error, message is already saved
  }

  // Create notification for receiver only if they are NOT on the messages page
  try {
    const receiverId = isSenderBuyer
      ? conversation.seller_id
      : conversation.buyer_id;

    // Check if receiver is currently on the messages page
    const io = getIO();
    const messagesPageRoom = `messages_page_${receiverId}`;
    const socketsInRoom = await io.in(messagesPageRoom).fetchSockets();
    const isReceiverOnMessagesPage = socketsInRoom.length > 0;

    if (isReceiverOnMessagesPage) {
      console.log(
        `Receiver ${receiverId} is on messages page, skipping notification`,
      );
    } else {
      const sender = fullMessage.sender;

      // Get listing info for notification
      const listing = await UserBook.findByPk(conversation.listing_id, {
        attributes: ["title"],
        include: [
          {
            model: UserBookImage,
            as: "images",
            attributes: ["image_url"],
            limit: 1,
          },
        ],
      });

      const notificationContent = imageUrl
        ? `${sender.username} sent an image`
        : messageText.length > 50
          ? `${sender.username}: ${messageText.substring(0, 50)}...`
          : `${sender.username}: ${messageText}`;

      const notification = await createNotificationService({
        user_id: receiverId,
        type: "message",
        title: "New message",
        content: notificationContent,
        image_url: sender.avatar_url || listing?.images?.[0]?.image_url || null,
        reference_type: "conversation",
        reference_id: conversationId,
      });

      // Emit notification to receiver via Socket.IO
      io.to(`user_${receiverId}`).emit("new_notification", notification);
    }
  } catch (error) {
    console.error("Create notification error:", error);
    // Don't throw error, message is already sent
  }

  return fullMessage;
};

/**
 * Mark messages as read
 */
const markMessagesAsReadService = async (conversationId, userId) => {
  // Verify user is part of conversation
  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
    throw new Error("Unauthorized access to conversation");
  }

  // Mark all messages in this conversation as read (except sender's own messages)
  await Message.update(
    { is_read: true },
    {
      where: {
        conversation_id: conversationId,
        sender_id: { [Op.ne]: userId },
        is_read: false,
      },
    },
  );

  return { success: true };
};

/**
 * Mark all conversations as read for a user
 */
const markAllConversationsAsReadService = async (userId) => {
  // Get all conversation IDs for this user
  const conversations = await Conversation.findAll({
    where: {
      [Op.or]: [{ buyer_id: userId }, { seller_id: userId }],
    },
    attributes: ["id"],
  });

  const conversationIds = conversations.map((conv) => conv.id);

  if (conversationIds.length === 0) {
    return { success: true, count: 0 };
  }

  // Mark all unread messages in user's conversations as read
  const result = await Message.update(
    { is_read: true },
    {
      where: {
        conversation_id: { [Op.in]: conversationIds },
        sender_id: { [Op.ne]: userId },
        is_read: false,
      },
    },
  );

  return { success: true, count: result[0] };
};

/**
 * Delete conversations for a user
 * Soft delete: Set deleted_by_buyer_at or deleted_by_seller_at timestamp
 * Hard delete: If both users deleted, remove conversation and all messages
 */
const deleteConversationsService = async (conversationIds, userId) => {
  const results = {
    deleted: [],
    hardDeleted: [],
    errors: [],
  };

  for (const conversationId of conversationIds) {
    try {
      // Find conversation
      const conversation = await Conversation.findByPk(conversationId);

      if (!conversation) {
        results.errors.push({
          conversationId,
          message: "Conversation not found",
        });
        continue;
      }

      // Verify user is part of conversation
      const isBuyer = conversation.buyer_id === userId;
      const isSeller = conversation.seller_id === userId;

      if (!isBuyer && !isSeller) {
        results.errors.push({
          conversationId,
          message: "Unauthorized access",
        });
        continue;
      }

      // Set deleted timestamp AND message filter timestamp for this user
      const now = new Date();
      if (isBuyer) {
        await conversation.update({
          deleted_by_buyer_at: now,
          buyer_messages_hidden_before_at: now,
        });
      } else {
        await conversation.update({
          deleted_by_seller_at: now,
          seller_messages_hidden_before_at: now,
        });
      }

      // Refetch to check if both deleted
      await conversation.reload();

      // If both users deleted, hard delete everything
      if (
        conversation.deleted_by_buyer_at &&
        conversation.deleted_by_seller_at
      ) {
        // Delete all messages in this conversation
        await Message.destroy({
          where: { conversation_id: conversationId },
        });

        // Delete the conversation itself
        await conversation.destroy();

        results.hardDeleted.push(conversationId);
      } else {
        results.deleted.push(conversationId);
      }
    } catch (error) {
      console.error(`Error deleting conversation ${conversationId}:`, error);
      results.errors.push({
        conversationId,
        message: error.message,
      });
    }
  }

  return results;
};

module.exports = {
  getOrCreateConversationService,
  getConversationsService,
  getMessagesService,
  sendMessageService,
  markMessagesAsReadService,
  markAllConversationsAsReadService,
  deleteConversationsService,
};
