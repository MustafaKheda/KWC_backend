import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js"
import addressRouter from "./routes/address.route.js";
const app = express();

app.use(cors())
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

export {app};