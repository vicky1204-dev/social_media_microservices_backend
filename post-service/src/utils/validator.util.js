import joi from "joi"

export const validateCreatePost = (data)=> {
    const schema = joi.object({
        content: joi.string().min(3).max(500).required(),
        mediaIds: joi.array().optional()
    })

    return schema.validate(data)
}
