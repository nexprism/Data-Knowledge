import express from 'express';
import {
  signup, updateProfile, login, logout, getUserById, blockUser, changeUserPassword, forgotPassword, resetPassword, getMyProfile, deleteDocument, getUserDashboard, deleteUser, getOverviewDashboard, deleteEducation, createUserByAdmin, logoutAllSessions, updateFcmToken, sendTestNotification, banOrShadowBanUser, unbanUser,   listDeviceApprovalRequests,
  manageDeviceRequest, checkDeviceApprovalStatus, requestDeviceApproval,
  searchUsers, sendOtpviaemail, verifyOtpviaemail, googleLogin, updateUserRole
} from '../controllers/userController.js';
import { getStudentWebProfile } from '../controllers/studentWebController.js';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';
import { sendOtp, verifyOtp } from '../controllers/otpController.js';
import passport from 'passport';
import { upload } from '../middlewares/upload-middleware.js';
import { isAdmin, isSuperAdmin } from '../middlewares/isAdmin.js';
import { validateResetPassword } from '../middlewares/validation.js';
import isUserBanned from '../middlewares/isUserBanned.js';
import dotenv from "dotenv"
import { Token } from '../utils/index.js';

dotenv.config();

const userRouter = express.Router();

userRouter.post('/refresh-token', async (req, res) => {
  try {
    const tokenData = await Token.refreshAccessToken(req, res);
    if (!tokenData) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Failed to refresh token",
      });
    }
    const { newAccessToken, newRefreshToken, newAccessTokenExp, newRefreshTokenExp } = tokenData;
    Token.setTokensCookies(res, newAccessToken, newRefreshToken, newAccessTokenExp, newRefreshTokenExp);
    res.setHeader("x-access-token", newAccessToken);
    res.setHeader("x-refresh-token", newRefreshToken);
    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: err.message || "Invalid refresh token",
    });
  }
});

userRouter.post('/signup', signup);
userRouter.post('/forgot-password', forgotPassword);
//update-fcm-token (requires authentication — prevents notification hijacking)
userRouter.post('/fcm/update', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), updateFcmToken);
//send-test-notification
userRouter.get('/send-test-notification', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, sendTestNotification);

userRouter.post('/reset-password', validateResetPassword, resetPassword);
// userRouter.post('/change-password', changeUserPassword);
userRouter.post('/change-password', accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isUserBanned,
  changeUserPassword
);
userRouter.post(
  '/create-user',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  createUserByAdmin
);



// profile update route
userRouter.get('/me', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isUserBanned, getMyProfile);
// userRouter.put('/profile',upload.single("profilePicture"), accessTokenAutoRefresh, passport.authenticate("jwt", { session: false }),updateProfile);
userRouter.put(
  '/profile',
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'documentation', maxCount: 5 } // or more, adjust as needed
  ]),
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isUserBanned,
  updateProfile
);
userRouter.delete('/documentation/:documentId',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isUserBanned,
  deleteDocument
);

userRouter.delete('/education/:educationId',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isUserBanned,
  deleteEducation
);

userRouter.get("/search", accessTokenAutoRefresh, passport.authenticate("jwt", { session: false }), searchUsers);

userRouter.post('/login', login);
userRouter.post(
  '/logout',
  accessTokenAutoRefresh,
  passport.authenticate('jwt', { session: false }),
  isUserBanned,
  logout
);
userRouter.get('/user', accessTokenAutoRefresh, passport.authenticate("jwt", { session: false }), isUserBanned, getUserById);
userRouter.get('/student-web-profile/:id', accessTokenAutoRefresh, passport.authenticate("jwt", { session: false }), isUserBanned, getStudentWebProfile);
userRouter.put('/block-unblock', accessTokenAutoRefresh, passport.authenticate("jwt", { session: false }), isAdmin, blockUser);
userRouter.post('/send-otp', sendOtp);
userRouter.post('/verify-otp', verifyOtp);
userRouter.delete('/:id', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isUserBanned, deleteUser);
userRouter.get('/overview', accessTokenAutoRefresh, passport.authenticate('jwt', { session: false }), isAdmin, isUserBanned, getOverviewDashboard);

userRouter.post('/logout-all-sessions',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isUserBanned,
  logoutAllSessions
);
userRouter.put(
  '/ban-shadow-ban',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  banOrShadowBanUser
);
userRouter.put(
  '/unban-user',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  unbanUser
);
userRouter.put(
  '/:userId/role',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  // SECURITY: role changes (including granting/revoking `admin`) are restricted
  // to super admins so regular admins cannot escalate privileges.
  isSuperAdmin,
  updateUserRole
);

userRouter.get(
  '/device-approvals',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  listDeviceApprovalRequests
);

userRouter.post(
  '/device-approvals/manage',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isAdmin,
  manageDeviceRequest
);

userRouter.get(
  '/device-approval/status',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isUserBanned,
  checkDeviceApprovalStatus
);

userRouter.post(
  '/device-approval/request',
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isUserBanned,
  requestDeviceApproval
);


userRouter.post('/sendotp', sendOtpviaemail);
userRouter.post('/google-login', googleLogin);
userRouter.post('/verifyotp', verifyOtpviaemail);


userRouter.get("/check-force-update",
  (req, res) => {
    //console.log("Checking force update...", process.env.APP_VERSION);
    //console.log("Force update status:", process.env.FORCE_UPDATE);
    //console.log("Force android update status:", process.env.ANDROID_FORCE_UPDATE);
    //console.log("Android Verzion :", process.env.ANDROID_APP_VERSION);
    res.json({
      APP_VERSION: process.env.APP_VERSION,
      FORCE_UPDATE: true,
      ANDROID_APP_VERSION: process.env.ANDROID_APP_VERSION,
      ANDROID_FORCE_UPDATE: true,
      IOS_APP_VERSION: process.env.IOS_APP_VERSION,
      IOS_FORCE_UPDATE: true
    });
  },
);


export default userRouter;