import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Address } from "../models/address.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const registerAddress = asyncHandler(async (req, res) => {
   const { firstName, lastName, area, block, street, avenue, houseNumber, email: newEmail, userId, addressType } = req.body
   if (!firstName) {
      throw new ApiError(400, `First name is Required`)
   }

   if ([area, block, street, avenue, houseNumber].some((item) => !item)) {
      throw new ApiError(400, `All the Address related fields are required`)
   }
   if (!newEmail) {
      throw new ApiError(400, `Email is Required`)
   }
   const existedAddress = await Address.findOne({
      area,
      block,
      street,
      houseNumber,
      userId
   });

   if (existedAddress) {
      throw new ApiError(409, "This address is already registered to the specified user.");
   }
   const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email: newEmail },
      { new: true, runValidators: true } // Options to return the updated document and run validators
   );
   console.log(updatedUser)

   const newAddress = await Address.create({
      firstName, lastName, area, block, street, avenue, houseNumber, userId, addressType
   })
   return res.status(201).json(new ApiResponse(200, newAddress, "Address Registered successfully"))
})

// const getAllAddress = asyncHandler(async (req, res) => {
//    const userId = req.query.user_id
//    if (!userId) {
//       throw new ApiError(400, "User id is Required")
//    }
//    const user = await User.findById(userId).exec()
//    console.log(user)
//    if (!user) {
//       throw new ApiError(400, "Wrong User Id")
//    }
//    res.status(201).json(new ApiResponse(200,{userData:user}, "No Records Found"))

//    // const address = await Address.find({ userId }).select("-userId -__v")
//    // if (!address) {
//    //    res.status(201).json(new ApiResponse(200,'', "No Records Found"))
//    // }
//    // res.status(201).json(new ApiResponse(200, {addresses: address }, "All User Address Found Successfully"))
//    return
// })
const getAllAddress = asyncHandler(async (req, res) => {
   const userId = req.params.user_id
   // const { user_id: userId } = req.query;
 
   if (!userId) {
    throw new ApiError(400, "User ID is required")
   }

   if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw  new ApiError(400, "Invalid User ID format");
    }
   const user = await User.findOne({_id:userId}).exec();
   if (!user) {
     throw new ApiError(404, "Wrong User ID");
   } 
   const addresses = await Address.find({ userId }).select("-userId -__v").exec();
   
   if (!addresses.length) {
     return res.status(200).json(new ApiResponse(200, [], "No records found"));
   }
 
   return res.status(200).json(new ApiResponse(200, { addresses }, "All user addresses found successfully"));
 });


export { registerAddress, getAllAddress }