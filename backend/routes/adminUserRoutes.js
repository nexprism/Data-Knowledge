import express from "express";
import {
  listAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  setAdminStatus,
  resetAdminPassword,
  deleteAdmin,
} from "../controllers/adminUserController.js";
import accessTokenAutoRefresh from "../middlewares/accessTokenAutoRefresh.js";
import passport from "passport";
import { isSuperAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

// SECURITY: every route here is locked to super admins. Regular admins and
// instructors cannot even discover that this API exists.
router.use(
  accessTokenAutoRefresh,
  passport.authenticate("jwt", { session: false }),
  isSuperAdmin
);

router.get("/", listAdmins);
router.post("/", createAdmin);
router.get("/:id", getAdmin);
router.put("/:id", updateAdmin);
router.put("/:id/status", setAdminStatus);
router.post("/:id/reset-password", resetAdminPassword);
router.delete("/:id", deleteAdmin);

export default router;
