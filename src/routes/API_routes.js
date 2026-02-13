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
} = require("../controller/auth_controller");
const { verifyAuth, optionalAuth } = require("../middleware/auth_middleware");
const { upload } = require("../middleware/multer");
const bidController = require("../controller/bid_controller");

const apiRoutes = express.Router();

/** ===========================
 *  Auth Routes (Public)
 *  ===========================
 */
apiRoutes.post("/auth/sign_up", signUpController);
apiRoutes.post("/auth/sign_in", signInController);
apiRoutes.post("/auth/logout", logoutController);

/** ===========================
 *  Password Recovery (Public)
 *  ===========================
 */
apiRoutes.post("/auth/password-recovery", sendRecoverCodeController);
apiRoutes.post(
  "/auth/password-recovery/verification",
  verifyRecoverCodeController,
);
apiRoutes.patch("/auth/password-recovery", resetPasswordController);

/** ===========================
 *  Protected Auth Routes
 *  ===========================
 */
apiRoutes.get("/auth/me", verifyAuth, getCurrentUserController);
apiRoutes.put(
  "/auth/avatar",
  verifyAuth,
  upload.single("file"),
  uploadAvatarController,
);
apiRoutes.put("/auth/name", verifyAuth, updateNameController);
apiRoutes.put("/auth/password", verifyAuth, updatePasswordController);
apiRoutes.delete("/auth/account", verifyAuth, deleteAccountController);

/** ===========================
 *  Auction / Bid Routes
 *  ===========================
 */

// Tạo auction mới
apiRoutes.post("/auctions", verifyAuth, bidController.createAcution);

// Lấy chi tiết 1 auction theo id
apiRoutes.get("/auctions/:id", optionalAuth, bidController.getAuctionById);

// Lấy tất cả auction đang active
apiRoutes.get("/auctions", optionalAuth, bidController.getAllActiveAcutions);

// Đặt bid cho auction
apiRoutes.post("/auctions/:id/bids", verifyAuth, bidController.placeBid);

// Đóng auction
apiRoutes.post("/auctions/:id/close", verifyAuth, bidController.closeAuction);

// Đặt cọc tham gia auction
apiRoutes.post(
  "/auctions/:id/deposit",
  verifyAuth,
  bidController.depositForAuction,
);

// Webhook xử lý đặt cọc
apiRoutes.post("/payments/deposit/webhook", bidController.handleDepositWebhook);

// Lấy danh sách bid của user
apiRoutes.get("/me/bids", verifyAuth, bidController.getMyBids);

// Webhook thanh toán cho người thắng
apiRoutes.post("/payments/auction/webhook", bidController.handlePaymentWebhook);

// Hoàn tiền đặt cọc cho người thua
apiRoutes.post(
  "/auctions/:id/refund-losers",
  verifyAuth,
  bidController.refundLosers,
);

module.exports = {
  apiRoutes,
};
