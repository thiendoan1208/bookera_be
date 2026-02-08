const { UserBook, Order } = require("../models");

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

  // Get the listing
  const listing = await UserBook.findByPk(listingId);

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
