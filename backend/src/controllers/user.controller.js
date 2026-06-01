import Otp from "../models/otp.model.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import sendEmail from "../config/sendEmail.js";

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please fill in all fields." });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: "Account already exists." });
        }

        const user = await User.create({
            username,
            email: email.toLowerCase(),
            password,
        });

        const token = generateToken(user);

        res.status(201).json({ message: "You have successfully registered!", 
            user: { id: user._id, email: user.email, username: user.username },
            token
        })

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: "Account not found." });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password." });
 
        const token = generateToken(user);
 
        res.status(200).json({
            message: "Logging in now.",
            user: { id: user._id, email: user.email, username: user.username },
            token
        });
 
    } catch (error) {
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
}

const logoutUser = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
 
        if (!user) return res.status(404).json({ message: "Account not found." });
 
        res.status(200).json({ message: "Logout successful." });
 
    } catch (error) {
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
}

const forgotPassword = async(req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if(!user) {
            return res.status(404).json({ message: "User does not exist." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000 );
        console.log("otp is ", otp);

        const newOtp = new Otp ({
            email,
            otp
        });

        await newOtp.save();

        const message = `Your verification code to reset your password is ${otp}`;

        await sendEmail (email, "Reset Password", message);

        res.status(200).json({ message: "A one-time password has been sent to your email."})

    } catch (error) {
        console.error("forgotPassword error:", error.message);
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
}

const verifyOtp = async (req, res) => {
    const {email, otp} = req.body;
    try {
        const otpRecord = await Otp.findOne({email, otp});

        if (!otpRecord || Date.now() > otpRecord.createdAt.getTime() + 60 * 60 * 1000) {
            return res.status(400).json({ message: "Invalid or expired one-time password." });
        }

        res.status(200).json({ message: "One-time password verification was successful!" });

    } catch (error) {
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
}

const resetPassword = async (req, res) => {
    const {email, otp, newPassword} = req.body;

    try {
        const otpRecord = await Otp.findOne({ email, otp });

        if (!otpRecord || Date.now() > otpRecord.createdAt.getTime() + 60 * 60 * 1000) {
            return res.status(400).json({ message: "Invalid or expired one-time password." });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User does not exist" });
        }

        user.password = newPassword;
        await user.save();
        await Otp.deleteMany({ email });
        res.status(200).json({ message: "Password reset successful" });
        
    } catch (error) {
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
}

export {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    verifyOtp,
    resetPassword
};
