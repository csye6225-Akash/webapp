'use strict';

module.exports = (sequelize, DataTypes) => {
  const Account = sequelize.define('Account', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    account_created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    account_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    imageKey: { // New field for storing the S3 object key
      type: DataTypes.STRING,
      allowNull: true, // Allow null initially since not all accounts may have a profile pic
    },
  });

  // Set the account_updated timestamp on update
  Account.beforeUpdate((account) => {
    account.account_updated = new Date();
  });

  return Account; // Return the defined model
};
