import mongoose from "mongoose";
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${process.env.MONGO_DB}`,
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log("\n MongoDB Connected: ", connectionInstance.connection.host);
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
    process.exit(1);
  }
};
``;
export default connectDB;
