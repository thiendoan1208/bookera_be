const {
  createListingService,
  getListingsService,
  getListingByIdService,
  createCheckoutSessionService,
  verifyCheckoutSessionService,
  getMyListingsService,
  getMyOrdersService,
  deleteListingService,
} = require("../services/marketplace_service");

const createListingController = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    const { title, author, price, condition, category, description } = req.body;

    const requiredFields = [
      { key: "title", value: title },
      { key: "author", value: author },
      { key: "price", value: price },
      { key: "condition", value: condition },
      { key: "category", value: category },
      { key: "description", value: description },
    ];

    for (const field of requiredFields) {
      const val =
        typeof field.value === "string" ? field.value.trim() : field.value;
      if (!val) {
        return res.status(400).json({
          message: `${field.key.charAt(0).toUpperCase() + field.key.slice(1)} is required`,
        });
      }
    }

    const userId = req.user.id;
    const imageBuffers = req.files.map((file) => file.buffer);

    const listing = await createListingService(
      userId,
      { title: title.trim(), author, price, condition, category, description },
      imageBuffers,
    );

    res.status(201).json({
      message: "Listing created successfully",
      data: listing,
    });
  } catch (error) {
    console.error("Create listing error:", error);
    res.status(500).json({
      message: "Failed to create listing",
      error: error.message,
    });
  }
};

const getListingsController = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await getListingsService(limit, offset);

    res.status(200).json({
      message: "Listings fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get listings error:", error);
    res.status(500).json({
      message: "Failed to fetch listings",
      error: error.message,
    });
  }
};

const getListingByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await getListingByIdService(id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.status(200).json({
      message: "Listing fetched successfully",
      data: listing,
    });
  } catch (error) {
    console.error("Get listing by ID error:", error);
    res.status(500).json({
      message: "Failed to fetch listing",
      error: error.message,
    });
  }
};

const createCheckoutSessionController = async (req, res) => {
  try {
    const { listing_id, success_url, cancel_url } = req.body;
    const buyerId = req.user.id;

    if (!listing_id) {
      return res.status(400).json({ message: "Listing ID is required" });
    }
    if (!success_url || !cancel_url) {
      return res
        .status(400)
        .json({ message: "Success and cancel URLs are required" });
    }

    const session = await createCheckoutSessionService(
      listing_id,
      buyerId,
      success_url,
      cancel_url,
    );

    res.status(200).json({
      message: "Checkout session created successfully",
      data: session,
    });
  } catch (error) {
    console.error("Create checkout session error:", error);
    res.status(500).json({
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
};

const verifyCheckoutSessionController = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        valid: false,
        message: "Session ID is required",
      });
    }

    const result = await verifyCheckoutSessionService(session_id);

    res.status(200).json(result);
  } catch (error) {
    console.error("Verify checkout session error:", error);
    res.status(500).json({
      valid: false,
      message: "Failed to verify session",
    });
  }
};

const getMyListingsController = async (req, res) => {
  try {
    const userId = req.user.id;

    const listings = await getMyListingsService(userId);

    res.status(200).json({
      message: "My listings fetched successfully",
      data: listings,
    });
  } catch (error) {
    console.error("Get my listings error:", error);
    res.status(500).json({
      message: "Failed to fetch my listings",
      error: error.message,
    });
  }
};

const getMyOrdersController = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await getMyOrdersService(userId);

    res.status(200).json({
      message: "Order history fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({
      message: "Failed to fetch order history",
      error: error.message,
    });
  }
};

const deleteListingController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await deleteListingService(id, userId);

    res.status(200).json(result);
  } catch (error) {
    console.error("Delete listing error:", error);
    res.status(500).json({
      message: "Failed to delete listing",
      error: error.message,
    });
  }
};

module.exports = {
  createListingController,
  getListingsController,
  getListingByIdController,
  createCheckoutSessionController,
  verifyCheckoutSessionController,
  getMyListingsController,
  getMyOrdersController,
  deleteListingController,
};
