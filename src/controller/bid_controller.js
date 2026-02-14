const axios = require("axios");
const auctionService = require("../services/bid_service");

exports.createAcution = async (req, res) => {
  try {
    const { bookKey, startPrice, durationMinutes } = req.body;

    if (!bookKey || !startPrice || !durationMinutes) {
      return res.status(400).json({
        message: "bookKey, startPrice, durationMinutes are required",
      });
    }

    if (startPrice <= 0 || durationMinutes <= 0) {
      return res.status(400).json({
        message: "startPrice and durationMinutes must be greater than zero",
      });
    }

    const bookRes = await axios.get(
      `${process.env.OPEN_LIBRARY_API_URL}${bookKey}.json`,
    );
    const book = bookRes.data;

    if (!book || !book.title) {
      return res.status(404).json({ message: "Book not found" });
    }

    const snapshot = {
      title: book.title,
      description:
        typeof book.description === "string"
          ? book.description
          : book.description?.value || "",
      covers: book.covers || [],
      subjects: book.subjects || [],
    };

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    //////////////////////////////////////////////////////////////////////
    ////// sửa 2 dòng code này nếu muốn chạy test bằng postman 
    // const rawSellerId = req.userId || req.user?.id;//uncommnet
    //     const sellerId = rawSellerId || 1;//uncommnet
    const sellerId = req.userId || req.user?.id; //commnet lại 

    const auction = await auctionService.createAuctionService({
      sellerId,
      bookKey,
      snapshot,
      startPrice,
      startTime,
      endTime,
    });

    return res.status(201).json({
      message: "Auction created successfully",
      auction,
    });
  } catch (error) {
    console.error("Create auction error:", error);
    return res.status(500).json({
      message: error.message || "Internal error",
    });
  }
};

exports.getAuctionById = async (req, res) => {
  try {
    const auctionId = req.params.id;

    const result = await auctionService.getAuctionById(auctionId);

    if (!result || !result.auction) {
      return res.status(404).json({
        message: "Auction not found",
      });
    }

    const { auction, highestBid } = result;

    let bookSnapshot = null;

    if (auction.book_snapshot) {
      try {
        bookSnapshot = JSON.parse(auction.book_snapshot);
      } catch {
        bookSnapshot = null;
      }
    }

    const now = Date.now();
    const endTime = new Date(auction.end_time).getTime();
    const remainingTime = endTime - now > 0 ? endTime - now : 0;

    return res.status(200).json({
      auction: {
        id: auction.id,
        status: auction.status,
        startPrice: auction.start_price,
        currentPrice: auction.current_price,
        endTime: auction.end_time,
      },
      book: bookSnapshot,
      highestBid: highestBid || null,
      remainingTime,
    });
  } catch (error) {
    console.error("Get auction by id error:", error);
    return res.status(400).json({
      message: error.message,
    });
  }
};

exports.getAllActiveAcutions = async (req, res) => {
  try {
    const sort = req.query.sort || "endingSoon";

    const auctions = await auctionService.getAllActiveAcutions({
      sort,
    });

    if (!auctions || auctions.length === 0) {
      return res.status(200).json({
        message: "No active auctions",
        data: [],
      });
    }

    const formatted = auctions.map((auction) => {
      const endingTime = new Date(auction.end_time).getTime();
      const now = Date.now();

      let book = null;
      if (auction.book_snapshot) {
        try {
          book = JSON.parse(auction.book_snapshot);
        } catch {
          book = null;
        }
      }

      return {
        id: auction.id,
        currentPrice: auction.current_price,
        endTime: auction.end_time,
        remainingTime: endingTime - now > 0 ? endingTime - now : 0,
        book,
      };
    });

    return res.status(200).json({
      total: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("Get all active auctions error:", error);
    return res.status(400).json({
      message: error.message,
    });
  }
};

exports.placeBid = async (req, res) => {
  try {
    const auctionId = req.params.id;
    const { bidAmount } = req.body;
    const userId = req.userId || req.user?.id;

    if (!bidAmount || bidAmount <= 0) {
      return res.status(400).json({
        message: "Bid amount must be greater than zero",
      });
    }

    const result = await auctionService.placeBid({
      auctionId,
      userId,
      bidAmount,
    });

    return res.status(200).json({
      message: "Bid placed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Place bid error:", error);
    return res.status(400).json({
      message: error.message,
    });
  }
};

exports.closeAuction = async (req, res) => {
  try {
    const auctionId = req.params.id;
    const userId = req.userId || req.user?.id;

    const result = await auctionService.closeAuction({
      auctionId,
      userId,
    });

    return res.status(200).json({
      message: "Auction closed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Close auction error:", error);
    return res.status(400).json({
      message: error.message,
    });
  }
};

exports.depositForAuction = async (req, res) => {
  try {
    const auctionId = req.params.id;
    const userId = req.userId || req.user?.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Deposit amount must be greater than zero",
      });
    }

    const result = await auctionService.depositForAuction({
      auctionId,
      userId,
      amount,
    });

    return res.status(201).json({
      message: "Deposit created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Deposit for auction error:", error);
    return res.status(400).json({
      message: error.message,
    });
  }
};

exports.handleDepositWebhook = async (req, res) => {
  try {
    const payload = req.body;

    const result = await auctionService.handleDepositWebhook(payload);

    return res.status(200).json({
      message: "Deposit webhook processed",
      data: result,
    });
  } catch (error) {
    console.error("Handle deposit webhook error:", error);
    return res.status(400).json({
      message: error.message,
    });
  }
};

exports.getMyBids = async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { status } = req.query;

    const bids = await auctionService.getMyBids({
      userId,
      status,
    });

    return res.status(200).json({
      total: bids.length,
      data: bids,
    });
  } catch (error) {
    console.error("Get my bids error:", error);
    return res.status(400).json({
      message: error.message,
    });
  }
};

exports.handlePaymentWebhook = async (req, res) => {
  try {
    const payload = req.body;

    const result = await auctionService.handlePaymentWebhook(payload);

    return res.status(200).json({
      message: "Payment webhook processed",
      data: result,
    });
  } catch (error) {
    console.error("Handle payment webhook error:", error);
    return res.status(400).json({
      message: error.message,
    });
  }
};

exports.refundLosers = async (req, res) => {
  try {
    const auctionId = req.params.id;

    const result = await auctionService.refundLosers({ auctionId });

    return res.status(200).json({
      message: "Refund losers successfully",
      data: result,
    });
  } catch (error) {
    console.error("Refund losers error:", error);
    return res.status(400).json({
      message: error.message,
    });
  }
};
