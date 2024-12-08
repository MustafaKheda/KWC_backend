import mongoose, { Schema } from "mongoose";

const brandSchema = new Schema(
    {
        name: {
            type: String,
            unique: true,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        logo: {
            type: String, // URL for the brand logo
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true, // Marks whether the brand is active
        },
    },
    { timestamps: true }
);

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
