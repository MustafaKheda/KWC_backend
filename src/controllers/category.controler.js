import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";
import { Subcategory } from "../models/subcategory.model.js";


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

    let subcategoryIds = [];
    if (subcategories && subcategories.length > 0) {
        const createdSubcategories = await Subcategory.insertMany(subcategories);
        subcategoryIds = createdSubcategories.map(subcategory => subcategory._id);
    }

    const createdCategory = await Category.create({
        name,
        category_description,
        subcategories:subcategoryIds
    })

    return res.status(200).json(new ApiResponse(200, { category: createdCategory }, "Category Created Successfully"))
})
const allCategory = asyncHandler(async (req, res) => {
   
    const allCategory = await Category.find().populate('subcategories');
    if(allCategory.length <= 0 ){
       return res.status(200).json(new ApiResponse(200, "", "No data found"))
    }
    Response(res,200,"sdfsdf",{fsdffsdf})
    return res.status(200).json(new ApiResponse(200, { categories: allCategory }, "All Categorys fetched successfully"))
})

export { createCategory,allCategory }