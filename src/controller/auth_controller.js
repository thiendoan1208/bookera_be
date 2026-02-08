const {
  signUpService,
  signInService,
  signUpWithGoogleService,
  signInWithGoogleService,
  logoutService,
  uploadAvatarService,
  updateNameService,
  updatePasswordService,
  deleteAccountService,
  sendRecoverCodeService,
  verifyRecoverCodeService,
  resetPasswordService,
  updateBillingInfoService,
} = require("../services/auth_service");

const dotenv = require("dotenv");
dotenv.config();

const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const signUpController = async (req, res) => {
  try {
    const data = req.body;

    // Check if it's Google sign up (has credential field)
    if (data.credential) {
      const user = await signUpWithGoogleService(data.credential);
      return res.status(201).json({
        message: "User created successfully with Google",
        user,
      });
    }

    // Normal sign up
    const user = await signUpService(data);
    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Sign up error:", error);
    res.status(500).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
};

const signInController = async (req, res) => {
  try {
    const data = req.body;

    // Check if it's Google sign in (has credential field)
    if (data.credential) {
      const user = await signInWithGoogleService(data.credential);

      // Set cookie with token (30 days)
      res.cookie("session_token", user.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: MAX_AGE,
        sameSite: "lax",
      });

      return res.status(200).json({
        message: "Sign in successfully with Google",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          role_id: user.role_id,
          phone_number: user.phone_number,
          phone_verified: user.phone_verified,
          billing_address: user.billing_address,
        },
      });
    }

    // Normal sign in
    const user = await signInService(data);

    // Set cookie with token (30 days)
    res.cookie("session_token", user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: MAX_AGE,
      sameSite: "lax",
    });

    res.status(200).json({
      message: "Sign in successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        role_id: user.role_id,
        phone_number: user.phone_number,
        phone_verified: user.phone_verified,
        billing_address: user.billing_address,
      },
    });
  } catch (error) {
    console.error("Sign in error:", error);
    res.status(401).json({
      message: "Failed to sign in",
      error: error.message,
    });
  }
};

const logoutController = async (req, res) => {
  try {
    const token = req.cookies.session_token;

    if (token) {
      // Delete token from database
      await logoutService(token);
    }

    // Clear cookie
    res.clearCookie("session_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Failed to logout",
      error: error.message,
    });
  }
};

const getCurrentUserController = async (req, res) => {
  try {
    res.status(200).json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        avatar_url: req.user.avatar_url,
        role_id: req.user.role_id,
        phone_number: req.user.phone_number,
        phone_verified: req.user.phone_verified,
        billing_address: req.user.billing_address,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      message: "Failed to get user information",
      error: error.message,
    });
  }
};

const uploadAvatarController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const userId = req.user.id;
    const fileBuffer = req.file.buffer;
    const avatarUrl = await uploadAvatarService(userId, fileBuffer);
    res.status(200).json({
      message: "Avatar uploaded successfully",
      avatar_url: avatarUrl,
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({
      message: "Failed to upload avatar",
      error: error.message,
    });
  }
};

const updateNameController = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Username is required" });
    }

    const userId = req.user.id;
    const result = await updateNameService(userId, username.trim());

    res.status(200).json({
      message: "Name updated successfully",
      username: result.username,
      name_change_date: result.name_change_date,
    });
  } catch (error) {
    console.error("Update name error:", error);

    // If error is about 14 days restriction, return 400
    if (error.message.includes("14 days")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to update name",
      error: error.message,
    });
  }
};

const updatePasswordController = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old password and new password are required",
      });
    }

    if (newPassword.trim() === "") {
      return res.status(400).json({
        message: "New password cannot be empty",
      });
    }

    const userId = req.user.id;
    await updatePasswordService(userId, oldPassword, newPassword);

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);

    // If error is about incorrect old password or Google user
    if (
      error.message.includes("incorrect") ||
      error.message.includes("Google")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to update password",
      error: error.message,
    });
  }
};

const deleteAccountController = async (req, res) => {
  try {
    const userId = req.user.id;
    await deleteAccountService(userId);

    // Clear cookie
    res.clearCookie("session_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      message: "Failed to delete account",
      error: error.message,
    });
  }
};

const sendRecoverCodeController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "Email is required" });
    }

    await sendRecoverCodeService(email.trim());

    res.status(200).json({
      message: "Recovery code sent to your email",
    });
  } catch (error) {
    console.error("Send recover code error:", error);

    // Handle specific errors
    if (
      error.message.includes("not found") ||
      error.message.includes("wait") ||
      error.message.includes("Google")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to send recovery code",
      error: error.message,
    });
  }
};

const verifyRecoverCodeController = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and code are required",
      });
    }

    await verifyRecoverCodeService(email.trim(), code.trim());

    res.status(200).json({
      message: "Code verified successfully",
    });
  } catch (error) {
    console.error("Verify recover code error:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("expired") ||
      error.message.includes("Invalid")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to verify code",
      error: error.message,
    });
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        message: "Email, code, and new password are required",
      });
    }

    if (newPassword.trim().length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    await resetPasswordService(email.trim(), code.trim(), newPassword);

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("expired") ||
      error.message.includes("Invalid")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to reset password",
      error: error.message,
    });
  }
};

const updateBillingInfoController = async (req, res) => {
  try {
    const { phone_number, phone_verified, billing_address } = req.body;
    const userId = req.user.id;

    const result = await updateBillingInfoService(
      userId,
      phone_number,
      phone_verified,
      billing_address,
    );

    res.status(200).json({
      message: "Billing information updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update billing info error:", error);
    res.status(500).json({
      message: "Failed to update billing information",
      error: error.message,
    });
  }
};

module.exports = {
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
};
