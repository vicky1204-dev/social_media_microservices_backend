import { RefreshToken } from "../models/RefreshToken.model.js";
import { User } from "../models/User.model.js";
import { generateTokens } from "../utils/generateToken.util.js";
import { logger } from "../utils/logger.util.js";
import {
  validateRegistration,
  validateLogin,
} from "../utils/validator.util.js";

const userRegistration = async (req, res) => {
  logger.info("Registration Endpoint Hit...");
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { username, password, email } = req.body;
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      logger.warn("User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    user = await User.create({ username, email, password });
    logger.info(`User saved successfully ${user._id}`);

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const userLogin = async (req, res) => {
  logger.info("Login endpoint hit...");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn(`Validation Error: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Invalid User");
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn("Invalid Password");
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(200).json({
      success: true,
      message: "User login successful",
      userId: user._id,
      refreshToken,
      accessToken,
    });
  } catch (error) {
    logger.error("Login error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const refreshAccessToken = async (req, res) => {
  logger.info("Refresh Access Token endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Missing Refresh Token");
      return res.status(400).json({
        success: false,
        message: "Refresh Token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or Expired refresh token");
      return res.status(401).json({
        success: false,
        message: "Invalid or Expired refresh token",
      });
    }

    const user = await User.findById(storedToken.user)
    if(!user){
       logger.warn("No user found");
      return res.status(404).json({
        success: false,
        message: "No user found",
      });
    }

   const {accessToken: newAccessToken, refreshToken: newRefreshToken} = await generateTokens(user)

   // delete the old refresh token
   await RefreshToken.deleteOne({_id: storedToken._id})

   res.json({
    refreshToken: newRefreshToken,
    accessToken: newAccessToken
   })

  } catch (error) {
    logger.error("Refresh Access Token error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const logoutUser = async (req, res)=>{
  logger.info("Logout endpoint hit...");
  try {
    const {refreshToken} = req.body
    if(!refreshToken) {
        logger.warn("Missing Refresh Token");
      return res.status(400).json({
        success: false,
        message: "Refresh Token missing",
      });
    }

    await RefreshToken.findOneAndDelete({token: refreshToken})
    logger.info("RefreshToken deleted and user has been logged out")

    res.json({
      success: true,
      message: "Logged out successfully"
    })
  } catch (error) {
    logger.error("Logout error occurred", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export { userRegistration, userLogin, refreshAccessToken, logoutUser };
