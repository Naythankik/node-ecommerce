const express = require("express");
const {
  createProduct,
  getAProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
} = require("../controller/productCtrl");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
const router = express.Router();

router
  .route("/")
  .post(authMiddleware, isAdmin, createProduct)
  .get(getAllProduct);
router
  .route("/:uuid")
  .get(getAProduct)
  .put(authMiddleware, isAdmin, updateProduct)
  .delete(authMiddleware, isAdmin, deleteProduct);

module.exports = router;
