const { SavedItem, UserBook, UserBookImage } = require("../models");

const VALID_ITEM_TYPES = ["book", "market_item"];

const validatePayloadByType = (itemType, workId, marketItemId) => {
  if (!VALID_ITEM_TYPES.includes(itemType)) {
    throw new Error("item_type must be either book or market_item");
  }

  if (itemType === "book" && !workId) {
    throw new Error("work_id is required when item_type is book");
  }

  if (itemType === "market_item" && !marketItemId) {
    throw new Error("market_item_id is required when item_type is market_item");
  }
};

const normalizeCommonFields = (title, redirectUrl) => {
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const normalizedRedirectUrl =
    typeof redirectUrl === "string" ? redirectUrl.trim() : "";

  if (!normalizedTitle) {
    throw new Error("title is required");
  }

  if (!normalizedRedirectUrl) {
    throw new Error("redirect_url is required");
  }

  return {
    normalizedTitle,
    normalizedRedirectUrl,
  };
};

const findMarketListing = async (marketItemId) => {
  return UserBook.findByPk(marketItemId, {
    include: [
      {
        model: UserBookImage,
        as: "images",
        attributes: ["image_url"],
        limit: 1,
      },
    ],
  });
};

const getExistingSavedItem = async (userId, itemType, workId, marketItemId) => {
  const whereCondition =
    itemType === "book"
      ? {
          user_id: userId,
          item_type: "book",
          work_id: workId,
        }
      : {
          user_id: userId,
          item_type: "market_item",
          market_item_id: marketItemId,
        };

  return SavedItem.findOne({ where: whereCondition });
};

const createSavedItemService = async (userId, payload) => {
  const {
    item_type: itemType,
    work_id: workId,
    market_item_id: rawMarketItemId,
    preview_image_url: previewImageUrl,
    title,
    redirect_url: redirectUrl,
  } = payload;

  const marketItemId =
    rawMarketItemId !== undefined && rawMarketItemId !== null
      ? parseInt(rawMarketItemId, 10)
      : null;

  validatePayloadByType(itemType, workId, marketItemId);

  const { normalizedTitle, normalizedRedirectUrl } = normalizeCommonFields(
    title,
    redirectUrl,
  );

  if (itemType === "market_item") {
    const listing = await findMarketListing(marketItemId);
    if (!listing) {
      throw new Error("Market item not found");
    }
  }

  const existingSavedItem = await getExistingSavedItem(
    userId,
    itemType,
    workId,
    marketItemId,
  );

  if (existingSavedItem) {
    return {
      created: false,
      item: existingSavedItem,
    };
  }

  const savedItem = await SavedItem.create({
    user_id: userId,
    item_type: itemType,
    work_id: itemType === "book" ? workId : null,
    market_item_id: itemType === "market_item" ? marketItemId : null,
    preview_image_url: previewImageUrl || null,
    title: normalizedTitle,
    redirect_url: normalizedRedirectUrl,
  });

  return {
    created: true,
    item: savedItem,
  };
};

const getSavedItemsService = async (userId, page = 1, limit = 20, itemType) => {
  const whereCondition = {
    user_id: userId,
  };

  if (itemType) {
    if (!VALID_ITEM_TYPES.includes(itemType)) {
      throw new Error("item_type must be either book or market_item");
    }
    whereCondition.item_type = itemType;
  }

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await SavedItem.findAndCountAll({
    where: whereCondition,
    order: [["created_at", "DESC"]],
    limit: parsedLimit,
    offset,
  });

  return {
    items: rows,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit),
      hasMore: offset + rows.length < count,
    },
  };
};

const isSavedItemService = async (userId, itemType, workId, rawMarketItemId) => {
  const marketItemId =
    rawMarketItemId !== undefined && rawMarketItemId !== null
      ? parseInt(rawMarketItemId, 10)
      : null;

  validatePayloadByType(itemType, workId, marketItemId);

  const savedItem = await getExistingSavedItem(
    userId,
    itemType,
    workId,
    marketItemId,
  );

  return {
    saved: !!savedItem,
    item: savedItem || null,
  };
};

const deleteSavedItemByIdService = async (savedItemId, userId) => {
  const item = await SavedItem.findOne({
    where: {
      id: savedItemId,
      user_id: userId,
    },
  });

  if (!item) {
    throw new Error("Saved item not found");
  }

  await item.destroy();

  return {
    deletedId: item.id,
  };
};

const deleteSavedItemByReferenceService = async (
  userId,
  itemType,
  workId,
  rawMarketItemId,
) => {
  const marketItemId =
    rawMarketItemId !== undefined && rawMarketItemId !== null
      ? parseInt(rawMarketItemId, 10)
      : null;

  validatePayloadByType(itemType, workId, marketItemId);

  const item = await getExistingSavedItem(userId, itemType, workId, marketItemId);

  if (!item) {
    throw new Error("Saved item not found");
  }

  await item.destroy();

  return {
    deletedId: item.id,
  };
};

module.exports = {
  createSavedItemService,
  getSavedItemsService,
  isSavedItemService,
  deleteSavedItemByIdService,
  deleteSavedItemByReferenceService,
};
