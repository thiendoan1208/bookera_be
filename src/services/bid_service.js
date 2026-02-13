const { Op } = require("sequelize");
const axios = require("axios");
const { sequelize, Auction, Bid, AuctionDeposit, User } = require("../models");
const { getIO } = require("../socket/auction.socket");

const getPayPalBaseUrl = () => {
  const mode = process.env.PAYPAL_MODE || "sandbox";
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
};

const getPayPalAccessToken = async () => {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !secret) {
      throw new Error("Missing PayPal credentials");
    }

    const response = await axios.post(
      `${getPayPalBaseUrl()}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: { username: clientId, password: secret },
      },
    );

    return response.data.access_token;
  } catch (error) {
    throw error;
  }
};

const createPayPalOrder = async ({ amount, currency = "USD", description }) => {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await axios.post(
      `${getPayPalBaseUrl()}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
            description,
          },
        ],
        application_context: {
          brand_name: "Bookera Auction",
          user_action: "PAY_NOW",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    throw error;
  }
};

const createAuctionService = async ({
  sellerId,
  bookKey,
  snapshot,
  startPrice,
  startTime,
  endTime,
}) => {
  try {
    if (new Date(endTime) <= new Date(startTime)) {
      throw new Error("End time must be after start time");
    }

    const auction = await Auction.create({
      seller_id: sellerId,
      book_key: bookKey,
      book_snapshot: JSON.stringify(snapshot),
      start_price: startPrice,
      current_price: startPrice,
      status: "ACTIVE",
      start_time: startTime,
      end_time: endTime,
    });

    return auction;
  } catch (error) {
    throw error;
  }
};

const getAuctionById = async (auctionId) => {
  try {
    const auction = await Auction.findByPk(auctionId);
    if (!auction) return null;

    const highestBid = await Bid.findOne({
      where: { auction_id: auctionId },
      order: [["amount", "DESC"]],
    });

    return { auction, highestBid };
  } catch (error) {
    throw error;
  }
};

const getAllActiveAcutions = async ({ sort = "endingSoon" }) => {
  try {
    let order = [["end_time", "ASC"]];
    if (sort === "highestPrice") order = [["current_price", "DESC"]];
    if (sort === "latest") order = [["createdAt", "DESC"]];

    const auctions = await Auction.findAll({
      where: {
        status: "ACTIVE",
        end_time: { [Op.gt]: new Date() },
      },
      order,
    });

    return auctions;
  } catch (error) {
    throw error;
  }
};

const placeBid = async ({ auctionId, userId, bidAmount }) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const auction = await Auction.findByPk(auctionId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!auction) throw new Error("Auction not found");
      if (auction.status !== "ACTIVE") throw new Error("Auction is not active");
      if (new Date() > auction.end_time)
        throw new Error("Auction already ended");
      if (bidAmount <= auction.current_price)
        throw new Error("Bid must be higher than current price");

      const bid = await Bid.create(
        {
          auction_id: auctionId,
          user_id: userId,
          amount: bidAmount,
        },
        { transaction: t },
      );

      auction.current_price = bidAmount;
      await auction.save({ transaction: t });

      const io = getIO();
      if (io) {
        io.to(`auction_${auctionId}`).emit("new-bid", {
          auctionId,
          userId,
          amount: bidAmount,
        });
      }

      return { auction, bid };
    });

    return result;
  } catch (error) {
    throw error;
  }
};

const closeAuction = async ({ auctionId, userId }) => {
  try {
    const result = await sequelize.transaction(async (t) => {
      const auction = await Auction.findByPk(auctionId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!auction) throw new Error("Auction not found");
      if (auction.status !== "ACTIVE")
        throw new Error("Auction already closed");
      if (auction.seller_id !== userId) {
        throw new Error("Only seller can close this auction");
      }
      if (new Date() < auction.end_time) {
        throw new Error("Auction has not ended yet");
      }

      const highestBid = await Bid.findOne({
        where: { auction_id: auctionId },
        order: [["amount", "DESC"]],
        include: [{ model: User, as: "user" }],
        transaction: t,
      });

      auction.status = "ENDED";
      await auction.save({ transaction: t });

      const io = getIO();
      if (io) {
        io.to(`auction_${auctionId}`).emit("auction-closed", {
          auctionId,
          winner: highestBid
            ? {
                userId: highestBid.user_id,
                amount: highestBid.amount,
              }
            : null,
        });
      }

      return { auction, winnerBid: highestBid || null };
    });

    return result;
  } catch (error) {
    throw error;
  }
};

const depositForAuction = async ({ auctionId, userId, amount }) => {
  try {
    const auction = await Auction.findByPk(auctionId);
    if (!auction) throw new Error("Auction not found");
    if (auction.status !== "ACTIVE") throw new Error("Auction not active");
    if (!amount || amount <= 0) throw new Error("Invalid deposit amount");

    const order = await createPayPalOrder({
      amount,
      currency: process.env.PAYPAL_CURRENCY || "USD",
      description: `Deposit for auction ${auctionId}`,
    });

    const approveUrl =
      order.links?.find((l) => l.rel === "approve")?.href || null;

    const deposit = await AuctionDeposit.create({
      auction_id: auctionId,
      user_id: userId,
      amount,
      status: "PENDING",
      payment_reference: order.id,
      provider: "PAYPAL",
    });

    return {
      deposit,
      payment: {
        provider: "PAYPAL",
        paypalOrderId: order.id,
        approveUrl,
      },
    };
  } catch (error) {
    throw error;
  }
};

const handleDepositWebhook = async (payload) => {
  try {
    const eventType = payload.event_type;
    const resource = payload.resource || {};

    let orderId =
      resource.id ||
      resource.supplementary_data?.related_ids?.order_id;

    if (!orderId) throw new Error("Missing order ID");

    const deposit = await AuctionDeposit.findOne({
      where: { payment_reference: orderId },
    });

    if (!deposit) throw new Error("Deposit not found");

    if (
      eventType === "CHECKOUT.ORDER.APPROVED" ||
      eventType === "PAYMENT.CAPTURE.COMPLETED"
    ) {
      deposit.status = "PAID";
    } else if (eventType === "PAYMENT.CAPTURE_DENIED") {
      deposit.status = "FAILED";
    }

    await deposit.save();
    return deposit;
  } catch (error) {
    throw error;
  }
};

const getMyBids = async ({ userId, status }) => {
  try {
    const includeAuction = { model: Auction, as: "auction" };

    if (status === "active") includeAuction.where = { status: "ACTIVE" };
    if (status === "ended") includeAuction.where = { status: "ENDED" };

    const bids = await Bid.findAll({
      where: { user_id: userId },
      include: [includeAuction],
      order: [["createdAt", "DESC"]],
    });

    return bids;
  } catch (error) {
    throw error;
  }
};

const refundLosers = async ({ auctionId }) => {
  try {
    const auction = await Auction.findByPk(auctionId);
    if (!auction) throw new Error("Auction not found");
    if (auction.status !== "ENDED")
      throw new Error("Auction must be ended");

    const highestBid = await Bid.findOne({
      where: { auction_id: auctionId },
      order: [["amount", "DESC"]],
    });

    const winnerId = highestBid?.user_id;

    const deposits = await AuctionDeposit.findAll({
      where: {
        auction_id: auctionId,
        status: "PAID",
        ...(winnerId && { user_id: { [Op.ne]: winnerId } }),
      },
    });

    for (const dep of deposits) {
      dep.status = "REFUNDED";
      await dep.save();
    }

    return {
      refundedCount: deposits.length,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createAuctionService,
  getAuctionById,
  getAllActiveAcutions,
  placeBid,
  closeAuction,
  depositForAuction,
  handleDepositWebhook,
  getMyBids,
  refundLosers,
};
