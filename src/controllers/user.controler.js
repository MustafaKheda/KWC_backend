import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";   
import { ApiResponse } from "../utils/ApiResponse.js";
import { Address } from "../models/address.model.js";

const registerUser = asyncHandler(async(req,res)=>{
    const { mobileNumber,email } = req.body
    if(!mobileNumber){
        throw new ApiError(400,"Mobile Number is required")
    }
    const existedUser = await User.findOne({mobileNumber});
    if(existedUser){
        const address = await Address.find({userId:existedUser._id}).select("-userId -__v")
        res.status(201).json(new ApiResponse(200,{user:existedUser,addresses:address},"User Login successfully"))
        return 
    }

    const user = await User.create({
        mobileNumber:mobileNumber,
        email
    })
   return res.status(201).json(new ApiResponse(200,user,"User Registered successfully"))

})


export {registerUser}