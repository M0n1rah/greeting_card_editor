import mongoose, { Schema } from "mongoose";

const cardSchema = new mongoose.Schema({
  r2Url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Card = mongoose.model("Card", cardSchema);