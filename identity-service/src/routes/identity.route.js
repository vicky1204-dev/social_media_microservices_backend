import {Router} from "express"
import {logoutUser, refreshAccessToken, userLogin, userRegistration} from "../controllers/identity.controller.js"

const router = Router()

router.post("/register",userRegistration)
router.post("/login",userLogin)
router.post("/refresh-token", refreshAccessToken)
router.post("/logout", logoutUser)

export default router