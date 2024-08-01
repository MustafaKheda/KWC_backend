import { Router } from "express";
import { registerAddress,getAllAddress } from "../controllers/order.controler.js";

const router = Router();

router.route("/create").post(registerAddress);
router.route("/").get(getAllAddress)

export default router