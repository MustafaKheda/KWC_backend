import mongoose, {Schema} from "mongoose";

const userSchema = new Schema({
    mobileNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },
      email:{
        type: String,
        trim: true,
      }
},{timestamps:true})

export const User = mongoose.model("User",userSchema)