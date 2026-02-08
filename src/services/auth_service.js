const { hashPassword, comparePassword } = require("../config/bcrypt");
const { jwtSign, jwtDecode } = require("../config/jwt");
const { User, UserAccess, UserRecover } = require("../models");
const { client } = require("../config/oauth");
const { cloudinary } = require("../config/cloudinary");
const { resend } = require("../config/resend");
const { generateRecoverCode } = require("../util/generateCode");

const signUpService = async (userData) => {
  const { username, email, password } = userData;

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create new user
  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    avatar_url: "default_avatar",
    role_id: 1,
  });

  return {
    id: newUser.id,
  };
};

const signInService = async (loginData) => {
  const { email, password } = loginData;

  // Find user by email
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error("User not found");
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  // Create JWT token
  const token = jwtSign({ userId: user.id });

  // Delete old tokens for this user (optional: keep only latest session)
  await UserAccess.destroy({ where: { user_id: user.id } });

  // Save token to database
  await UserAccess.create({
    user_id: user.id,
    session_token: token,
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url,
    role_id: user.role_id,
    token,
  };
};

const signUpWithGoogleService = async (credential) => {
  // Verify Google token
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name, picture } = payload;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    throw new Error("User already exists. Please sign in instead.");
  }

  // Create new user with Google data
  const newUser = await User.create({
    username: name,
    email,
    password: "",
    avatar_url: picture || "default_avatar",
    role_id: 2, // Google user
  });

  return {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    avatar_url: newUser.avatar_url,
  };
};

const signInWithGoogleService = async (credential) => {
  // Verify Google token
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name, picture } = payload;

  // Find user by email
  let user = await User.findOne({ where: { email } });

  // If user doesn't exist, create new user
  if (!user) {
    user = await User.create({
      username: name,
      email,
      password: "",
      avatar_url: picture || "default_avatar",
      role_id: 2, // Google user
    });
  }

  // Create JWT token
  const token = jwtSign({ userId: user.id });

  // Delete old tokens for this user
  await UserAccess.destroy({ where: { user_id: user.id } });

  // Save token to database
  await UserAccess.create({
    user_id: user.id,
    session_token: token,
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url,
    role_id: user.role_id,
    token,
  };
};

const logoutService = async (token) => {
  try {
    // Decode token to get user ID
    const decoded = jwtDecode(token);

    // Delete token from database
    await UserAccess.destroy({
      where: {
        user_id: decoded.userId,
        session_token: token,
      },
    });

    return true;
  } catch (error) {
    console.error("Logout service error:", error);
    throw error;
  }
};

const uploadAvatarService = async (userId, imageBuffer) => {
  // Upload image to Cloudinary from buffer
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "avatars",
          public_id: `user_${userId}`,
          overwrite: true,
          transformation: [{ width: 200, height: 200, crop: "fill" }],
        },
        async (error, result) => {
          if (error) {
            reject(error);
          } else {
            // Update user's avatar_url in database
            await User.update(
              { avatar_url: result.secure_url },
              { where: { id: userId } },
            );
            resolve(result.secure_url);
          }
        },
      )
      .end(imageBuffer);
  });
};

const updateNameService = async (userId, newUsername) => {
  // Find user
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Check if name_change_date exists and calculate days since last change
  if (user.name_change_date) {
    const currentDate = new Date();
    const lastChangeDate = new Date(user.name_change_date);
    const daysSinceLastChange =
      (currentDate - lastChangeDate) / (1000 * 60 * 60 * 24);

    if (daysSinceLastChange < 14) {
      const daysRemaining = Math.ceil(14 - daysSinceLastChange);
      throw new Error(
        `You can only change your name once every 14 days. Please wait ${daysRemaining} more day(s).`,
      );
    }
  }

  // Update username and name_change_date
  await User.update(
    {
      username: newUsername,
      name_change_date: new Date(),
    },
    { where: { id: userId } },
  );

  return {
    username: newUsername,
    name_change_date: new Date(),
  };
};

const updatePasswordService = async (userId, oldPassword, newPassword) => {
  // Find user
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user has password (not Google sign in user)
  if (!user.password || user.password === "") {
    throw new Error("Cannot update password for Google sign in users");
  }

  // Compare old password
  const isPasswordValid = await comparePassword(oldPassword, user.password);

  if (!isPasswordValid) {
    throw new Error("Old password is incorrect");
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await User.update({ password: hashedPassword }, { where: { id: userId } });

  return true;
};

const deleteAccountService = async (userId) => {
  // Find user
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Delete all user access tokens (sessions)
  await UserAccess.destroy({ where: { user_id: userId } });

  // Delete user
  await User.destroy({ where: { id: userId } });

  return true;
};

const sendRecoverCodeService = async (email) => {
  // Find user by email
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error("Email not found");
  }

  // Check if user is Google user (cannot reset password)
  if (user.role_id === 2) {
    throw new Error("Cannot reset password.");
  }

  // Check if there's a recent recover code (within 90 seconds)
  const existingRecover = await UserRecover.findOne({
    where: { user_id: user.id },
    order: [["created_at", "DESC"]],
  });

  if (existingRecover) {
    const timeDiff =
      Date.now() - new Date(existingRecover.created_at).getTime();
    const secondsElapsed = Math.floor(timeDiff / 1000);

    if (secondsElapsed < 90) {
      const remainingSeconds = 90 - secondsElapsed;
      throw new Error(
        `Please wait ${remainingSeconds} seconds before requesting a new code`,
      );
    }
  }

  // Generate 6-digit code
  const recoverCode = generateRecoverCode();

  // Save or update recover code in database
  await UserRecover.destroy({ where: { user_id: user.id } });
  await UserRecover.create({
    user_id: user.id,
    recover_code: recoverCode,
  });

  // Send email with recover code
  try {
    await resend.emails.send({
      from: "noreply@letwatch.net",
      to: [email],
      subject: "Password Recovery Code - Bookera",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Recovery</h2>
          <p>Your password recovery code is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${recoverCode}
          </div>
          <p style="color: #666;">This code will expire in 10 minutes.</p>
          <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error("Failed to send recovery email");
  }

  return true;
};

const verifyRecoverCodeService = async (email, code) => {
  // Find user by email
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error("Email not found");
  }

  // Find recover code
  const userRecover = await UserRecover.findOne({
    where: { user_id: user.id },
    order: [["created_at", "DESC"]],
  });

  if (!userRecover) {
    throw new Error("No recovery code found. Please request a new one.");
  }

  // Check if code is expired (10 minutes)
  const timeDiff = Date.now() - new Date(userRecover.created_at).getTime();
  const minutesElapsed = Math.floor(timeDiff / 60000);

  if (minutesElapsed > 10) {
    throw new Error("Recovery code has expired. Please request a new one.");
  }

  // Verify code
  if (userRecover.recover_code !== code) {
    throw new Error("Invalid recovery code");
  }

  return true;
};

const resetPasswordService = async (email, code, newPassword) => {
  // Verify code first
  await verifyRecoverCodeService(email, code);

  // Find user
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error("User not found");
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await User.update({ password: hashedPassword }, { where: { id: user.id } });

  // Delete recover code after successful reset
  await UserRecover.destroy({ where: { user_id: user.id } });

  return true;
};

const updateBillingInfoService = async (
  userId,
  phoneNumber,
  phoneVerified,
  billingAddress,
) => {
  // Find user
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Prepare update data
  const updateData = {};

  if (phoneNumber !== undefined) {
    updateData.phone_number = phoneNumber;
  }

  if (phoneVerified !== undefined) {
    updateData.phone_verified = phoneVerified;
  }

  if (billingAddress !== undefined) {
    updateData.billing_address = billingAddress;
  }

  // Update user
  await User.update(updateData, { where: { id: userId } });

  // Get updated user
  const updatedUser = await User.findByPk(userId);

  return {
    phone_number: updatedUser.phone_number,
    phone_verified: updatedUser.phone_verified,
    billing_address: updatedUser.billing_address,
  };
};

module.exports = {
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
};
