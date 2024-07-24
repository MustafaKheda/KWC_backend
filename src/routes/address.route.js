import { Router } from "express";
import { registerAddress } from "../controllers/address.controler.js";

const router = Router();

router.route("/register").post(registerAddress);

export default router