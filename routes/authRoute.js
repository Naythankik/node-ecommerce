const express = require("express");
const {
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
} = require("../controller/userCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/forgot-password", forgotPasswordToken);
router.put("/resetPassword/:token", resetPassword);
router.put("/password", authMiddleware, updatePassword);
router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.get("/all-users", getAllUser);
router.get("/refresh", handleRefreshToken);
router
  .route("/:uuid")
  .get(authMiddleware, getAUser)
  .put(authMiddleware, updateAUser)
  .delete(authMiddleware, deleteAuser);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, unBlockUser);
module.exports = router;
