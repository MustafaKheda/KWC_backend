import mongoose, { Schema } from "mongoose";
const inventorySchema = new Schema(
  {
    stock_quantity: {
      type: Number,
      required: true,
      trim: true,
      index: true,
    },
    size: Number,
    base_price: {
      type: Number,
      required: true,
      trim: true,
      min: 0,
    },
    discounted_price: {
      type: Number,
      trim: true,
    },
    cost: {
      type: Number,
      required: true,
      trim: true,
      min: 0,
    },
    SKU: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
  },
  { _id: false }
);

const imageSchema = new Schema(
  {
    main_image: {
      type: String, // Image URL should be a String
      required: true,
    },
    additional_images: [
      { type: String }, // Ensure the array contains strings
    ],
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    product_id: { type: String, required: true }, // Use your frontend-generated ID here
    name: {
      type: String,
      unique: true,
      trim: true,
      index: true,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Draft"], // Restricts values to these options
      default: "Draft", // Sets the default value to 'active'
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      index: true,
    },
    subcategory_id: {
      type: Schema.Types.ObjectId,
      ref: "Subcategory",
      index: true,
    },
    inventory: [inventorySchema], // Embed the inventory schema
    images: imageSchema, // Embed the image schema
    attributes: {
      currency: {
        type: String,
        required: true,
        default: "KWD",
      },
      size_unit: {
        type: String,
      },
      supplier: {
        type: String,
        trim: true,
      },
      SKU: {
        type: String,
        trim: true,
      }
    },
    brand_name: {
      type: String,
      required: true,
      trim: true,
    },
    customer_reviews: {
      ratings: {
        type: Number,
      },
      review: [
        {
          user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
          rating: {
            type: Number,
            min: 1,
            max: 5,
          },
          comment: {
            type: String,
          },
        },
      ],
    },
    promotions: {
      discount_percentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      sale_end_date: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);
// console.log(productSchema)
// Method to adjust stock when an order is placed
productSchema.statics.adjustStock = async function (productId, quantity) {
  try {
    const product = await this.findById(productId);
    if (!product) {
      throw new ApiError(400, `Product with ID ${productId} not found`);
    }

    if (product.inventory.stock_quantity < quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }

    // Reduce stock quantity
    product.inventory.stock_quantity -= quantity;

    // Save updated product
    await product.save();
  } catch (error) {
    console.log(error);
  }
};

// Method to restock if an order is canceled
productSchema.statics.restock = async function (productId, quantity) {
  try {
    const product = await this.findById(productId);
    if (!product) {
      throw new ApiError(400, `Product with ID ${productId} not found`);
    }

    // Increase stock quantity
    product.inventory.stock_quantity += quantity;

    // Save updated product
    await product.save();
  } catch (error) {
    console.log(error);
  }
};
const Product = mongoose.model("Product", productSchema);
export default Product;
