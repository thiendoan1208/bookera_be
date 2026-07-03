# Bookera Backend API

A high-performance RESTful API and WebSocket server powering **Bookera**, a modern e-commerce marketplace for buying and selling books, integrated with a conversational AI reading assistant.

## 🚀 Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js (v5.0)
- **Database:** MySQL
- **ORM:** Sequelize
- **Real-Time:** WebSockets (Socket.io)
- **Containerization:** Docker & Docker Compose
- **AI Integration:** OpenAI API (GPT-4o)
- **Payments:** Stripe API (Checkout & Webhooks)
- **File Storage:** Multer & Cloudinary
- **Emails:** Resend API
- **Authentication:** Google OAuth 2.0 & JSON Web Tokens (JWT)

---

## 🔑 Key Features

### 1. Secure Authentication & Authorization
- Robust email/password authentication using **bcrypt** hashing.
- Token-based session management using **JWT** (Access and Refresh tokens stored in secure, HTTP-only cookies).
- Single Sign-On (SSO) utilizing **Google OAuth 2.0**.

### 2. E-Commerce & Marketplace Engine
- Complete CRUD operations for book listings (title, author, genre, price, condition, images).
- Advanced search and marketplace filtering capabilities.
- **Stripe API** integration processing secure credit card payments.
- Robust **Stripe Webhooks** listener to process checkout events asynchronously and update order fulfillment statuses.

### 3. Real-Time Chat System
- P2P buyer-seller messaging utilizing **Socket.io**.
- Instant message delivery and persistent chat history stored in MySQL.
- Real-time client-side notification badges for unread messages.

### 4. AI Assistant ("Kera")
- Chat interface with "Kera"—an intelligent assistant powered by **OpenAI (GPT-4o)**.
- Specialized System Prompts guiding Kera to recommend books, summarize themes, and provide external links.
- Chat history retention (up to 20 messages) for natural, context-aware conversations.
- Daily chat limits tracked per user session to manage API token consumption.
