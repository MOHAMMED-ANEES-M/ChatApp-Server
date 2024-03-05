const express = require('express')
const router = express.Router()
const { registerUser, loginUser, currentUser, getAllUsers } = require('../controllers/userController');
const verifyToken = require('../middleware/verifyTokenHandler');


router.post("/register", registerUser);
router.post("/login", loginUser)
router.get("/current", verifyToken, currentUser)
router.get("/", verifyToken, getAllUsers)


module.exports = router