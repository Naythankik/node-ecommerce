const mongoose = require("mongoose");
const User = require("../models/userModel");

const validateMongoDbId = async (user, params) => {
  try {
    //check if document exists
    const client = await User.findOne(params);
    if (!client) {
      throw new Error("This id is not valid or not found");
    }

    //check if the uuid equals the logged in user
    if (user.uuid !== params.uuid) {
      throw new Error("This user with the id is not active");
    }
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = validateMongoDbId;
