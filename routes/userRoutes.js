const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/verifyTokenHandler');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { 
    registerUser, 
    registerGoogleUser, 
    loginUser, 
    currentUser, 
    getAllUsers, 
    updateUserImage, 
    updateUserProfile, 
    changeUserPassword, 
    sendOTP, 
    verifyOTP, 
    updateUserEmail, 
    verifyRegistration,
    getUserById
} = require('../controllers/userController');


router.post("/register", registerUser);
router.post("/google-register", registerGoogleUser);
router.post("/login", loginUser)
router.get("/current", verifyToken, currentUser)
router.get("/", verifyToken, getAllUsers)
router.get("/:id", verifyToken, getUserById)
router.put("/update-image", verifyToken, updateUserImage)
router.put("/update-profile", verifyToken, updateUserProfile)
router.put("/change-password", verifyToken, changeUserPassword)
router.post("/send-OTP", verifyToken, sendOTP)
router.post("/verify-OTP", verifyToken, verifyOTP)
router.put("/update-email", verifyToken, updateUserEmail)
router.post("/verify-registration", verifyRegistration)


module.exports = router