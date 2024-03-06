const express = require('express')
const router = express.Router()
const { registerUser, loginUser, currentUser, getAllUsers, updateUserImage, updateUserProfile } = require('../controllers/userController');
const verifyToken = require('../middleware/verifyTokenHandler');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


router.post("/register", registerUser);
router.post("/login", loginUser)
router.get("/current", verifyToken, currentUser)
router.get("/", verifyToken, getAllUsers)
router.put("/update-image", verifyToken, updateUserImage)
router.put("/update-profile", verifyToken, updateUserProfile)


module.exports = router