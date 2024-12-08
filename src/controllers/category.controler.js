import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";
import { Subcategory } from "../models/subcategory.model.js";

// --------- Category Routes ---------

// Get all categories
const allCategory = asyncHandler(async (req, res) => {
    const categories = await Category.find().populate('subcategories');
    if (categories.length <= 0) {
        return res.status(200).json(new ApiResponse(200, "", "No categories found"));
    }
    return res.status(200).json(new ApiResponse(200, { categories }, "Categories fetched successfully"));
});

// Get category by ID
const getCategoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id).populate('subcategories');
    if (!category) {
        throw new ApiError(404, "Category not found");
    }
    return res.status(200).json(new ApiResponse(200, { category }, "Category fetched successfully"));
});

// Create a new category
const createCategory = asyncHandler(async (req, res) => {
    const { name, category_description, subcategories } = req.body;

    if (!name) {
        throw new ApiError(400, "Category Name is Required");
    }

    const existedCategory = await Category.findOne({ name });
    if (existedCategory) {
        throw new ApiError(400, "Category Already Exists");
    }
    let subcategoryIds = []
    if (subcategories && subcategories.length > 0) {
        for (let subcategory of subcategories) {
            // Check if the subcategory already exists
            const existedSubcategory = await Subcategory.findOne({ name: subcategory.name });

            if (existedSubcategory) {
                // If it exists, use its ID
                subcategoryIds.push(existedSubcategory._id);
            } else {
                // If not, create a new subcategory
                const createdSubcategory = await Subcategory.create(subcategory);
                subcategoryIds.push(createdSubcategory._id);
            }
        }
    }

    const createdCategory = await Category.create({
        name,
        category_description,
        subcategories: subcategoryIds,
    });

    return res.status(201).json(new ApiResponse(201, { category: createdCategory }, "Category Created Successfully"));
});

// Update a category by ID
const updateCategory = asyncHandler(async (req, res) => {
    const { name, category_description, subcategories } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    // Update category details
    category.name = name || category.name;
    category.category_description = category_description || category.category_description;

    let subcategoryIds = [];
    if (subcategories && subcategories.length > 0) {
        for (let subcategory of subcategories) {
            // Check if the subcategory already exists
            const existedSubcategory = await Subcategory.findOne({ name: subcategory.name });

            if (existedSubcategory) {
                // If it exists, use its ID
                subcategoryIds.push(existedSubcategory._id);
            } else {
                // If not, create a new subcategory
                const createdSubcategory = await Subcategory.create(subcategory);
                subcategoryIds.push(createdSubcategory._id);
            }
        }
    }

    // Update subcategories for the category
    category.subcategories = subcategoryIds.length > 0 ? subcategoryIds : category.subcategories;

    await category.save();

    return res.status(200).json(new ApiResponse(200, { category }, "Category Updated Successfully"));
});


// Delete a category by ID
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res.status(200).json(new ApiResponse(200, "", "Category Deleted Successfully"));
});

export {
    createCategory,
    allCategory,
    getCategoryById,
    updateCategory,
    deleteCategory,
};