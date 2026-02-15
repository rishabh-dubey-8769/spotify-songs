const express=require('express')
const authController=require('../controllers/auth.controller')

const router=express.Router()

router.post('/register',authController.registerUser)
router.post('/login',authController.loginUser)
router.post('/logout',authController.logoutUser)
router.get('/count', authController.getUserCount);
router.get('/me', authController.getMe);
router.post("/send-otp-register",authController.sendOtpRegister);
router.post("/verify-otp-register",authController.verifyOtpRegister);

router.post("/send-otp-forgot",authController.sendOtpForgot);
router.post("/reset-password",authController.resetPassword);


module.exports=router



