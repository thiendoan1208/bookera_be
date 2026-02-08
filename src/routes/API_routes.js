const express = require("express");
const {
  signUpController,
  signInController,
  logoutController,
  getCurrentUserController,
  uploadAvatarController,
  updateNameController,
  updatePasswordController,
  deleteAccountController,
  sendRecoverCodeController,
  verifyRecoverCodeController,
  resetPasswordController,
  updateBillingInfoController,
} = require("../controller/auth_controller");
const {
  createListingController,
  getListingsController,
  getListingByIdController,
  createCheckoutSessionController,
  verifyCheckoutSessionController,
  getMyListingsController,
  getMyOrdersController,
  deleteListingController,
} = require("../controller/marketplace_controller");
const { verifyAuth } = require("../middleware/auth_middleware");
const { upload } = require("../middleware/multer");

const apiRoutes = express.Router();

// Auth Routes (Public)
apiRoutes.post("/auth/sign_up", signUpController);
apiRoutes.post("/auth/sign_in", signInController);
apiRoutes.post("/auth/logout", logoutController);

// Password Recovery Routes (Public)
apiRoutes.post("/auth/password-recovery", sendRecoverCodeController);
apiRoutes.post(
  "/auth/password-recovery/verification",
  verifyRecoverCodeController,
);
apiRoutes.patch("/auth/password-recovery", resetPasswordController);

// Protected Auth Routes
apiRoutes.get("/auth/me", verifyAuth, getCurrentUserController);
apiRoutes.put(
  "/auth/avatar",
  verifyAuth,
  upload.single("file"),
  uploadAvatarController,
);
apiRoutes.put("/auth/name", verifyAuth, updateNameController);
apiRoutes.put("/auth/password", verifyAuth, updatePasswordController);
apiRoutes.put("/auth/billing", verifyAuth, updateBillingInfoController);
apiRoutes.delete("/auth/account", verifyAuth, deleteAccountController);

// Marketplace Routes
apiRoutes.get("/marketplace/listings", getListingsController);
apiRoutes.get("/marketplace/listings/:id", getListingByIdController);
apiRoutes.post(
  "/marketplace/listings",
  verifyAuth,
  upload.array("images", 10),
  createListingController,
);
apiRoutes.post(
  "/marketplace/checkout",
  verifyAuth,
  createCheckoutSessionController,
);
apiRoutes.get("/marketplace/verify-session", verifyCheckoutSessionController);
apiRoutes.get("/marketplace/my-listings", verifyAuth, getMyListingsController);
apiRoutes.get("/marketplace/my-orders", verifyAuth, getMyOrdersController);
apiRoutes.delete(
  "/marketplace/listings/:id",
  verifyAuth,
  deleteListingController,
);

module.exports = {
  apiRoutes,
};
