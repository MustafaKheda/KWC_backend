import mongoose, { Schema } from "mongoose"

const subcatgorySchema = new Schema({
    name:{
        type:String,
        trim:true,
        index:true
    }
})

export const Subcategory = mongoose.model("Subcategory",subcatgorySchema) 