import mongoose, { Schema } from "mongoose";
const pricingSchema = new Schema({
    size:Number,    
    base_price: {
        type: Number,
        required: true,
        trim: true,
        min: 0,
    },
    discounted_price: {
        type: Number,
        trim: true,
    },
    cost: {
        type: Number,
        required: true,
        trim: true,
        min: 0,
    },
    
}, { _id: false });

const inventorySchema = new Schema({
    stock_quantity: {
        type: Number,
        required: true,
        trim: true,
        index: true,
    },
    supplier: {
        type: String,
        trim: true,
    }
}, { _id: false });

const imageSchema = new Schema({
    main_image: {
        type: String, // Image URL should be a String
        required: true,
    },
    additional_images: [
        { type: String } // Ensure the array contains strings
    ]
}, { _id: false });

const productSchema = new Schema({
    name: {
        type: String,
        unique: true,
        trim: true,
        index: true,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    category_id: {
        type: Schema.Types.ObjectId,
        ref: "Category"
    },
    subcategory_id: {
        type: Schema.Types.ObjectId,
        ref: "Subcategory"
    },
    pricing: [pricingSchema], // Embed the pricing schema
    inventory: inventorySchema, // Embed the inventory schema
    images: imageSchema, // Embed the image schema
    attributes: {
        currency: {
            type: String,
            required: true,
            default: "KWD",
        },
        size_unit: {
            type: String,
        },
    },
    customer_reviews: {
        ratings: {
            type: Number,
        },
        review: [{
            user_id: {
                type: Schema.Types.ObjectId,
                ref: "User"
            },
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
            },
        }],
    },
    promotions: { 
        discount_percentage: {
            type: Number,
            min: 0,
            max: 100,
        },
        sale_end_date: {
            type: Date,
        },
    }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

export default Product;
