const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOTP(email, otp){
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. Valid for 10 minutes.`
    });
    console.log("OTP sent to:", email); // for debugging
  } catch(err){
    console.error("Error sending OTP:", err); // logs SMTP issues
  }
}


module.exports = sendOTP;
