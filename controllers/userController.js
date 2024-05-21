const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const saltRounds = 10;
var jwt = require('jsonwebtoken');
const fs = require('fs'); 
const path = require('path');
const generateOTP = require('../middleware/otpGenerator');
const nodemailer = require('nodemailer');
const axios = require('axios');


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
    const { firstname, lastname, email, password, confirmpassword } = req.body
    if( !firstname || !lastname || !email || !password || !confirmpassword ) {
        res.status(400);
        throw new Error('All fields are mandatory')
    }
    if (password !== confirmpassword) {
        res.status(400);
        throw new Error('Password mismatch')
    }
    const userExist = await User.findOne({email})
    if (userExist) {
        res.status(400);
        throw new Error('User already registered, Please Sign in')
    }
    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash( password, saltRounds )
    console.log('Hashed Password:',hashedPassword);
    const user = await User.create({ firstname, lastname, email, password: hashedPassword, otp, otpTimestamp: new Date() })
    if (user) {   
        console.log('User created',user);
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
                res.status(500);
                throw new Error('Failed to send OTP');
            }
            res.status(200).json({ success: true, message: "OTP sent successfully",user });
          });
    } else {
        res.status(400);
        throw new Error('User data is invalid')
    }
})


// POST /api/users/google-register
const registerGoogleUser = asyncHandler(async (req,res) => {
    const { firstname, email, image, verifyEmail } = req.body
    console.log(req.body,'google signup');
    const userExist = await User.findOne({email})
    let base64Image = null;
    if (image) {
        base64Image = await fetchImageAsBase64(image);
    }
    if (!userExist) {
        console.log('no user');
        const user = await User.create({ firstname, email, image: base64Image, verifyEmail })
        if (user) {
            const accessToken = jwt.sign(
                { user: { email: user.email, id: user.id }}, process.env.ACCESS_TOKEN_SECRET
            )
            res.status(200).json({ success: true, user, token: accessToken });
            console.log('Registration Success with Google');
        }
    } else {
        console.log(userExist.email, userExist.id,'userexist');
        const accessToken = jwt.sign(
            { user: { email: userExist.email, id: userExist.id }}, process.env.ACCESS_TOKEN_SECRET
        )
        console.log(accessToken,'accesstoken');
        res.status(200).json({ success: true, user: userExist, token: accessToken });
        console.log('Registration(Exist) Success with Google');
    }
})

const fetchImageAsBase64 = async (imageUrl) => {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      return `data:${response.headers['content-type']};base64,${base64Image}`;
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  };

// POST /api/users/login
const loginUser = asyncHandler(async (req,res) => {
    const { email, password } = req.body
    if (!email || !password) {
        res.status(400)
        throw new Error("All fields are mandatory")
    }
    const user = await User.findOne({email})
    console.log(user,'login user');
    if ( user && (await bcrypt.compare( password, user.password ))) {
        const accessToken = jwt.sign(
             { user: { email: user.email, id: user.id }},
             process.env.ACCESS_TOKEN_SECRET,)
             if (user.verifyEmail) {
                console.log('email verified');
                res.status(200).json({ token: accessToken, success: true, user })
             } else {
                console.log('not verified email');
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
                        res.status(500);
                        throw new Error('Failed to send OTP');
                    }
                    res.json({notVerified: true, message:"OTP sent successfully for email verification", token: accessToken, user})
                  });
             }
    } else {
        res.status(404);
        throw new Error("Email or Password is not valid")
    }
})

// GET /api/users/current
const currentUser = asyncHandler(async (req,res) => {
    const id = req.user.id
    const user = await User.findById(id)
    if(user) {
        // console.log(user);
        res.json(user)
    } else {
        res.status(404);
        throw new Error('User not found');
    }
})

// GET /api/users/
const getAllUsers = async (req,res) => {
    console.log('users');
    const users = await User.find()
    if(users) {
        // console.log(users);
        res.json(users)
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}


// GET /api/users/:id
const getUserById = async (req,res) => {
    console.log('user by id');
    const id = req.params.id
    const user = await User.findById(id)
    if(user) {
        // console.log(user);
        res.json({ success:true, user })
    } else {
        res.status(404);
        throw new Error('User not found');
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
    const { firstname, lastname, bio } = req.body

    if ( !firstname || !lastname || !bio ) {
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


// PUT /api/users/update-email
const updateUserEmail = asyncHandler(async (req, res) => {
    const id = req.user.id;
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error("Email is required");
    }

    const user = await User.findById(id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.email = email;
    const updatedEmail = await user.save();

    if (updatedEmail) {
        res.status(200).json({ success: true, user: updatedEmail });
    } else {
        res.status(500);
        throw new Error('Failed to update email');
    }
});


  // POST /api/users/send-OTP
  const sendOTP = asyncHandler(async (req, res) => {
        console.log(req.body,'sendotp body');
      const user = await User.findById(req.user.id);
      const email = req.body.email;

      const emailExists = await User.findOne({ email });
        if (emailExists) {
            res.status(400);
            throw new Error('Email is already in use');
        }

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
            res.status(500);
            throw new Error('Failed to send OTP');
        }
        res.status(200).json({ success: true, message: "OTP sent successfully" });
      });
    
  });
  

  // POST /api/users/verify-OTP
  const verifyOTP = asyncHandler(async (req, res) => {
    console.log(req.body.otp,'verify otp body');
      const user = await User.findById(req.user.id);
      console.log(user.otp,'user otp');
      if (req.body.otp === user.otp) {
          user.verifyEmail = true
          await user.save()
          console.log('otp success');
          res.status(200).json({ success: true, message: "OTP verified successfully" });
      } else {
        res.status(500);
        throw new Error('Incorrect OTP');
      }
  });

  
  // POST /api/users/verify-registration
  const verifyRegistration = asyncHandler(async (req, res) => {
    console.log(req.body,'verify otp body');
      const user = await User.findById(req.body.id);
      console.log(user.otp,'user otp');
      if (req.body.otp === user.otp) {
          user.verifyEmail = true
          await user.save()
          console.log('otp success');
          res.status(200).json({ success: true, message: "OTP verified successfully" });
      } else {
        res.status(500);
        throw new Error('Incorrect OTP');
      }
  });


module.exports = { 
    registerUser, 
    registerGoogleUser, 
    loginUser, 
    currentUser, 
    getAllUsers,
    getUserById, 
    updateUserImage, 
    updateUserProfile, 
    changeUserPassword, 
    sendOTP, 
    verifyOTP, 
    updateUserEmail,
    verifyRegistration
}