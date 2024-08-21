import { Router } from "express";
import { confirmOrder, createOrder, getAllOrder } from "../controllers/order.controler.js";

const router = Router();

router.route("/create").post(createOrder);
router.route("/").get(getAllOrder)
router.route("/confirm").get(confirmOrder)


export default router