import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { sendEmailToCustomer, sendEmailToVendor } from "../utils/Email.js";
import { sendTovendor } from "../utils/WhatsappAPI.js";
import fetchAndEmailOrder from "../utils/fetchAndEmailOrder.js";
const getAddressId = async (data, userId) => {
  const { email: newEmail, ...addressData } = data;
  const { area, block, street, avenue, houseNumber } = addressData;
  if (!addressData.firstName) {
    throw new ApiError(400, `First name is Required`);
  }

  if ([area, block, street, avenue, houseNumber].some((item) => !item)) {
    throw new ApiError(400, `All the Address related fields are required`);
  }
  if (!newEmail) {
    throw new ApiError(400, `Email is Required`);
  }
  const existedAddress = await Address.findOne({
    ...addressData,
    userId,
  });

  if (existedAddress) {
    console.log("Already created");
    return existedAddress._id;
  }
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { email: newEmail },
    { new: true, runValidators: true } // Options to return the updated document and run validators
  );

  const newAddress = await Address.create({
    ...addressData,
    userId,
  });
  return newAddress._id;
};

const createOrder = asyncHandler(async (req, res) => {
  const { user_id, address_data, order_items, delivery_charge } = req.body;
  console.log(req.body);
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  // Validate user ID
  const user = await User.findById(user_id);

  if (!user) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Validate address ID

  const productIds = await order_items.map(
    (item) => new mongoose.Types.ObjectId(item.product_id)
  );

  const products = await Product.aggregate([
    { $match: { _id: { $in: productIds } } },
    { $unwind: "$pricing" },
    {
      $group: {
        _id: "$_id",
        prices: { $push: "$pricing" },
        name: { $first: "$name" },
        currency: { $first: "$attributes.currency" },
        unit: { $first: "$attributes.size_unit" },
      },
    },
  ]);
  let subtotal = 0;
  let validOrderItems = true;

  for (let i = 0; i < order_items.length; i++) {
    const product = products.find((p) =>
      p._id.equals(order_items[i].product_id)
    );
    if (!product) {
      validOrderItems = false;
      break;
    }

    const pricing = product.prices.find(
      (price) => price.size === order_items[i].size
    );
    if (!pricing) {
      validOrderItems = false;
      break;
    }
    // Validate negative quantity
    if (order_items[i].quantity <= 0 || !order_items[i].quantity) {
      throw new ApiError(
        400,
        `Invalid quantity for ${product.name}. Quantity is required and must be greater than 0,`
      );
    }

    order_items[i].price =
      product.currency === "USD"
        ? pricing.discounted_price * 0.306
        : pricing.discounted_price;
    subtotal += order_items[i].price * order_items[i].quantity;
  }

  if (!validOrderItems) {
    throw new ApiError(
      400,
      "One or more invalid product IDs or sizes in order items"
    );
  }
  // Calculate the delivery charge if not provided
  const calculatedDeliveryCharge =
    delivery_charge !== undefined ? delivery_charge : subtotal < 10 ? 1 : 0;

  // Calculate the total
  const total = subtotal + calculatedDeliveryCharge;
  // Get Address Id from DB
  const address_id = await getAddressId(address_data, user_id);

  // Create new order
  const newOrder = new Order({
    user_id,
    address_id,
    order_items,
    subtotal,
    delivery_charge: calculatedDeliveryCharge,
    total,
    status: "Pending", // default status
  });
  // Save the order to the database
  const savedOrder = await newOrder.save();
  //Send Confirmation to Vendor
  sendTovendor(savedOrder, products, baseUrl);
  sendEmailToVendor(savedOrder, products, baseUrl);

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        savedOrder,
        "Order placed successfully. Thank you for your purchase!"
      )
    );
});

const confirmOrder = asyncHandler(async (req, res) => {
  const { id, status } = req.query;

  if (!id || !status) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Order ID and status are required"));
  }
  if (!["Inprogress", "Canceled"].includes(status)) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "Invalid status. Must be 'Inprogress' or 'Canceled'"
        )
      );
  }
  try {
    const order = await Order.findById(id);
    console.log(order)
    if (!order) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Order not found"));
    }
    if (order.status !== "Pending") {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Order has been already Accepted or rejected"
          )
        );
    }
    // Update the order status
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    const smsContent = await fetchAndEmailOrder(updatedOrder, status);
      res.status(200).send(`<h2>${smsContent}</h2>`);
  } catch (error) {
    console.error("Error confirming order:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error"));
  }
});

const getAllOrder = asyncHandler(async (req, res) => {});

export { createOrder, getAllOrder, confirmOrder };
