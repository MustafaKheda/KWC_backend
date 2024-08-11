import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { sendEmailToVendor } from "../utils/Email.js";



const createOrder = asyncHandler(async (req, res) => {
    const { user_id, address_id, order_items, delivery_charge } = req.body;
    // Validate user ID
    const user = await User.findById(user_id);

    if (!user) {
        throw new ApiError(400, 'Invalid user ID')
    }

    // Validate address ID
    // const address = await Address.findById(address_id);
    // if (!address) {
    //     throw new ApiError(400, 'Invalid address ID')
    // }
    const productIds = await order_items.map(item => new mongoose.Types.ObjectId(item.product_id));

    const products = await Product.aggregate([
        { $match: { _id: { $in: productIds } } },
        { $unwind: "$pricing" },
        {
            $group: {
                _id: "$_id",
                prices: { $push: "$pricing" },
                name: { $first: "$name" },
                currency: { $first: "$attributes.currency" }
            }
        }
    ]);
    let subtotal = 0;
    let validOrderItems = true;

    for (let i = 0; i < order_items.length; i++) {
        const product = products.find(p => p._id.equals(order_items[i].product_id));
        if (!product) {
            validOrderItems = false;
            break;
        }

        const pricing = product.prices.find(price => price.size === order_items[i].size);
        if (!pricing) {
            validOrderItems = false;
            break;
        }
        order_items[i].price = product.currency === "USD" ? pricing.discounted_price * 0.306 : pricing.discounted_price;
        subtotal += order_items[i].price * order_items[i].quantity;
    }

    if (!validOrderItems) {
        throw new ApiError(400, 'One or more invalid product IDs or sizes in order items');
    }
    // Calculate the delivery charge if not provided
    const calculatedDeliveryCharge = delivery_charge !== undefined ? delivery_charge : (subtotal < 10 ? 1 : 0);

    // Calculate the total
    const total = subtotal + calculatedDeliveryCharge;

    // Create new order
    const newOrder = new Order({
        user_id,
        address_id,
        order_items,
        subtotal,
        delivery_charge: calculatedDeliveryCharge,
        total,
        status: "Pending" // default status
    });


    // Save the order to the database
    const savedOrder = await newOrder.save();
    sendEmailToVendor(savedOrder, products)

    return res.status(201).json(new ApiResponse(201, savedOrder, "Order placed successfully. Thank you for your purchase!"));

})

const getAllOrder = asyncHandler(async (req, res) => {

});


export { createOrder, getAllOrder }