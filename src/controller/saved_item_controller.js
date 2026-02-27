const {
  createSavedItemService,
  getSavedItemsService,
  isSavedItemService,
  deleteSavedItemByIdService,
  deleteSavedItemByReferenceService,
} = require("../services/saved_item_service");

const createSavedItemController = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await createSavedItemService(userId, req.body);

    if (!result.created) {
      return res.status(200).json({
        message: "Item already exists in saved list",
        data: result.item,
      });
    }

    res.status(201).json({
      message: "Item saved successfully",
      data: result.item,
    });
  } catch (error) {
    console.error("Create saved item error:", error);

    if (
      error.message.includes("required") ||
      error.message.includes("must be either")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.message === "Market item not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to save item",
      error: error.message,
    });
  }
};

const getSavedItemsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, item_type: itemType } = req.query;

    const result = await getSavedItemsService(userId, page, limit, itemType);

    res.status(200).json({
      message: "Saved items retrieved successfully",
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Get saved items error:", error);

    if (error.message.includes("must be either")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to get saved items",
      error: error.message,
    });
  }
};

const checkSavedItemController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { item_type: itemType, work_id: workId, market_item_id: marketItemId } =
      req.query;

    const result = await isSavedItemService(userId, itemType, workId, marketItemId);

    res.status(200).json({
      message: "Saved item status retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Check saved item error:", error);

    if (
      error.message.includes("required") ||
      error.message.includes("must be either")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to check saved item status",
      error: error.message,
    });
  }
};

const deleteSavedItemByIdController = async (req, res) => {
  try {
    const userId = req.user.id;
    const savedItemId = req.params.id;

    const result = await deleteSavedItemByIdService(savedItemId, userId);

    res.status(200).json({
      message: "Saved item deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Delete saved item by ID error:", error);

    if (error.message === "Saved item not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to delete saved item",
      error: error.message,
    });
  }
};

const deleteSavedItemByReferenceController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { item_type: itemType, work_id: workId, market_item_id: marketItemId } =
      req.body;

    const result = await deleteSavedItemByReferenceService(
      userId,
      itemType,
      workId,
      marketItemId,
    );

    res.status(200).json({
      message: "Saved item deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Delete saved item by reference error:", error);

    if (
      error.message.includes("required") ||
      error.message.includes("must be either")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.message === "Saved item not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to delete saved item",
      error: error.message,
    });
  }
};

module.exports = {
  createSavedItemController,
  getSavedItemsController,
  checkSavedItemController,
  deleteSavedItemByIdController,
  deleteSavedItemByReferenceController,
};
