import { Router } from "express";
import { Order } from "../models/order.model.js";
import fetchAndEmailOrder from "../utils/fetchAndEmailOrder.js";
const router = Router();

router.get("/order/edit/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const baseUrl = `${req.protocol}://${req.get("host")}`; //Dynamical getting base url
    console.log(baseUrl,"Base URL");
    const order = await Order.findById(orderId).populate(
      "order_items.product_id"
    );
    console.log(order);
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Fetch all products to allow admin to change product_id if needed
    res.render("editOrder", { order, baseUrl });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).send("Server error");
  }
});
router.post("/order/edit/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    console.log(order, "before");
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }
    console.log(req.body);
    // Update order items based on form data
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).send({ message: "Invalid order items data" });
    }
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
    order.status = "Inprogess";
    const savedOrder = await order.save();
    const smsContent = await fetchAndEmailOrder(savedOrder, "Inprogress");
    res.status(200).send(`<h2>${smsContent}</h2>`);
  } catch (error) {
    res.status(500).send({ message: "Server error", error });
  }
});

export default router;
