const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: String,
    otpExpiry: Date,
    otpAttempts: { type: Number, default: 0 },
    otpLastAttempt: Date
});

module.exports = mongoose.model("OtpTemp", otpSchema);
