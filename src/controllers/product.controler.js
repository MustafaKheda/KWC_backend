import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

function calculateDiscountedPrice(pricing, promotions) {
    // Check if base_price is a valid number
    if (typeof pricing.base_price !== 'number' || isNaN(pricing.base_price) || pricing.base_price <= 0) {
        throw new ApiError('INVALID_BASE_PRICE', 'Invalid base price. Please provide a positive number.',);
    }

    // Check if discount_percentage is a valid number
    if (typeof promotions.discount_percentage !== 'number' || isNaN(promotions.discount_percentage) || promotions.discount_percentage < 0 || promotions.discount_percentage > 100) {
        throw new ApiError(403, 'Invalid discount percentage. Please provide a number between 0 and 100.');
    }

    // Return the discounted price
    return Math.round(pricing.base_price - (pricing.base_price * promotions.discount_percentage / 100));;
}

export const createProduct = asyncHandler(async (req, res) => {
    const { name, description, category_id, subcategory_id, pricing, inventory, images, attributes, promotions } = req.body;

    // Check required fields
    if (!name) {
        throw new ApiError(400, 'Missing required field: name');
    }
    if (!description) {
        throw new ApiError(400, 'Missing required field: description');
    }
    if (!category_id) {
        throw new ApiError(400, 'Missing required field: category_id');
    }
    if (!pricing) {
        throw new ApiError(400, 'Missing required field: pricing');
    }
    if (!inventory) {
        throw new ApiError(400, 'Missing required field: inventory');
    }
    if (!images) {
        throw new ApiError(400, 'Missing required field: images');
    }


    // Validate pricing
    if (!pricing.base_price || !pricing.cost || !pricing.currency) {
        throw new ApiError(400, 'Missing required pricing fields');
    }

    // Validate inventory
    if (!inventory.stock_quantity) {
        throw new ApiError(400, 'Missing required inventory fields');
    }
    // Validate images
    if (!images.main_image) {
        throw new ApiError(400, 'Missing main image');

    }
    if (promotions && promotions.discount_percentage) {
        pricing.discounted_price = calculateDiscountedPrice(pricing, promotions);
    }else{
        pricing.discounted_price = pricing.base_price
    }
   
    const product = new Product({
        name,
        description,
        category_id,
        subcategory_id,
        pricing,
        inventory,
        images,
        attributes,
        promotions
    });
    await product.save();
    const newProduct = await Product.findById(product._id).select('-isActive -pricing.cost -attributes.weight -promotions.sale_end_date')
    res.status(201).json(new ApiResponse(201, newProduct, 'Product created successfully'));
});

export const allProduct = asyncHandler(async (req, res) => {
    const products = await Product.find({isActive:true}).select('-pricing.cost -attributes.weight -promotions.sale_end_date')
    if (!products || products.length < 1) {
        return res.status(404).json(new ApiResponse(404, [], 'Product not found'));
    }
    res.status(200).json(new ApiResponse(200, products, 'Fetched All Product'));
});

export const productByCategory = asyncHandler(async (req, res) => {
    const category_id = req.params.id

    if (!category_id) {
        throw new ApiError(400, 'Category ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(category_id)) {
        throw new ApiError(400, "Invalid Category ID format");
    }
    const products = await Product.find({ category_id,isActive:true }).select('-isActive -pricing.cost -attributes.weight -promotions.sale_end_date')

    if (!products || products.length < 1) {
        return res.status(404).json(new ApiResponse(404, [], 'Product not found'));
    }
    res.status(201).json(new ApiResponse(201, products, 'Fetched Product by Category'));
});

export const productBySubCategory = asyncHandler(async (req, res) => {
    const subcategory_id = req.params.id; // Access route parameter 'id'

    if (!subcategory_id) {
        throw new ApiError(400, 'SubCategory ID is required');
    }
    if (!mongoose.Types.ObjectId.isValid(subcategory_id)) {
        throw new ApiError(400, "Invalid Subcategory ID format");
    }
    const products = await Product.find({ subcategory_id,isActive:true })
        .select('-pricing.cost -attributes.weight -promotions.sale_end_date');

    if (!products || products.length < 1) {
        return res.status(404).json(new ApiResponse(404, [], 'Product not found'));
    }
   
    res.status(200).json(new ApiResponse(200, products, 'Fetched Product by SubCategory'));
});


