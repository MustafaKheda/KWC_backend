import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    address_id: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: [true, "Address ID is required"],
    },
    order_items: [
      {
        product_id: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product ID is required"],
        },
        quantity: {
          type: Number,
          min: [1, "Quantity must be at least 1"],
          required: [true, "Quantity is required"],
          default: 1,
        },
        price: {
          type: Number,
          required: [true, "Price is required"],
        },
        size: {
          type: Number,
          required: [true, "Product Size is required"],
        },
      },
    ],
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
    },
    delivery_charge: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
    },
    status: {
      type: String,
      enum: ["Pending", "Inprogess", "Failed", "Canceled", "Success"],
      required: [true, "Status is required"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
