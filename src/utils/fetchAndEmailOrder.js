import Product from "../models/product.model.js";
import { sendEmailToCustomer } from "./Email.js";

const fetchAndEmailOrder = async (order, status) => {
  try {
    const productIds = order.order_items.map((item) => item.product_id);
    const products = await Product.aggregate([
      { $match: { _id: { $in: productIds } } },
      {
        $project: {
          _id: 1,
          name: 1,
          unit: "$attributes.size_unit",
        },
      },
    ]);

    // Create a map of product IDs to names and units for quick lookup
    const productMap = products.reduce((map, product) => {
      map[product._id.toString()] = { name: product.name, unit: product.unit };
      return map;
    }, {});

    // Map order items to include product details
    const productDetails = order.order_items.map((item) => ({
      product_id: item.product_id,
      name: productMap[item.product_id.toString()]?.name || "Unknown Product",
      unit: productMap[item.product_id.toString()]?.unit || "Unknown Unit",
      price: item.price,
      size: item.size,
      quantity: item.quantity,
    }));

    // Send email to customer
    await sendEmailToCustomer(order, productDetails, status);
    const smsContent =
      status === "Inprogress"
        ? "Order confirmed. Successfully."
        : "Order rejected. Successfully";
    return smsContent;
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Server error", error });
  }
};
export default fetchAndEmailOrder;
