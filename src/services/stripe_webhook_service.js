const { UserBook, Order, User, UserBookImage } = require("../models");
const { createNotificationService } = require("./notification_service");
const { getIO } = require("../config/socket");

/**
 * Handle Stripe checkout.session.completed event
 */
const handleCheckoutSessionCompleted = async (session) => {
  const {
    id: sessionId,
    payment_intent,
    amount_total,
    currency,
    metadata,
  } = session;

  const listingId = metadata.listing_id;
  const sellerId = metadata.seller_id;
  const buyerId = metadata.buyer_id;

  // Get the listing with images
  const listing = await UserBook.findByPk(listingId, {
    include: [
      {
        model: UserBookImage,
        as: "images",
        attributes: ["image_url"],
        limit: 1,
      },
    ],
  });

  if (!listing) {
    throw new Error(`Listing ${listingId} not found`);
  }

  if (listing.sold) {
    console.log(`Listing ${listingId} already sold, skipping...`);
    return;
  }

  // Create order record
  // Note: amount_total from Stripe is in cents, convert to dollars
  const order = await Order.create({
    listing_id: listingId,
    buyer_id: buyerId,
    seller_id: sellerId,
    stripe_session_id: sessionId,
    stripe_payment_intent_id: payment_intent,
    amount: amount_total / 100, // Convert from cents to dollars
    currency: currency,
    payment_status: "paid",
  });

  // Mark listing as sold
  await listing.update({
    sold: true,
    buyer_id: buyerId,
  });

  console.log(`Order created: ${order.id} for listing ${listingId}`);

  // Create notifications for buyer and seller
  try {
    // Get buyer and seller info
    const buyer = await User.findByPk(buyerId, {
      attributes: ["id", "username", "avatar_url"],
    });
    const seller = await User.findByPk(sellerId, {
      attributes: ["id", "username", "avatar_url"],
    });

    // Notification for buyer
    const buyerNotification = await createNotificationService({
      user_id: buyerId,
      type: "order",
      title: "Order successful",
      content: `You have successfully purchased "${listing.title}" for ${(amount_total / 100).toFixed(2)} ${currency.toUpperCase()}`,
      image_url: listing.images?.[0]?.image_url || null,
      reference_type: "order",
      reference_id: order.id,
    });

    // Notification for seller
    const sellerNotification = await createNotificationService({
      user_id: sellerId,
      type: "order",
      title: "New order",
      content: `${buyer.username} purchased your "${listing.title}" for ${(amount_total / 100).toFixed(2)} ${currency.toUpperCase()}`,
      image_url: buyer.avatar_url || listing.images?.[0]?.image_url || null,
      reference_type: "listing",
      reference_id: listingId,
    });

    // Emit notifications via Socket.IO
    const io = getIO();
    io.to(`user_${buyerId}`).emit("new_notification", buyerNotification);
    io.to(`user_${sellerId}`).emit("new_notification", sellerNotification);
  } catch (error) {
    console.error("Create order notifications error:", error);
    // Don't throw error, order is already created
  }

  return order;
};

/**
 * Process Stripe webhook event
 */
const processStripeWebhook = async (event) => {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;

    case "checkout.session.async_payment_succeeded":
      // Handle async payment success (e.g., bank transfers)
      await handleCheckoutSessionCompleted(event.data.object);
      break;

    case "checkout.session.async_payment_failed":
      console.log("Async payment failed:", event.data.object.id);
      // Optionally handle failed payments
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

module.exports = {
  processStripeWebhook,
  handleCheckoutSessionCompleted,
};
