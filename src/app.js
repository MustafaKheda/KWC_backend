import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js"
import addressRouter from "./routes/address.route.js";
import categoryRouter from "./routes/category.route.js";
import productRouter from "./routes/product.route.js";
import orderRouter from "./routes/order.route.js";


const app = express();

app.use(cors({
    origin:'*'
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.get("/", (req,res)=>{
    res.status(200).json({
        message:"Hello World"
    })
})
app.use("/api/v1/users", userRouter)
app.use("/api/v1/address", addressRouter)
app.use("/api/v1/category",categoryRouter)
app.use("/api/v1/product",productRouter)
app.use("/api/v1/order",orderRouter)



export {app};