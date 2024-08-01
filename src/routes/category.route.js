import { Router } from "express";
import {createCategory,allCategory} from "../controllers/category.controler.js";

const router = Router();

router.route("/create").post(createCategory);
router.route("/all-category").get(allCategory);

export default router