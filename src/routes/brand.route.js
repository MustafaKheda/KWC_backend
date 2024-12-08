import express from "express";
import {
    createBrand,
    getAllBrands,
    getBrandById,
    updateBrand,
    deleteBrand,
} from "../controllers/brand.controler.js";

const router = express.Router();

router.post("/", createBrand);
router.get("/", getAllBrands);
router.get("/:id", getBrandById);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);

export default router;
