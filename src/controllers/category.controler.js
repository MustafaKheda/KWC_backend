import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";


const createCategory = asyncHandler(async (req, res) => {
    const { name, category_description, subcategories } = req.body

    if (!name) {
        throw new ApiError(400, "Category Name is Required")
    }

    const existedCategory = await Category.findOne(
        { name }
    )

    if (existedCategory) {
        throw new ApiError(401, "Category Already Existed")
    }

    const createdCategory = await Category.create({
        name,
        category_description,
        subcategories
    })

    return res.status(200).json(new ApiResponse(200, { category: createdCategory }, "Category Created Successfully"))
})
const allCategory = asyncHandler(async (req, res) => {
   
    const allCategory = await Category.find()
    if(allCategory.length <= 0 ){
       return res.status(200).json(new ApiResponse(200, "", "No data found"))
    }
    return res.status(200).json(new ApiResponse(200, { categories: allCategory }, "All Categorys fetched successfully"))
})

export { createCategory,allCategory }