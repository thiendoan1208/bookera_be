const { stripe } = require("../config/stripe");
const { processStripeWebhook } = require("../services/stripe_webhook_service");

const stripeWebhookController = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Process the event
    await processStripeWebhook(event);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};

module.exports = {
  stripeWebhookController,
};
