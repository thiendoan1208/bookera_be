module.exports = (sequelize, DataTypes) => {
    const userconversation = sequelize.define(
        'userconverstation',
        {
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            conversation_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            freezeTableName: true,
            timestamps: false,
        }
    );

    return userconversation;
};