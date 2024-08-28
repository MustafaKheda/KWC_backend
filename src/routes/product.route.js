import { Router } from "express";
import {
  createProduct,
  productByCategory,
  productBySubCategory,
  searchProducts,
  createMultipleProducts,
  productByID,
} from "../controllers/product.controler.js";

const router = Router();

router.route("/create").post(createProduct);
// router.route("/").get(allProduct);
// router.route("/by-category").get(allProduct);
router.route("/by-category/:id").get(productByCategory);
router.route("/by-subcategory/:id").get(productBySubCategory);
router.route("/search").get(searchProducts);
router.route("/:id").get(productByID);
router.route("/multiple").post(createMultipleProducts);

export default router;
