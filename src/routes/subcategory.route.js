import express from 'express';
import {
    createSubcategory,
    allSubcategory,
    getSubcategoryById,
    updateSubcategory,
    deleteSubcategory
} from '../controllers/subcategory.controler.js';
// import { } from '../controllers/subcategory.controler.js';

const router = express.Router();

// Get all subcategories
router.get('/', allSubcategory);

// Get subcategory by ID
router.get('/:id', getSubcategoryById);

// Create a new subcategory
router.post('/', createSubcategory);

// Update subcategory by ID
router.put('/:id', updateSubcategory);

// Delete subcategory by ID
router.delete('/:id', deleteSubcategory);

export default router;
