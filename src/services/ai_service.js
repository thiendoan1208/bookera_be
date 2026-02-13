const { openai } = require("../config/openai");
const db = require("../models");
const { Op } = require("sequelize");

const AIConversation = db.AIConversation;
const AIMessage = db.AIMessage;

// System prompt cho AI chỉ tư vấn về sách
const SYSTEM_PROMPT = `You are Kera, a friendly and knowledgeable book assistant for Bookera platform. Your purpose is to help users find the perfect books based on their mood, feelings, or specific descriptions.

IMPORTANT RULES:
1. ONLY answer questions related to books, reading, literature, and book recommendations
2. If the user asks about anything unrelated to books, politely decline and redirect them to ask about books
3. When recommending books, provide:
   - Book title and author
   - Brief description (2-3 sentences)
   - Publication year
   - Genre/category
   - External links to Google Books, Amazon, or Goodreads,... or any other external sources — NEVER use bookera.com or any internal marketplace links
4. Format your responses using proper Markdown: use headers (##, ###), bold, italic, bullet lists, numbered lists, horizontal rules, blockquotes, and links
5. Base recommendations on the user's emotions or specific requests
6. Recommend 3-5 books per request unless user specifies otherwise
7. Always respond in the same language the user uses

RESPONSE FORMAT:
When recommending books, use this Markdown structure:

### 📚 [Book Title]
**Author:** [Author Name]
**Genre:** [Genre] | **Year:** [Year]

> [Brief compelling description of the book in 2-3 sentences]

🔗 [Google Books](https://www.google.com/search?q=[book+title]+[author]+book) | [Amazon](https://www.amazon.com/s?k=[book+title]+[author])

---

Be warm, enthusiastic, and helpful. Make users excited about reading! Use emojis sparingly to add personality.`;

/**
 * Get all AI conversations for a user
 */
const getAIConversationsService = async (userId) => {
  const conversations = await AIConversation.findAll({
    where: { user_id: userId },
    order: [["last_message_time", "DESC"]],
    attributes: [
      "id",
      "title",
      "last_message",
      "last_message_time",
      "created_at",
    ],
  });

  return conversations;
};

/**
 * Get messages for a specific conversation
 */
const getAIMessagesService = async (userId, conversationId) => {
  // Verify conversation belongs to user
  const conversation = await AIConversation.findOne({
    where: {
      id: conversationId,
      user_id: userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found or unauthorized");
  }

  const messages = await AIMessage.findAll({
    where: { ai_conversation_id: conversationId },
    order: [["created_at", "ASC"]],
    attributes: ["id", "role", "content", "created_at"],
  });

  return messages;
};

/**
 * Create a new AI conversation
 */
const createAIConversationService = async (userId) => {
  const conversation = await AIConversation.create({
    user_id: userId,
    title: "New conversation",
    daily_message_limit: 0,
  });

  return conversation;
};

/**
 * Check and reset daily message limit if needed
 */
const checkAndResetDailyLimit = async (conversation) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  const lastMessageDate = conversation.last_message_date || null;

  if (lastMessageDate !== today) {
    // New day, reset limit
    await conversation.update({
      daily_message_limit: 0,
      last_message_date: today,
    });
    return 0;
  }

  return conversation.daily_message_limit;
};

/**
 * Send message to AI and get response
 */
const sendAIMessageService = async (userId, conversationId, userMessage) => {
  // Get or create conversation
  let conversation;
  if (conversationId) {
    conversation = await AIConversation.findOne({
      where: {
        id: conversationId,
        user_id: userId,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found or unauthorized");
    }
  } else {
    // Create new conversation
    conversation = await createAIConversationService(userId);
  }

  // Check daily limit (simple check, can be expanded later)
  const currentLimit = await checkAndResetDailyLimit(conversation);

  // Save user message
  await AIMessage.create({
    ai_conversation_id: conversation.id,
    role: "user",
    content: userMessage,
  });

  // Get conversation history for context (last 20 messages)
  const previousMessages = await AIMessage.findAll({
    where: { ai_conversation_id: conversation.id },
    order: [["created_at", "DESC"]],
    limit: 20,
  });
  // Reverse to chronological order for OpenAI
  previousMessages.reverse();

  // Prepare messages for OpenAI
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...previousMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  // Call OpenAI API
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    max_tokens: 4096,
  });

  const aiResponse = completion.choices[0]?.message?.content;

  if (!aiResponse) {
    console.error(
      "Empty AI response. Finish reason:",
      completion.choices[0]?.finish_reason,
      "Full response:",
      JSON.stringify(completion.choices[0]?.message, null, 2),
    );
  }

  const finalResponse =
    aiResponse ||
    "Xin lỗi, mình đang gặp sự cố khi xử lý yêu cầu này. Bạn vui lòng thử lại nhé!";

  // Save AI response
  const aiMessage = await AIMessage.create({
    ai_conversation_id: conversation.id,
    role: "assistant",
    content: finalResponse,
  });

  // Update conversation
  const title =
    conversation.title === "New conversation" && previousMessages.length <= 2
      ? userMessage.substring(0, 100)
      : conversation.title;

  await conversation.update({
    title: title,
    last_message: finalResponse.substring(0, 500),
    last_message_time: new Date(),
    daily_message_limit: currentLimit + 1,
    last_message_date: new Date(),
  });

  return {
    conversation: {
      id: conversation.id,
      title: title,
    },
    message: {
      id: aiMessage.id,
      role: aiMessage.role,
      content: aiMessage.content,
      created_at: aiMessage.created_at,
    },
  };
};

/**
 * Delete an AI conversation
 */
const deleteAIConversationService = async (userId, conversationId) => {
  const conversation = await AIConversation.findOne({
    where: {
      id: conversationId,
      user_id: userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found or unauthorized");
  }

  await conversation.destroy();
  return { message: "Conversation deleted successfully" };
};

module.exports = {
  getAIConversationsService,
  getAIMessagesService,
  createAIConversationService,
  sendAIMessageService,
  deleteAIConversationService,
};
