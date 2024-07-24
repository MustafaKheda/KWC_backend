import mongoose, { Schema } from "mongoose";

const addressSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    area: {
        type: String,
        required: true,
    },
    block: {
        type: String,
        required: true,
    },
    street:{
        type:String,
        required:true,
    },
    avenue: {
        type: String,
    },
    houseNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
    },
    addressType: {
        type: String,
        required: true,
        default: "Home"
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required:true
    }
}, {
    timestamps: true
})

export const Address = mongoose.model("Address", addressSchema)