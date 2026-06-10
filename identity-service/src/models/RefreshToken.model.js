import mongoose, {Schema} from "mongoose"

const refreshTokenSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true
    }, 
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    } 
}, {timestamps: true})

refreshTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0})

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema)