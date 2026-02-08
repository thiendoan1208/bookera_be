const { UserBook, UserBookImage, User } = require("../models");
const { cloudinary } = require("../config/cloudinary");
const { stripe } = require("../config/stripe");

/**
 * Upload a single image buffer to Cloudinary
 */
const uploadImageToCloudinary = (imageBuffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: publicId,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        },
      )
      .end(imageBuffer);
  });
};

/**
 * Create a new listing with images
 */
const createListingService = async (userId, listingData, imageBuffers) => {
  // Create the user_book record
  const userBook = await UserBook.create({
    user_id: userId,
    title: listingData.title,
    author: listingData.author || null,
    price: listingData.price ? parseInt(listingData.price) : null,
    upload_time: new Date(),
    condition: listingData.condition || null,
    category: listingData.category || null,
    description: listingData.description || null,
  });

  // Upload images to Cloudinary and create user_book_image records
  const imageRecords = [];
  for (let i = 0; i < imageBuffers.length; i++) {
    const imageUrl = await uploadImageToCloudinary(
      imageBuffers[i],
      `listings/user_${userId}`,
      `listing_${userBook.id}_${i}`,
    );

    const imageRecord = await UserBookImage.create({
      user_book_id: userBook.id,
      image_url: imageUrl,
    });

    imageRecords.push(imageRecord);
  }

  // Return the listing with images
  const listing = await UserBook.findByPk(userBook.id, {
    include: [{ model: UserBookImage, as: "images" }],
  });

  return listing;
};

/**
 * Get listings with pagination
 */
const getListingsService = async (limit = 20, offset = 0) => {
  const { count, rows } = await UserBook.findAndCountAll({
    where: {
      sold: false, // Only show unsold items
    },
    include: [
      {
        model: UserBookImage,
        as: "images",
        attributes: ["id", "image_url"],
      },
    ],
    order: [["upload_time", "DESC"]],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  return {
    total: count,
    listings: rows,
    hasMore: offset + rows.length < count,
  };
};

/**
 * Get a single listing by ID with seller info
 */
const getListingByIdService = async (listingId) => {
  const listing = await UserBook.findByPk(listingId, {
    include: [
      {
        model: UserBookImage,
        as: "images",
        attributes: ["id", "image_url"],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "avatar_url", "createdAt"],
      },
    ],
  });

  return listing;
};

/**
 * Create Stripe checkout session for a listing
 */
const createCheckoutSessionService = async (
  listingId,
  buyerId,
  successUrl,
  cancelUrl,
) => {
  // Get listing details
  const listing = await UserBook.findByPk(listingId, {
    include: [
      {
        model: UserBookImage,
        as: "images",
        attributes: ["image_url"],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "email"],
      },
    ],
  });

  if (!listing) {
    throw new Error("Listing not found");
  }

  if (!listing.price || listing.price === 0) {
    throw new Error("Cannot create checkout for free items");
  }

  // Prevent owner from buying their own item
  if (listing.user_id === buyerId) {
    throw new Error("You cannot buy your own item");
  }

  // Check if already sold
  if (listing.sold) {
    throw new Error("This item has already been sold");
  }

  // Get buyer info
  const buyer = await User.findByPk(buyerId, {
    attributes: ["id", "email"],
  });

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: buyer?.email,
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: listing.title,
            description: listing.user.username
              ? `by ${listing.user.username}`
              : undefined,
            images: listing.images?.[0]?.image_url
              ? [listing.images[0].image_url]
              : undefined,
          },
          unit_amount: Math.round(listing.price * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      listing_id: listing.id,
      seller_id: listing.user_id,
      buyer_id: buyerId,
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
};

/**
 * Verify Stripe checkout session
 */
const verifyCheckoutSessionService = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      valid: session.payment_status === "paid",
      session: session,
    };
  } catch (error) {
    return {
      valid: false,
      session: null,
    };
  }
};

/**
 * Get user's own listings (items they are selling)
 */
const getMyListingsService = async (userId) => {
  const listings = await UserBook.findAll({
    where: {
      user_id: userId,
    },
    include: [
      {
        model: UserBookImage,
        as: "images",
        attributes: ["id", "image_url"],
      },
      {
        model: User,
        as: "buyer",
        attributes: ["id", "username", "email", "phone_number"],
        required: false,
      },
    ],
    order: [["upload_time", "DESC"]],
  });

  return listings;
};

/**
 * Get user's order history (items they bought)
 */
const getMyOrdersService = async (userId) => {
  const { Order } = require("../models");

  const orders = await Order.findAll({
    where: {
      buyer_id: userId,
    },
    include: [
      {
        model: UserBook,
        as: "listing",
        include: [
          {
            model: UserBookImage,
            as: "images",
            attributes: ["id", "image_url"],
          },
        ],
      },
      {
        model: User,
        as: "seller",
        attributes: [
          "id",
          "username",
          "email",
          "phone_number",
          "billing_address",
        ],
      },
      {
        model: User,
        as: "buyer",
        attributes: [
          "id",
          "username",
          "email",
          "phone_number",
          "billing_address",
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return orders;
};

/**
 * Delete a listing (only if user is owner and item is not sold)
 */
const deleteListingService = async (listingId, userId) => {
  const listing = await UserBook.findByPk(listingId);

  if (!listing) {
    throw new Error("Listing not found");
  }

  if (listing.user_id !== userId) {
    throw new Error("You are not authorized to delete this listing");
  }

  if (listing.sold) {
    throw new Error("Cannot delete a sold item");
  }

  // Delete associated images from database
  await UserBookImage.destroy({
    where: { user_book_id: listingId },
  });

  // Delete the listing
  await listing.destroy();

  return { message: "Listing deleted successfully" };
};

module.exports = {
  createListingService,
  getListingsService,
  getListingByIdService,
  createCheckoutSessionService,
  verifyCheckoutSessionService,
  getMyListingsService,
  getMyOrdersService,
  deleteListingService,
};
