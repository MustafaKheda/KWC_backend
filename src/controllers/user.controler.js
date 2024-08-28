import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Address } from "../models/address.model.js";

const registerUser = asyncHandler(async (req, res) => {
  const { mobileNumber, email } = req.body;
  if (!mobileNumber) {
    throw new ApiError(400, "Mobile Number is required");
  }
  let latestAddress = {
    firstName: "",
    lastName: "",
    area: "",
    block: "",
    street: "",
    avenue: "",
    houseNumber: "",
    email: "",
    addressType: "Home",
  };
  const existedUser = await User.findOne({ mobileNumber });

  if (existedUser) {
    const addresses = await Address.find({ userId: existedUser._id })
      .select("-userId -__v")
      .exec();

    if (addresses.length > 0) {
      latestAddress = addresses[addresses.length - 1];
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { user: existedUser, address: latestAddress },
          "User Login successfully"
        )
      );
  }
  const user = await User.create({
    mobileNumber: mobileNumber,
    email,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, {user,address:latestAddress}, "User Registered successfully"));
});

export { registerUser };
