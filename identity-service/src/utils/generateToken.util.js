import jwt from "jsonwebtoken"
import crypto from "crypto"
import { RefreshToken } from "../models/RefreshToken.model.js"

export const generateTokens = async(user) => {
    const accessToken = jwt.sign({
        id: user._id,
        username: user.username
    }, process.env.JWT_SECRET, {expiresIn: process.env.ACCESS_TOKEN_EXPIRY})

    const refreshToken = crypto.randomBytes(40).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + process.env.REFRESH_TOKEN_EXPIRY)

    await RefreshToken.create({token: refreshToken, user: user._id, expiresAt})

    return {accessToken, refreshToken}
};