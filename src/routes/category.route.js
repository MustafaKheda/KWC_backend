import { Router } from "express";
import { createCategory, allCategory, getCategoryById, updateCategory, deleteCategory } from "../controllers/category.controler.js";

const router = Router();

// router.route("/create").post(createCategory);
router.route("/all-category").get(allCategory);

router.get('/', allCategory);
// Get category by ID
router.get('/:id', getCategoryById);

// Create a new category
router.post('/', createCategory);

// Update category by ID
router.put('/:id', updateCategory);

// Delete category by ID
router.delete('/:id', deleteCategory);


export default router