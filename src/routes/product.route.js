import { Router } from "express";
import {allProduct, createProduct, productByCategory, productBySubCategory,} from "../controllers/product.controler.js";

const router = Router();

router.route("/create").post(createProduct);
router.route("/all-product").get(allProduct);
router.route("/by-category/:id").get(productByCategory);
router.route("/by-subcategory/:id").get(productBySubCategory);



export default router