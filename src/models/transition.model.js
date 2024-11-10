import mongoose from "mongoose";

const transitionHistorySchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  old_status: { type: String, required: true },
  new_status: { type: String, required: true },
  transition_time: { type: Date, default: Date.now },
  notes: { type: String, default: "" }, // Optional field for notes related to the transition
});

const TransitionHistory = mongoose.model(
  "TransitionHistory",
  transitionHistorySchema
);

export { TransitionHistory };
