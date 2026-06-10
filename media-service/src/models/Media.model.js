import mongoose, {Schema} from "mongoose"

const mediaSchema = new Schema({
    publicId : {
        type: String,
        required: true
    },
    originalName : {
        type: String,
        required: true
    },
    mimeType : {
        type: String,
        required: true
    },
    url : {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true})

export const Media = mongoose.model("Media", mediaSchema)