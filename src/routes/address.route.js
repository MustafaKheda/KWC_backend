import { Router } from "express";
import { registerAddress,getAllAddress } from "../controllers/address.controler.js";

const router = Router();

router.route("/create").post(registerAddress);
router.route("/:user_id").get(getAllAddress)

export default router