
function generateOTP() {
    let otp = Math.random();
    otp = otp * 1000000;
    otp = parseInt(otp);
    return otp;
  }
  
  module.exports = generateOTP;
  