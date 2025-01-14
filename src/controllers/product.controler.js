import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";
import { getPagination } from "../utils/pagination.js";

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
  try {
    const {
      product_id,
      name,
      description,
      category_id,
      subcategory_id,
      inventory,
      images,
      attributes,
      promotions,
      brand_name,
    } = req.body;
    console.log(req.body)

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
    if (!images) {
      throw new ApiError(400, "Missing required field: images");
    }
    if (!brand_name) {
      throw new ApiError(400, "Missing required field: brand name");
    }
    // Validate pricing
    inventory.forEach((price) => {
      if (!price.base_price || !price.cost) {
        throw new ApiError(
          400,
          `Missing required pricing fields with size ${price.size}`
        );
      }
      if (!price.stock_quantity) {
        throw new ApiError(400, "Missing required inventory fields");
      }
      // if discounted price is already provide considar that only
      if (price.discounted_price) {
        return
      }
      // If promotions are provided, calculate the discounted price
      if (promotions && promotions.discount_percentage) {
        price.discounted_price = calculateDiscountedPrice(price, promotions);
      } else {
        price.discounted_price = price.base_price;
      }
    });
    console.log(inventory)
    // Validate images
    if (!images.main_image) {
      throw new ApiError(400, "Missing main image");
    }

    const product = new Product({
      product_id,
      name,
      description,
      category_id,
      subcategory_id,
      inventory,
      images,
      attributes,
      promotions,
      brand_name
    });

    await product.save();
    const newProduct = await Product.findById(product._id).select(
      "-isActive -inventory.cost -attributes.weight -promotions.sale_end_date"
    );
    res
      .status(200)
      .json(new ApiResponse(200, newProduct, "Product created successfully"));
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error handling
      res.status(400).json({
        status: 'duplicate_key_error',
        message: `Product with name '${req.body.name}' already exists.`,
        details: error.message
      });
    } else {
      // Other errors
      res.status(500).json({
        status: 'server_error',
        message: 'An error occurred while adding the product.',
        details: error.message
      });
    }
  }

});
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params
  console.log(id)
  try {
    const {
      product_id,
      name,
      description,
      category_id,
      subcategory_id,
      inventory,
      images,
      attributes,
      promotions,
      brand_name,
    } = req.body;
    console.log(req.body)
    if (!product_id) {
      throw new ApiError(400, "Missing required field: product_id");
    }

    console.log(`Updating product with ID: ${product_id}`);

    // Validate pricing
    inventory.forEach((price) => {
      if (!price.base_price || !price.cost) {
        throw new ApiError(
          400,
          `Missing required pricing fields for size ${price.size}`
        );
      }
      if (!price.stock_quantity) {
        throw new ApiError(400, "Missing required inventory fields");
      }
      if (!price.discounted_price) {
        price.discounted_price =
          promotions && promotions.discount_percentage
            ? calculateDiscountedPrice(price, promotions)
            : price.base_price;
      }
    });

    // Validate images
    if (!images || !images.main_image) {
      throw new ApiError(400, "Missing main image");
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        category_id,
        subcategory_id,
        inventory,
        images,
        attributes,
        promotions,
        brand_name,
      },
      { new: true, runValidators: true } // Return the updated product and apply validations
    );

    if (!updatedProduct) {
      throw new ApiError(404, "Product not found");
    }
    console.log(updatedProduct)

    const responseProduct = await Product.findById(updatedProduct._id).select(
      "-isActive -inventory.cost -attributes.weight -promotions.sale_end_date"
    );

    res
      .status(200)
      .json(new ApiResponse(200, responseProduct, "Product updated successfully"));
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      res.status(400).json({
        status: "duplicate_key_error",
        message: `Product with name '${req.body.name}' already exists.`,
        details: error.message,
      });
    } else {
      console.log(data)
      // Handle other errors
      res.status(500).json({
        status: "server_error",
        message: "An error occurred while updating the product.",
        details: error.message,
      });
    }
  }
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
      inventory,
      images,
      attributes,
      promotions,
      brand_name
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
    if (!images) {
      throw new ApiError(400, "Missing required field: images");
    }
    if (!brand_name) {
      throw new ApiError(400, "Missing required field: images");
    }

    // Validate pricing
    inventory.forEach((price) => {
      if (!price.base_price || !price.cost) {
        throw new ApiError(
          400,
          `Missing required pricing fields with size ${price.size}`
        );
      }
      // Validate inventory
      if (!price.stock_quantity) {
        throw new ApiError(400, "Missing required inventory fields");
      }
      // If promotions are provided, calculate the discounted price
      if (promotions && promotions.discount_percentage) {
        price.discounted_price = calculateDiscountedPrice(price, promotions);
      } else {
        price.discounted_price = price.base_price;
      }
    });

    // Validate images
    if (!images.main_image) {
      throw new ApiError(400, "Missing main image");
    }
    return {
      name,
      description,
      category_id,
      subcategory_id,
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
    "-isActive -inventory.cost -attributes.weight -promotions.sale_end_date"
  );

  res
    .status(200)
    .json(new ApiResponse(200, newProducts, "Products created successfully"));
});

export const allProduct = async (req, res) => {
  const id = req.params.id;
  const { page, limit } = req.query;
  const { skip, limit: limitNumber } = getPagination(page, limit);
  try {
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
          categories: {
            $concatArrays: ["$category.name", "$subcategory.name"],
          },
          inventory: {
            size: 1,
            base_price: 1,
            discounted_price: 1,
            stock_quantity: 1,
            supplier: 1,
          },
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
      { $skip: skip }, // Pagination skip
      { $limit: limitNumber }, // Pagination limit
    ]);
    if (!products || products.length < 1) {
      throw new ApiError(404, "Product not found");
    }

    if (id) {
      return products;
    }
    const totalItems = await Product.countDocuments({ isActive: true });
    const totalPages = Math.ceil(totalItems / limitNumber);
    res.status(200).json(
      new ApiResponse(
        200,
        {
          products,
          totalPages,
          totalItems,
          currentPage: parseInt(page, 10) || 1,
        },
        "Fetched All Products"
      )
    );
    // res.status(200).json(new ApiResponse(200, products, "Fetched All Product"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};
export const productByCategory = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { page, limit, admin } = req.query;
  const { skip, limit: limitNumber } = getPagination(page, limit);

  // Define match condition
  let matchCondition;

  if (id === "all") {
    // Match all products
    matchCondition = admin === "true"
      ? { isActive: true } // Admin sees all products
      : { isActive: true, status: "Active" }; // Non-admin sees only active products
  } else {
    // Validate category ID
    if (!id) {
      throw new ApiError(400, "Category ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid Category ID format");
    }

    // Match products by category or subcategory
    matchCondition = admin === "true"
      ? {
        $or: [
          { category_id: new mongoose.Types.ObjectId(id) },
          { subcategory_id: new mongoose.Types.ObjectId(id) },
        ],
      }
      : {
        isActive: true,
        status: "Active",
        $or: [
          { category_id: new mongoose.Types.ObjectId(id) },
          { subcategory_id: new mongoose.Types.ObjectId(id) },
        ],
      };
  }

  // Build aggregation pipeline
  const aggregationPipeline = [
    {
      $match: matchCondition,
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
        category_name: { $arrayElemAt: ["$category.name", 0] },
        subcategory_name: { $arrayElemAt: ["$subcategory.name", 0] },
      },
    },
    { $skip: skip }, // Pagination
    { $limit: limitNumber }
  ];

  // Add projection and pagination for non-admin users
  if (!admin || admin !== "true") {
    aggregationPipeline.push(
      {
        $project: {
          name: 1,
          description: 1,
          categories: {
            $concatArrays: ["$category.name", "$subcategory.name"],
          },
          inventory: {
            size: 1,
            base_price: 1,
            discounted_price: 1,
            stock_quantity: 1,
            supplier: 1,
          },
          brand_name: 1,
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

    );
  }

  const products = await Product.aggregate(aggregationPipeline)
  console.log(products, skip, limitNumber)
  // Calculate total items and pages
  const totalItems = admin === "true"
    ? await Product.countDocuments(matchCondition)
    : products.length;
  const totalPages = Math.ceil(totalItems / limitNumber);

  const currentPage = parseInt(page, 10) || 1;
  // Calculate hasMore
  const hasMore = currentPage < totalPages;

  // Handle no products found
  if (!products || products.length < 1) {
    return res.status(200).json(new ApiResponse(404, [], "Product not found"));
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        totalPages,
        totalItems,
        currentPage: parseInt(page, 10) || 1,
        hasMore
      },
      id === "all" ? "Fetched All Products" : "Fetched Products by Category"
    )
  );
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
  }).select("-inventory.cost -promotions.sale_end_date");

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
  const { admin } = req.query
  if (!product_id) {
    throw new ApiError(400, "SubCategory ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(product_id)) {
    throw new ApiError(400, "Invalid Subcategory ID format");
  }

  let matchCondition = admin === "true"
    ? {
      _id: new mongoose.Types.ObjectId(product_id),
    }
    : {
      isActive: true,
      _id: new mongoose.Types.ObjectId(product_id),
      status: "Active"
    };

  const aggregationPipeline = [
    {
      $match: matchCondition,
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
        category_name: { $arrayElemAt: ["$category.name", 0] },
        subcategory_name: { $arrayElemAt: ["$subcategory.name", 0] },
      },
    },
  ];

  if (!admin || !admin === "true") {
    aggregationPipeline.push(
      {
        $project: {
          name: 1,
          description: 1,
          categories: {
            $concatArrays: ["$category.name", "$subcategory.name"],
          },
          inventory: {
            size: 1,
            base_price: 1,
            discounted_price: 1,
            stock_quantity: 1,
            supplier: 1,
          },
          brand_name: 1,
          category_id: 1,
          subcategory_id: 1,
          images: 1,
          attributes: 1,
          customer_reviews: 1,
          promotions: {
            discount_percentage: 1,
          },
        },
      })
  }
  const products = await Product.aggregate(aggregationPipeline);


  // const products = await Product.aggregate([
  //   {
  //     $match: {
  //       isActive: true,
  //       _id: new mongoose.Types.ObjectId(product_id),
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "categories", // Replace with the actual name of the category collection
  //       localField: "category_id",
  //       foreignField: "_id",
  //       as: "category",
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "subcategories", // Replace with the actual name of the subcategory collection
  //       localField: "subcategory_id",
  //       foreignField: "_id",
  //       as: "subcategory",
  //     },
  //   },
  //  
  // ]);

  if (!products || products.length < 1) {
    // throw new ApiError(404, "Product not found");
    return res.status(404).json(new ApiResponse(404, [], "Product not found"));
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
        categories: {
          $concatArrays: ["$category.name", "$subcategory.name"],
        },
        inventory: {
          size: 1,
          base_price: 1,
          discounted_price: 1,
          stock_quantity: 1,
          supplier: 1,
        },
        brand_name: 1,
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


export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params; // Product ID from URL
    console.log(id)
    // Validate status

    // Find and update the product status
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, runValidators: true } // Return the updated document and validate input
    );
    console.log(updatedProduct)
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product status updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params; // Product ID from URL
    const { status } = req.body; // New status from the request body

    // Validate status
    const validStatuses = ["Active", "Inactive", "Draft"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find and update the product status
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true } // Return the updated document and validate input
    );
    console.log(updatedProduct)
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product status updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};