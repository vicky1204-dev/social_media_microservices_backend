import mongoose, { Schema } from "mongoose";

const searchPostSchema = new Schema(
  {
    postId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

searchPostSchema.index({ content: "text" });
searchPostSchema.index({ createdAt: -1 });

export const Search = mongoose.model("Search", searchPostSchema)