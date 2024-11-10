import { Router } from "express";
import { Order } from "../models/order.model.js";
import fetchAndEmailOrder from "../utils/fetchAndEmailOrder.js";
import { OrderStatus } from "../utils/OrderStatus.js";
import mongoose from "mongoose";
import { confirmOrder } from "../controllers/order.controler.js";
const router = Router();

router.get("/order/edit/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log(orderId);
    const protocol = req.get("host").includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${req.get("host")}`; //Dynamical getting base url
    const order = await Order.findById(orderId).populate(
      "order_items.product_id"
    );
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Fetch all products to allow admin to change product_id if needed
    res.render("editOrder", { order, baseUrl });
    // res.status(200).json({ message: "Server error", order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error", error });
  }
});
router.post("/order/edit/:id", async (req, res) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).send({ message: "Invalid order items data" });
    }

    // Update order items based on form data
    order.order_items = req.body.items.map((item) => ({
      product_id: item.product_id,
      quantity: parseInt(item.quantity, 10),
      price: parseFloat(item.price),
      size: item.size,
    }));

    // Recalculate subtotal and total
    order.subtotal = order.order_items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
    order.total = order.subtotal + order.delivery_charge;
    const savedOrder = await order.save({ session });

    // Trigger confirmation function directly with necessary parameters
    const confirmReq = {
      query: {
        id: savedOrder._id,
        status: OrderStatus.ORDER_ACCEPTED, // or the desired status
      },
    };

    await confirmOrder(confirmReq, res); // Invoking confirmOrder after saving

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating and confirming order:", error);
    res.status(500).send({ message: "Server error", error: error.message });
  }
});

export default router;
