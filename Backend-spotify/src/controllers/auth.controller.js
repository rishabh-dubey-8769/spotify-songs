const sendOTP = require("../services/mail.service");
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Send OTP for registration (does NOT create user yet)
async function sendOtpRegister(req, res) {
  try {
    const { email, username } = req.body; // Get username early!

    if (!username) {
      return res.status(400).json({ message: "Please enter a username before requesting OTP." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    // This still creates a record, but now it includes the username 
    // so your DB isn't filled with anonymous entries.
    await userModel.updateOne(
      { email },
      {
        username, // Save username here too!
        otp,
        otpExpiry: expiry,
        isVerified: false
      },
      { upsert: true }
    );

    await sendOTP(email, otp);
    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ message: "OTP failed" });
  }
}
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Verify OTP and create or update user
async function verifyOtpRegister(req, res) {
  try {
    const { email, otp, username, password, role } = req.body;

    const user = await userModel.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 3. SECURE STEP: Now that OTP is valid, hash the password and save details
    const hashedPassword = await bcrypt.hash(password, 10);
    
    user.username = username;
    user.password = hashedPassword;
    user.role = role || 'user';
    user.isVerified = true;
    user.otp = null; // Clear OTP after use
    await user.save();

    // 4. Generate Login Token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: "Registration successful!",
      user: { id: user._id, username, email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: "Verification failed on server." });
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Login user
async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const nitpEmailCheck = /^[a-zA-Z0-9._%+-]+(\.ee|\.me)@nitp\.ac\.in$/;
        if (!nitpEmailCheck.test(email)) {
            return res.status(400).json({ message: "Login through NITP Email only" });
        }

        const user = await userModel.findOne({ email });
        if (!user) return res.status(401).json({ message: "User not found. Please register first" });
        if (!user.isVerified) return res.status(403).json({ message: "Please verify OTP before login" });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: "Invalid password" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Login ERROR:", err);
        return res.status(500).json({ message: "Server error during login" });
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Forgot password OTP
async function sendOtpForgot(req, res) {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendOTP(email, otp);
        return res.json({ message: "OTP sent to email (check spam too!)" });
    } catch (err) {
        console.error("Forgot OTP ERROR:", err);
        return res.status(500).json({ message: "Failed to send OTP" });
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Reset password
async function resetPassword(req, res) {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await userModel.findOne({ email });
        if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("Reset Password ERROR:", err);
        return res.status(500).json({ message: "Server error during password reset" });
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Logout
async function logoutUser(req, res) {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });
    return res.json({ message: "Logged out successfully" });
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get user count
async function getUserCount(req, res) {
    try {
        const count = await userModel.countDocuments();
        return res.json({ count });
    } catch (err) {
        console.error("User Count ERROR:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get current logged-in user
async function getMe(req, res) {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: "Not logged in" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json({ user });
    } catch (err) {
        console.error("Get Me ERROR:", err);
        return res.status(401).json({ message: "Invalid token" });
    }
}

module.exports = {
    sendOtpRegister,
    verifyOtpRegister,
    registerUser,
    loginUser,
    logoutUser,
    getUserCount,
    getMe,
    sendOtpForgot,
    resetPassword
};


