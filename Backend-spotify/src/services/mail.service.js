const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendOTP(email, otp) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Spotify Clone OTP",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`
    });
    console.log("Email sent successfully to:", email);
  } catch (error) {
    console.error("NODEMAILER ERROR:", error);
    throw new Error("Email service failed"); // This lets the controller catch the error
  }
}


module.exports = sendOTP;
