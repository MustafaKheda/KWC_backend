import mongoose,{Schema} from "mongoose";
const categorySchema = new Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        unique:true,  
        index:true, 
    },
    category_description:{
        type:String,
        trim:true
    },
    subcategories:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory'
    }]
})

export const Category = mongoose.model("Category",categorySchema)