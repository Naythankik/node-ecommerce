const Product = require("../models/productModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");

const createProduct = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (title) {
    req.body.slug = slugify(title, "-");
  }
  try {
    const newProduct = await Product.create(req.body);
    res.json({
      message: newProduct,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getAProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findOne(req.params).select(["-_id"]);

    //if empty
    if (!product) {
      res.status(404).send({ message: "No product with the id" });
    }
    res.status(400).send(product);
    return;
  } catch (error) {
    throw new Error(error);
  }
});

const getAllProduct = asyncHandler(async (req, res) => {
  try {
    //Filtering
    let queryStr = JSON.stringify(req.query);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let product = Product.find(JSON.parse(queryStr));

    //sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      product = product.sort(sortBy);
    }

    //selecting specific fields
    if (req.query.fields) {
      let fields = req.query.fields.split(",").join(" ");
      fields += " -_id";
      product = product.select(fields);
    } else {
      product = product.select(["-_id", "-__v"]);
    }

    // pagination
    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page - 1) * limit;
    product = product.skip(skip).limit(limit);

    if (req.query.page) {
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("The page does not exists");
    }

    const request = await product;

    res.status(400).send(request);
    return;
  } catch (error) {
    throw new Error(error);
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { uuid } = req.params;

  //check if the title is to be updated by the user
  if (req.body.title) {
    req.body.slug = slugify(req.body.title, "-");
  }
  try {
    const update = await Product.findOneAndUpdate(
      { uuid: uuid },
      req.body
    ).select(["-_id"]);
    res.status(200).send(update);
  } catch (error) {
    throw new Error(error);
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { uuid } = req.params;
  try {
    const deleteProduct = await Product.findOneAndDelete({ uuid: uuid });
    if (deleteProduct) {
      res
        .status(200)
        .send({ message: "product has been deleted successfully" });
    }
    res.send({ message: "No product with the specified uuid" });
    return;
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createProduct,
  getAProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
};
