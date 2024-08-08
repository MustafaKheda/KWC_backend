import { Router } from "express";
import { createOrder, getAllOrder } from "../controllers/order.controler.js";

const router = Router();

router.route("/create").post(createOrder);
router.route("/").get(getAllOrder)


export default router