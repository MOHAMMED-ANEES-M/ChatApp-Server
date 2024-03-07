const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
const fs = require('fs'); 
const path = require('path');
const generateOTP = require('../middleware/otpGenerator');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });


// POST /api/users/register
const registerUser = asyncHandler(async (req,res) => {
    const { firstname, lastname, email, password } = req.body
    if( !firstname || !lastname || !email || !password ) {
        res.status(400);
        throw new Error('All fields are mandatory')
    }
    const userExist = await User.findOne({email})
    if (userExist) {
        res.status(400);
        throw new Error('User already registered')
    }
    const hashedPassword = await bcrypt.hash( password, saltRounds )
    console.log('Hashed Password:',hashedPassword);
    const user = await User.create({ firstname, lastname, email, password: hashedPassword })
    if (user) {   
        console.log('User created',user);
        res.status(201).json(user)
    } else {
        res.status(400);
        throw new Error('User data is invalid')
    }
})

// POST /api/users/login
const loginUser = asyncHandler(async (req,res) => {
    const { email, password } = req.body
    if (!email || !password) {
        res.status(400)
        throw new Error("All fields are mandatory")
    }
    const user = await User.findOne({email})
    if ( user && (await bcrypt.compare( password, user.password ))) {
        const accessToken = jwt.sign(
             { user: { email: user.email, id: user.id }},
             process.env.ACCESS_TOKEN_SECRET,
             {expiresIn: '48h'})
        res.status(200).json({ token: accessToken, success: true, user })
    } else {
        res.status(404);
        throw new Error("Email or Password is not valid")
    }
})

// GET /api/users/current
const currentUser = asyncHandler(async (req,res) => {
    const id = req.user.id
    const user = await User.findById(id)
    res.json(user)
    // console.log('Current user:',user);
})

// GET /api/users/
const getAllUsers = async (req,res) => {
    try{
    console.log('users');
    const users = await User.find()
    // console.log(users);
    res.json(users)
    } catch(err) {
        console.log(err);
    }
}

// PUT /api/users/update-image
const updateUserImage = asyncHandler(async (req, res) => {
    console.log('Request body:', req.body);
    const userId = req.user.id;
    const {image} = req.body

    if (!image) {
        res.status(400);
        throw new Error("Image is not valid")
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { image: image } },
      { new: true }
    );

    if (updatedUser) {
        res.status(200).json({ success: true, user: updatedUser });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});


// PUT /api/users/update-profile
const updateUserProfile = asyncHandler(async (req,res) => {

    const id = req.user.id
    const { firstname, lastname, email, bio } = req.body

    if ( !firstname || !lastname || !email || !bio ) {
        res.status(400);
        throw new Error('All fields are mandatory');
    }

    const updatedProfile = await User.findByIdAndUpdate( id, req.body, {new: true} )
    if(updatedProfile) {
        res.status(200).json({ success: true, user: updatedProfile });    
    } else {
        res.status(404);
        throw new Error('User not found');
    }

})


// PUT /api/users/change-password
const changeUserPassword = asyncHandler(async (req,res) => {

    console.log(req.body,'change password req.body');
    const id = req.user.id
    const { password, newpassword, confnewpassword } = req.body

    if ( !password || !newpassword || !confnewpassword ) {
        res.status(400);
        throw new Error('All fields are mandatory');
    }

    if ( newpassword !== confnewpassword ) {
        res.status(400);
        throw new Error('Password not matching');
    }

    const user = await User.findById(id)
    if (user) {
        const passwordMatch = await bcrypt.compare(password,user.password)
        console.log(passwordMatch,'passMatch');
        if (passwordMatch) {
            if (await bcrypt.compare( newpassword, user.password )) {
                res.status(400);
                throw new Error('new password and current password should not be same');
            }
            const hashedPassword = await bcrypt.hash( newpassword, saltRounds )
            const changedPassword = await User.findByIdAndUpdate(id,{password: hashedPassword})
            if (changedPassword) {
                console.log(changedPassword);
                res.status(200).json({ success: true, user: changedPassword });
            }
        } else {
        res.status(400);
        throw new Error('Current Password is incorrect');
        }
    } else {
        res.status(404);
        throw new Error('User not found');
    }
})


  // POST /api/users/send-OTP
  const sendOTP = asyncHandler(async (req, res) => {
        console.log(req.body,'sendotp body');
      const user = await User.findById(req.user.id);
      const email = req.body.email;
  
      const otp = generateOTP();
      user.otp = otp;
      user.otpTimestamp = new Date();
      await user.save();
  
      const mailOptions = {
        to: email,
        subject: 'OTP for email verification on ChatApp',
        html: ` <p style='color: white;'>Dear ${user.firstname},</p>
                <p style='color: white;'>Thank you for registering with ChatApp.</p><br/>
                <p style='color: white;'>Enter the below mentioned one time password to verify your email address.</p>
                <h3 style='font-weight: bold; text-align: center; color: white;'>OTP: ${otp}</h3><br/><br/>
                <p style='color: white;'>Thank you,</p>
                <p style='font-weight: bold; color: white;'>ChatApp Team</p><br/><br/>
                <p style='font-weight: bold; color: white;'>Disclaimer: This is a system-generated email. Please do not reply to this email.</p> `,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).json({ error: 'Failed to send OTP' });
        }
        res.json({ success: 'OTP sent successfully' });
        // You may want to remove the res.render('otp') line since you're sending JSON response.
      });
    
  });
  

    // POST /api/users/verify-OTP
  const verifyOTP = asyncHandler(async (req, res) => {
      const user = await Customer.findById(req.body.userId);
      if (req.body.otp.otp === user.otp) {
        res.status(200).json({ success: true });
      } else {
        res.status(500).json({ msg: 'Incorrect OTP' });
      }
  });


module.exports = { registerUser, loginUser, currentUser, getAllUsers, updateUserImage, updateUserProfile, changeUserPassword, sendOTP, verifyOTP }