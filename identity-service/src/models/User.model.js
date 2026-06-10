import mongoose, { Schema } from "mongoose";
import argon2 from "argon2";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
    //IMP if you are using async function here as callback, no need to use next() as here mongoose will pass undefined as argument to this function so async function(next) will give u error on using next() inside this func, u can use it if the function isnt async
  if (!this.isModified("password")) return;
  this.password = await argon2.hash(this.password);
});

userSchema.methods.comparePassword = async function (clientPassword){
  try {
    return await argon2.verify(this.password, clientPassword);
  } catch (error) {
    throw error;
  }
}

userSchema.index({ username: "text" });

export const User = mongoose.model("User", userSchema);
