// src/models/associate.js
module.exports = (db) => {
  const {
    User,
    Role,
    UserAccess,
    FavWork,
    userfaveWork: UserFavWork,
    conversation: Conversation,
    userconverstation: UserConversation,
    Message,
    Auction,
    Bid,
    AuctionDeposit,
  } = db;

  /* User - Role */
  if (User && Role) {
    User.belongsTo(Role, { foreignKey: "role_id" });
    Role.hasMany(User, { foreignKey: "role_id" });
  }

  /* User - Access */
  if (User && UserAccess) {
    User.hasMany(UserAccess, { foreignKey: "user_id" });
    UserAccess.belongsTo(User, { foreignKey: "user_id" });
  }

  /* User - FavWork */
  if (User && FavWork && UserFavWork) {
    User.belongsToMany(FavWork, {
      through: UserFavWork,
      foreignKey: "user_id",
    });
    FavWork.belongsToMany(User, {
      through: UserFavWork,
      foreignKey: "fav_work_id",
    });
  }

  /* User - Conversation */
  if (User && Conversation && UserConversation) {
    User.belongsToMany(Conversation, {
      through: UserConversation,
      foreignKey: "user_id",
    });
    Conversation.belongsToMany(User, {
      through: UserConversation,
      foreignKey: "conversation_id",
    });
  }

  /* Conversation - Message */
  if (Conversation && Message) {
    Conversation.hasMany(Message, {
      foreignKey: "conversation_id",
      onDelete: "CASCADE",
    });
    Message.belongsTo(Conversation, {
      foreignKey: "conversation_id",
    });
  }

  /* User - Message */
  if (User && Message) {
    User.hasMany(Message, { foreignKey: "sender_id" });
    Message.belongsTo(User, { foreignKey: "sender_id" });
  }

  /* =============== AUCTION / BID / DEPOSIT =============== */

  if (Auction && User) {
    Auction.belongsTo(User, {
      foreignKey: "seller_id",
      as: "seller",
    });
    User.hasMany(Auction, {
      foreignKey: "seller_id",
      as: "auctions",
    });
  }

  if (Auction && Bid) {
    Auction.hasMany(Bid, {
      foreignKey: "auction_id",
      as: "bids",
    });
    Bid.belongsTo(Auction, {
      foreignKey: "auction_id",
      as: "auction",
    });
  }

  if (Auction && AuctionDeposit) {
    Auction.hasMany(AuctionDeposit, {
      foreignKey: "auction_id",
      as: "deposits",
    });
    AuctionDeposit.belongsTo(Auction, {
      foreignKey: "auction_id",
      as: "auction",
    });
  }

  if (User && Bid) {
    User.hasMany(Bid, {
      foreignKey: "user_id",
      as: "bids",
    });
    Bid.belongsTo(User, {
      foreignKey: "user_id",
      as: "user",
    });
  }

  if (User && AuctionDeposit) {
    User.hasMany(AuctionDeposit, {
      foreignKey: "user_id",
      as: "auctionDeposits",
    });
    AuctionDeposit.belongsTo(User, {
      foreignKey: "user_id",
      as: "user",
    });
  }
};
