import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Address } from "../models/address.model.js";

const registerAddress = asyncHandler(async (req, res) => {
   const { firstName, lastName, area, block, street, avenue, houseNumber, email:newEmail, userId, addressType } = req.body
   if (!firstName) {
      throw new ApiError(400, `First name is Required`)
   }

   if ([area, block, street, avenue, houseNumber].some((item) => !item)) {
      throw new ApiError(400, `All the Address related fields are required`)
   }
   if (!email) {
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
      { email:newEmail },
      { new: true, runValidators: true } // Options to return the updated document and run validators
    );
    console.log(updatedUser) 
   const newAddress = await Address.create({
      firstName, lastName, area, block, street, avenue, houseNumber, userId, addressType
   })
   return res.status(201).json(new ApiResponse(200, newAddress, "Address Registered successfully"))
})


export { registerAddress }