const express = require("express");
const {
  createSavedItemController,
  getSavedItemsController,
  checkSavedItemController,
  deleteSavedItemByIdController,
  deleteSavedItemByReferenceController,
} = require("../controller/saved_item_controller");
const { verifyAuth } = require("../middleware/auth_middleware");

const savedItemRoutes = express.Router();

// All saved item routes require authentication
savedItemRoutes.use(verifyAuth);

// Get saved items with pagination/filter
savedItemRoutes.get("/", getSavedItemsController);

// Check if an item is saved
savedItemRoutes.get("/check", checkSavedItemController);

// Save a new item
savedItemRoutes.post("/", createSavedItemController);

// Unsave item by item reference
savedItemRoutes.delete("/by-reference", deleteSavedItemByReferenceController);

// Unsave item by saved item id
savedItemRoutes.delete("/:id", deleteSavedItemByIdController);

module.exports = {
  savedItemRoutes,
};
