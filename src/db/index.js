import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `mongodb+srv://mustafakheda:O3ApbIdRBLc3EW6x@backend.omfjktd.mongodb.net/beautifyBackend`
    );
    console.log("\n MongoDB Connected: ", connectionInstance.connection.host);
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
    process.exit(1);
  }
};
export default connectDB;