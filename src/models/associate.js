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
  } = db;

  /* User - Role */
  User.belongsTo(Role, { foreignKey: 'role_id' });
  Role.hasMany(User, { foreignKey: 'role_id' });

  /* User - Access */
  User.hasMany(UserAccess, { foreignKey: 'user_id' });
  UserAccess.belongsTo(User, { foreignKey: 'user_id' });

  /* User - FavWork */
  User.belongsToMany(FavWork, {
    through: UserFavWork,
    foreignKey: 'user_id',
  });
  FavWork.belongsToMany(User, {
    through: UserFavWork,
    foreignKey: 'fav_work_id',
  });

  /* User - Conversation */
  User.belongsToMany(Conversation, {
    through: UserConversation,
    foreignKey: 'user_id',
  });
  Conversation.belongsToMany(User, {
    through: UserConversation,
    foreignKey: 'conversation_id',
  });

  /* Conversation - Message */
  Conversation.hasMany(Message, {
    foreignKey: 'conversation_id',
    onDelete: 'CASCADE',
  });
  Message.belongsTo(Conversation, {
    foreignKey: 'conversation_id',
  });

  /* User - Message */
  User.hasMany(Message, { foreignKey: 'sender_id' });
  Message.belongsTo(User, { foreignKey: 'sender_id' });
};
