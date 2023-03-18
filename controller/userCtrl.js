const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { generateRefreshToken } = require("../config/refreshToken");
const crypto = require("crypto");
const { jwt } = require("jsonwebtoken");
const { validate } = require("../models/userModel");
const bcrypt = require("bcrypt");
const sendMail = require("./emailCtrl");

const createUser = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const findUser = await User.findOne({ email });
  if (!findUser) {
    //create a new user
    const salt = bcrypt.genSaltSync(10);
    const newUser = await User(req.body);
    newUser.password = bcrypt.hashSync(req.body.password, salt);

    await newUser.save();

    res.json({
      message: "User has been created successfully",
      success: true,
    });
  } else {
    //user already exists
    res.json({
      msg: "User already exists",
      success: false,
    });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //check if user exists or not
  const findUser = await User.findOne({ email });
  console.log(findUser);
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateUser = await User.findByIdAndUpdate(
      findUser._id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 86400,
    });
    res.json({
      uuid: findUser?.uuid,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Invalid credentials");
  }
});

const logout = asyncHandler(async (req, res) => {
  console.log(req.cookies);
  return;
  const cookie = req.cookies;

  if (!cookie?.refreshToken) throw new Error("No refresh token in the cookies");

  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });

  if (!user) {
    res.clearCookie("refreshToken", { httpOnly: true, secure: true });
    return res.sendStatus(204);
  }
  await User.findOneAndUpdate(refreshToken, {
    refreshToken: "",
  });

  res.clearCookie("refreshToken", { httpOnly: true, secure: true });
  res.sendStatus(204);
});

// Handler for refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) {
    throw new Error("No refresh token in the cookies");
  }
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    throw new Error("No refresh token present in DB");
  }
  // jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
  //   if (err || user.id !== decoded.id) {
  //     throw new Error("There is something wrong with the refresh token");
  //   }
  const accessToken = generateToken(user?.id);
  res.json(accessToken);
  // });
});

const getAllUser = asyncHandler(async (req, res) => {
  const getUsers = await User.find().select(["-_id", "-__v"]);
  try {
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});

const getAUser = asyncHandler(async (req, res) => {
  validateMongoDbId(req.user, req.params);
  try {
    const findUser = await User.findOne(req.params).select(["-_id", "-__v"]);
    res.json(findUser);
  } catch (error) {
    throw new Error(error);
  }
});

const deleteAuser = asyncHandler(async (req, res) => {
  validateMongoDbId(req.user, req.params);

  try {
    await User.findOneAndDelete(req.params);
    res.json({ message: "User has been deleted successfully" });
  } catch (error) {
    throw new Error(error);
  }
});

const updateAUser = asyncHandler(async (req, res) => {
  //check if the uuid from the from match with the logged in user
  validateMongoDbId(req.user, req.params);

  try {
    const updatedUser = await User.findOneAndUpdate(req.params, req.body, {
      new: true,
    });
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.user;
  validateMongoDbId(id);
  try {
    const blocked = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );
    res.json({
      message: "User blocked",
    });
  } catch (error) {
    throw new Error(error);
  }
});

const unBlockUser = asyncHandler(async (req, res) => {
  const { id } = req.user;
  validateMongoDbId(id);
  try {
    const unblocked = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    );
    res.json(
      res.json({
        message: "User Unblocked",
      })
    );
  } catch (error) {
    throw new Error(error);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { uuid } = req.user;

  const { password } = req.body;
  validateMongoDbId(req.user, { uuid: uuid });

  const user = await User.findOne({ uuid: uuid });

  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.send({ mesaage: "Password has been updated" });
  } else {
    res.send({ message: user });
  }
  return;
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User is not registered");
  try {
    // create a token and expiry date
    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;

    await user.save();

    const resetUrl = `<a href="http://localhost:${process.env.PORT}/api/user/resetPassword/${token}">Click here</a>`;
    const data = {
      to: `${user.firstname} ${email}`,
      subject: "Password Reset",
      text: "Hey user",
      html: resetUrl,
    };
    sendMail(data);
    res.json(resetUrl);
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  if (!user) throw new Error("Token has expired, Please try again later");

  //if user returns true
  user.password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  await user.save();

  res.send("Password has been reset successfully");
});

module.exports = {
  createUser,
  loginUser,
  getAllUser,
  getAUser,
  deleteAuser,
  updateAUser,
  blockUser,
  unBlockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
};
