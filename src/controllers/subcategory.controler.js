import { Subcategory } from "../models/subcategory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
// --------- Subcategory Routes ---------
// Get all subcategories
const allSubcategory = asyncHandler(async (req, res) => {
    const subcategories = await Subcategory.find();
    if (subcategories.length <= 0) {
        return res.status(200).json(new ApiResponse(200, "", "No subcategories found"));
    }
    return res.status(200).json(new ApiResponse(200, { subcategories }, "Subcategories fetched successfully"));
});

// Get subcategory by ID
const getSubcategoryById = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
        throw new ApiError(404, "Subcategory not found");
    }
    return res.status(200).json(new ApiResponse(200, { subcategory }, "Subcategory fetched successfully"));
});

// Create a new subcategory
const createSubcategory = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) {
        throw new ApiError(400, "Subcategory Name is Required");
    }

    const existedSubcategory = await Subcategory.findOne({ name });
    if (existedSubcategory) {
        throw new ApiError(400, "Subcategory Already Exists");
    }

    const createdSubcategory = await Subcategory.create({
        name,
    });

    return res.status(201).json(new ApiResponse(201, { subcategory: createdSubcategory }, "Subcategory Created Successfully"));
});

// Update a subcategory by ID
const updateSubcategory = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const subcategory = await Subcategory.findById(req.params.id);

    if (!subcategory) {
        throw new ApiError(404, "Subcategory not found");
    }

    subcategory.name = name || subcategory.name;
    // subcategory.subcategory_description = subcategory_description || subcategory.subcategory_description;

    await subcategory.save();
    return res.status(200).json(new ApiResponse(200, { subcategory }, "Subcategory Updated Successfully"));
});

// Delete a subcategory by ID
const deleteSubcategory = asyncHandler(async (req, res) => {
    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);

    if (!subcategory) {
        throw new ApiError(404, "Subcategory not found");
    }

    return res.status(200).json(new ApiResponse(200, "", "Subcategory Deleted Successfully"));
});

export {
    createSubcategory,
    allSubcategory,
    getSubcategoryById,
    updateSubcategory,
    deleteSubcategory,
}