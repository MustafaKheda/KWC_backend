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
import { OrderStatus } from "../utils/OrderStatus.js";
import { TransitionHistory } from "../models/transition.model.js";
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

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  // Validate user ID
  const user = await User.findById(user_id);

  if (!user) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Validate address ID
  const productIds = order_items.map(
    (item) => new mongoose.Types.ObjectId(item.product_id)
  );

  // Fetch product details and prices
  const products = await Product.aggregate([
    { $match: { _id: { $in: productIds } } },
    { $unwind: "$inventory" },
    {
      $group: {
        _id: "$_id",
        prices: { $push: "$inventory" },
        name: { $first: "$name" },
        currency: { $first: "$attributes.currency" },
        unit: { $first: "$attributes.size_unit" },
        // stock_quantity: { $first: "$inventory.stock_quantity" }, // Add stock quantity field
      },
    },
  ]);

  let subtotal = 0;
  let validOrderItems = true;
  let insufficientStock = [];

  // Validate stock for each item in the order
  for (let i = 0; i < order_items.length; i++) {
    const product = products.find((p) =>
      p._id.equals(order_items[i].product_id)
    );
    if (!product) {
      validOrderItems = false;
      break;
    }

    const inventory = product.prices.find(
      (price) => price.size == order_items[i].size
    );
    if (!inventory) {
      validOrderItems = false;
      break;
    }

    // Validate negative or zero quantity
    if (order_items[i].quantity <= 0 || !order_items[i].quantity) {
      throw new ApiError(
        400,
        `Invalid quantity for ${product.name}. Quantity is required and must be greater than 0.`
      );
    }

    // Check if there is enough stock
    if (inventory.stock_quantity < order_items[i].quantity) {
      insufficientStock.push({
        productName: product.name,
        availableStock: inventory.stock_quantity,
        requestedQuantity: order_items[i].quantity,
      });
    }

    order_items[i].price =
      product.currency === "USD"
        ? inventory.discounted_price * 0.306
        : inventory.discounted_price;
    subtotal += order_items[i].price * order_items[i].quantity;
  }

  if (!validOrderItems) {
    throw new ApiError(
      400,
      "One or more invalid product IDs or sizes in order items"
    );
  }

  if (insufficientStock.length > 0) {
    const message = insufficientStock
      .map(
        (item) =>
          `${item.productName}: Available stock is ${item.availableStock}, but ${item.requestedQuantity} was requested.`
      )
      .join("\n");
    throw new ApiError(
      400,
      `Insufficient stock for the following items:\n${message}`
    );
  }

  // Calculate the delivery charge if not provided
  const calculatedDeliveryCharge =
    delivery_charge !== undefined ? delivery_charge : subtotal < 10 ? 1 : 0;

  // Calculate the total
  const total = subtotal + calculatedDeliveryCharge;

  // Get Address Id from DB
  const address_id = await getAddressId(address_data, user_id);

  // Create the order with the "Pending" status
  const newOrder = new Order({
    user_id,
    address_id,
    order_items,
    subtotal,
    delivery_charge: calculatedDeliveryCharge,
    total,
    status: OrderStatus.ORDER_RECEIVED, // Default status
  });

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Save the order to the database
    const savedOrder = await newOrder.save({ session });

    // Update product inventory
    for (let i = 0; i < order_items.length; i++) {
      const product = products.find((p) =>
        p._id.equals(order_items[i].product_id)
      );
      if (product) {
        // Decrement the stock by the ordered quantity
        await Product.findOneAndUpdate(
          { _id: product._id, "inventory.size": order_items[i].size },
          {
            $inc: {
              "inventory.$.stock_quantity": -parseInt(order_items[i].quantity),
            },
          },
          { session }
        );
      }
    }

    // Commit the transaction if everything is successful
    await session.commitTransaction();

    // Log the creation of the order in the transition history
    const newTransition = new TransitionHistory({
      order_id: savedOrder._id,
      old_status: "None", // Before creation, the order had no status
      new_status: OrderStatus.ORDER_RECEIVED, // Default status
      notes: "Order created successfully",
    });

    await newTransition.save();

    // Send confirmation to the vendor
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
  } catch (error) {
    // If any error occurs, abort the transaction and rollback the changes
    // Abort the transaction if any error occurs and the session is still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Error creating order:", error);
    throw new ApiError(
      500,
      "Internal Server Error. Could not create the order."
    );
  } finally {
    session.endSession();
  }
});
const confirmOrder = asyncHandler(async (req, res) => {
  const { id, status, reason } = req.query;

  if (!id || !status) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Order ID and status are required"));
  }
  if (!Object.values(OrderStatus).includes(status)) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          `Invalid status. Must be one of the following: ${Object.values(
            OrderStatus
          ).join(", ")}`
        )
      );
  }

  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the order
    const order = await Order.findById(id).session(session);
    if (!order) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Order not found"));
    }
    // If the status is "Not Delivered", ensure a reason is provided
    if (status === OrderStatus.NOT_DELIVERED && !reason) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, "Reason for non-delivery is required")
        );
    }
    // Create a new transition entry
    const transitionNotes = reason
      ? `Status changed to ${status}: ${reason}`
      : `Status changed to ${status}`;

    // Create a new transition entry
    const newTransition = new TransitionHistory({
      order_id: order._id,
      old_status: order.status,
      new_status: status,
      notes: transitionNotes,
    });

    await newTransition.save({ session });

    // Restock products if the status is 'Canceled'
    if (status === OrderStatus.ORDER_CANCELED) {
      // Ensure the stock is restored for each product in the order
      for (let item of order.order_items) {
        await Product.findOneAndUpdate(
          { _id: item.product_id, "inventory.size": item.size },
          {
            $inc: { "inventory.$.stock_quantity": -item.quantity },
          },
          { session }
        );
      }
    }

    // Update the order status
    order.status = status;
    const updatedOrder = await order.save({ session });

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    session.endSession();

    // Fetch and send email/sms content after status update
    const smsContent = await fetchAndEmailOrder(updatedOrder, status);
    res.status(200).send(`<h2>${smsContent}</h2>`);
  } catch (error) {
    // If any error occurs, abort the transaction and rollback the changes
    await session.abortTransaction();
    session.endSession();
    console.error("Error confirming order:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error"));
  }
});

const getAllOrder = asyncHandler(async (req, res) => { });

export { createOrder, getAllOrder, confirmOrder };
