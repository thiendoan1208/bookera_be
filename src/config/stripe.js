const Stripe = require("stripe");
const dotenv = require("dotenv");
dotenv.config();

// Initialize Stripe with secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = {
  stripe,
};
