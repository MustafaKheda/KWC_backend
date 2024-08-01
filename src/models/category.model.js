import mongoose,{Schema} from "mongoose";
const subcatgorySchema = new Schema({
    name:{
        type:String,
        trim:true,
        index:true
    }
})
export const SubCategory = mongoose.model("Subcategory",subcatgorySchema)   
const categorySchema = new Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        unique:true,   
    },
    category_description:{
        type:String,
        trim:true
    },
    subcategories:[subcatgorySchema]
})

export const Category = mongoose.model("Category",categorySchema)