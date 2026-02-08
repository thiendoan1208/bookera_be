const express = require("express");
const {
  stripeWebhookController,
} = require("../controller/stripe_webhook_controller");

const webhookRoutes = express.Router();

// Stripe webhook requires raw body for signature verification
webhookRoutes.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookController,
);

module.exports = {
  webhookRoutes,
};
