import { Router } from 'express';
import { registerUser, loginUser, logoutUser, forgotPassword, verifyOtp, resetPassword } from '../controllers/user.controller.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(logoutUser);
router.route('/forgot-password').post(forgotPassword);
router.route('/verify-otp').post(verifyOtp);
router.route('/reset-password').post(resetPassword);

export default router;