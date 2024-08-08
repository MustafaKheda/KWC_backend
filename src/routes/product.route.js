import { Router } from "express";
import {allProduct, createProduct, productByCategory, productBySubCategory,searchProducts,createMultipleProducts} from "../controllers/product.controler.js";

const router = Router();

router.route("/create").post(createProduct);
router.route("/").get(allProduct);
router.route("/by-category/:id").get(productByCategory);
router.route("/by-subcategory/:id").get(productBySubCategory);
router.route("/search").get(searchProducts)
router.route("/multiple").post(createMultipleProducts)



export default router