import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Product from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { Subcategory } from "../models/subcategory.model.js";
import mongoose from "mongoose";

function calculateDiscountedPrice(pricing, promotions) {
  // Check if base_price is a valid number
  if (
    typeof pricing.base_price !== "number" ||
    isNaN(pricing.base_price) ||
    pricing.base_price <= 0
  ) {
    throw new ApiError(
      "INVALID_BASE_PRICE",
      "Invalid base price. Please provide a positive number."
    );
  }

  // Check if discount_percentage is a valid number
  if (
    typeof promotions.discount_percentage !== "number" ||
    isNaN(promotions.discount_percentage) ||
    promotions.discount_percentage < 0 ||
    promotions.discount_percentage > 100
  ) {
    throw new ApiError(
      403,
      "Invalid discount percentage. Please provide a number between 0 and 100."
    );
  }

  // Return the discounted price
  return (
    pricing.base_price -
    (pricing.base_price * promotions.discount_percentage) / 100
  );
}

export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category_id,
    subcategory_id,
    pricing,
    inventory,
    images,
    attributes,
    promotions,
  } = req.body;

  // Check required fields
  if (!name) {
    throw new ApiError(400, "Missing required field: name");
  }
  if (!description) {
    throw new ApiError(400, "Missing required field: description");
  }
  if (!category_id) {
    throw new ApiError(400, "Missing required field: category_id");
  }
  if (!pricing) {
    throw new ApiError(400, "Missing required field: pricing");
  }
  if (!inventory) {
    throw new ApiError(400, "Missing required field: inventory");
  }
  if (!images) {
    throw new ApiError(400, "Missing required field: images");
  }
  // Validate pricing
  pricing.forEach((price) => {
    if (!price.base_price || !price.cost) {
      throw new ApiError(
        400,
        `Missing required pricing fields with size ${price.size}`
      );
    }
    // If promotions are provided, calculate the discounted price
    if (promotions && promotions.discount_percentage) {
      price.discounted_price = calculateDiscountedPrice(price, promotions);
    } else {
      price.discounted_price = price.base_price;
    }
  });

  // Validate inventory
  if (!inventory.stock_quantity) {
    throw new ApiError(400, "Missing required inventory fields");
  }
  // Validate images
  if (!images.main_image) {
    throw new ApiError(400, "Missing main image");
  }

  const product = new Product({
    name,
    description,
    category_id,
    subcategory_id,
    pricing,
    inventory,
    images,
    attributes,
    promotions,
  });

  await product.save();
  const newProduct = await Product.findById(product._id).select(
    "-isActive -pricing.cost -attributes.weight -promotions.sale_end_date"
  );
  res
    .status(201)
    .json(new ApiResponse(201, newProduct, "Product created successfully"));
});

export const createMultipleProducts = asyncHandler(async (req, res) => {
  const products = req.body.products;

  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new ApiError(400, "No products provided");
  }

  // Validate and prepare products
  const productsToInsert = products.map((productData) => {
    const {
      name,
      description,
      category_id,
      subcategory_id,
      pricing,
      inventory,
      images,
      attributes,
      promotions,
    } = productData;

    // Check required fields
    if (!name) {
      throw new ApiError(400, "Missing required field: name");
    }
    if (!description) {
      throw new ApiError(400, "Missing required field: description");
    }
    if (!category_id) {
      throw new ApiError(400, "Missing required field: category_id");
    }
    if (!pricing) {
      throw new ApiError(400, "Missing required field: pricing");
    }
    if (!inventory) {
      throw new ApiError(400, "Missing required field: inventory");
    }
    if (!images) {
      throw new ApiError(400, "Missing required field: images");
    }

    // Validate pricing
    pricing.forEach((price) => {
      if (!price.base_price || !price.cost) {
        throw new ApiError(
          400,
          `Missing required pricing fields with size ${price.size}`
        );
      }
      // If promotions are provided, calculate the discounted price
      if (promotions && promotions.discount_percentage) {
        price.discounted_price = calculateDiscountedPrice(price, promotions);
      } else {
        price.discounted_price = price.base_price;
      }
    });

    // Validate inventory
    if (!inventory.stock_quantity) {
      throw new ApiError(400, "Missing required inventory fields");
    }
    // Validate images
    if (!images.main_image) {
      throw new ApiError(400, "Missing main image");
    }

    return {
      name,
      description,
      category_id,
      subcategory_id,
      pricing,
      inventory,
      images,
      attributes,
      promotions,
    };
  });

  // Insert products
  const insertedProducts = await Product.insertMany(productsToInsert);

  // Select fields to return in response
  const newProducts = await Product.find({
    _id: { $in: insertedProducts.map((p) => p._id) },
  }).select(
    "-isActive -pricing.cost -attributes.weight -promotions.sale_end_date"
  );

  res
    .status(201)
    .json(new ApiResponse(201, newProducts, "Products created successfully"));
});

 const allProduct =async() => {
  const products = await Product.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: "categories", // Replace with the actual name of the category collection
        localField: "category_id",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $lookup: {
        from: "subcategories", // Replace with the actual name of the subcategory collection
        localField: "subcategory_id",
        foreignField: "_id",
        as: "subcategory",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        pricing: {
          size: 1,
          base_price: 1,
          discounted_price: 1,
        },
        categories: {
          $concatArrays: ["$category.name", "$subcategory.name"],
        },
        inventory: 1,
        category_id: 1,
        subcategory_id: 1,
        images: 1,
        attributes: 1,
        customer_reviews: 1,
        promotions: {
          discount_percentage: 1,
        },
      },
    },
  ]);
  if (!products || products.length < 1) {
    throw new ApiError(404, "Product not found");
  }
  // res.status(200).json(new ApiResponse(200, products, "Fetched All Product"));
  return products

};

export const productByCategory = asyncHandler(async (req, res) => {
  const id = req.params.id;
  console.log(id);


  if( id==='all'){
    const products=await allProduct()
 return res.status(200).json(new ApiResponse(200,products, "Fetched All Product"));
  }
  if (!id) {
    throw new ApiError(400, "Category ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Category ID format");
  }

  //
  const products = await Product.aggregate([
    {
      $match: {
        isActive: true,
        $or: [
          { category_id: new mongoose.Types.ObjectId(id) },
          { subcategory_id: new mongoose.Types.ObjectId(id) },
        ],
      },
    },
    {
      $lookup: {
        from: "categories", // Replace with the actual name of the category collection
        localField: "category_id",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $lookup: {
        from: "subcategories", // Replace with the actual name of the subcategory collection
        localField: "subcategory_id",
        foreignField: "_id",
        as: "subcategory",
      },
    },
    {
      $addFields: {
        category_name: { $arrayElemAt: ["$category.name", 0] }, // Extract category name
        subcategory_name: { $arrayElemAt: ["$subcategory.name", 0] }, // Extract subcategory name
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        pricing: {
          size: 1,
          base_price: 1,
          discounted_price: 1,
        },
        categories: {
          $filter: {
            input: [
              { $ifNull: ["$category_name", null] },
              { $ifNull: ["$subcategory_name", null] },
            ],
            as: "name",
            cond: { $ne: ["$$name", null] },
          },
        },
        inventory: 1,
        category_id: 1,
        subcategory_id: 1,
        images: 1,
        attributes: 1,
        customer_reviews: 1,
        promotions: {
          discount_percentage: 1,
        },
      },
    },
  ]);

  // const products = await Product.find({
  //   isActive: true,
  //   $or: [{ category_id: id }, { subcategory_id: id }],
  // }).select(
  //   "-isActive -pricing.cost -attributes.weight -promotions.sale_end_date"
  // );
  // const product = await Product.aggregate([
  //   {
  //     $match: {
  //       isActive: true,

  //     },
  //   },
  // ]);
  console.log(products);
  // console.log(product);
  if (!products || products.length < 1) {
    // throw new ApiError(404, "Product not found");
    return res.status(404).json(new ApiResponse(404, [], "Product not found"));
  }
  res
    .status(201)
    .json(new ApiResponse(201, products, "Fetched Product by Category"));
});

export const productBySubCategory = asyncHandler(async (req, res) => {
  const subcategory_id = req.params.id; // Access route parameter 'id'

  if (!subcategory_id) {
    throw new ApiError(400, "SubCategory ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(subcategory_id)) {
    throw new ApiError(400, "Invalid Subcategory ID format");
  }

  const products = await Product.find({
    subcategory_id,
    isActive: true,
  }).select("-pricing.cost -promotions.sale_end_date");

  if (!products || products.length < 1) {
    throw new ApiError(404, "Product not found");
    //return res.status(404).json(new ApiResponse(404, [], "Product not found"));
  }

  res
    .status(200)
    .json(new ApiResponse(200, products, "Fetched Product by SubCategory"));
});

export const productByID = asyncHandler(async (req, res) => {
  const product_id = req.params.id; // Access route parameter 'id'

  if (!product_id) {
    throw new ApiError(400, "SubCategory ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(product_id)) {
    throw new ApiError(400, "Invalid Subcategory ID format");
  }
  const products = await Product.aggregate([
    {
      $match: {
        isActive: true,
        _id: new mongoose.Types.ObjectId(product_id),
      },
    },
    {
      $lookup: {
        from: "categories", // Replace with the actual name of the category collection
        localField: "category_id",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $lookup: {
        from: "subcategories", // Replace with the actual name of the subcategory collection
        localField: "subcategory_id",
        foreignField: "_id",
        as: "subcategory",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        pricing: {
          size: 1,
          base_price: 1,
          discounted_price: 1,
        },
        categories: {
          $concatArrays: ["$category.name", "$subcategory.name"],
        },
        inventory: 1,
        category_id: 1,
        subcategory_id: 1,
        images: 1,
        attributes: 1,
        customer_reviews: 1,
        promotions: {
          discount_percentage: 1,
        },
      },
    },
  ]);
  if (!products || products.length < 1) {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json(new ApiResponse(200, products, "Fetched Product by ID"));
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) {
    throw new ApiError(400, "Search query is required");
  }

  const pipeline = [
    {
      $lookup: {
        from: "categories", // The name of the Category collection
        localField: "category_id",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $lookup: {
        from: "subcategories", // The name of the Subcategory collection
        localField: "subcategory_id",
        foreignField: "_id",
        as: "subcategory",
      },
    },
    {
      $match: {
        $or: [
          { "category.name": new RegExp(query, "i") },
          { "subcategory.name": new RegExp(query, "i") },
          { name: new RegExp(query, "i") },
        ],
        isActive: true,
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        pricing: {
          size: 1,
          base_price: 1,
          discounted_price: 1,
        },
        categories: {
          $concatArrays: ["$category.name", "$subcategory.name"],
        },
        inventory: 1,
        category_id: 1,
        subcategory_id: 1,
        images: 1,
        attributes: 1,
        customer_reviews: 1,
        promotions: {
          discount_percentage: 1,
        },
      },
    },
  ];

  // Aggregation pipeline to search by category, subcategory, or product name
  const products = await Product.aggregate(pipeline).exec();

  res
    .status(200)
    .json(
      new ApiResponse(200, products, `${products.length} Search Result Found`)
    );
});
