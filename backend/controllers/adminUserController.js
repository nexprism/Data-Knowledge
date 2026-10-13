import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/user.js";
import UserService from "../service/userService.js";

const userService = new UserService();

// Fields that must never leave the server.
const SENSITIVE_FIELDS = [
  "password",
  "passwordResetToken",
  "passwordResetExpiry",
  "otp",
  "otpExpiry",
];

// Only these roles are managed through the Admin Management console.
const MANAGED_ROLES = ["admin", "super_admin"];

const sanitizeAdmin = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  SENSITIVE_FIELDS.forEach((field) => delete obj[field]);
  return obj;
};

// Strong-ish temporary password: upper, lower, digit, symbol + random bytes.
const generateTemporaryPassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*";
  const pick = (set) => set[crypto.randomInt(0, set.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const all = upper + lower + digits + symbols;
  const rest = Array.from({ length: 8 }, () => pick(all));
  const chars = [...required, ...rest];
  // Fisher-Yates shuffle so the required chars aren't always at the front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(String(email || "").trim());

// Fetch a managed account (admin/super_admin) by id, or null.
const findManagedAdmin = (id) =>
  mongoose.isValidObjectId(id)
    ? User.findOne({ _id: id, role: { $in: MANAGED_ROLES } })
    : null;

// Guard used by mutating endpoints: blocks actions on a super admin account and
// on the caller's own account where self-service would be dangerous. Self-editing
// is permitted only when `allowSelf` is set (used for updating one's own profile).
const assertMutableTarget = (req, res, target, { allowSelf = false } = {}) => {
  if (!target) {
    res.status(404).json({ success: false, message: "Admin not found" });
    return false;
  }

  const isSelf = String(target._id) === String(req.user._id);
  if (isSelf) {
    if (allowSelf) return true;
    res.status(400).json({
      success: false,
      message: "You cannot perform this action on your own account.",
    });
    return false;
  }

  if (target.role === "super_admin") {
    res.status(403).json({
      success: false,
      message: "Super admin accounts cannot be modified from this console.",
    });
    return false;
  }
  return true;
};

export const listAdmins = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = String(req.query.search || "").trim();
    const status = req.query.status; // 'active' | 'inactive' | undefined

    const filter = { role: { $in: MANAGED_ROLES } };
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ fullName: regex }, { email: regex }];
    }
    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;

    const [admins, total] = await Promise.all([
      User.find(filter)
        .select("-password -passwordResetToken -passwordResetExpiry -otp -otpExpiry")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admins fetched successfully",
      data: {
        admins,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentUserId: String(req.user._id),
      },
      err: {},
    });
  } catch (error) {
    console.error("❌ listAdmins error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch admins",
    });
  }
};

export const getAdmin = async (req, res) => {
  try {
    const target = await findManagedAdmin(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Admin fetched successfully",
      data: { admin: sanitizeAdmin(target) },
      err: {},
    });
  } catch (error) {
    console.error("❌ getAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch admin",
    });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ success: false, message: "Full name is required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "A valid email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    // A temporary password is generated unless the caller supplies one.
    const providedPassword = password != null && String(password).length > 0;
    const plainPassword = providedPassword ? String(password) : generateTemporaryPassword();
    if (plainPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const hashedPassword = await userService.hashPassword(plainPassword);

    const admin = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin", // SECURITY: this console can only create regular admins
      isActive: true,
      mustChangePassword: true,
      createdBy: req.user._id,
      emailVerified: true,
    });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        admin: sanitizeAdmin(admin),
        // Returned exactly once so it can be handed to the new admin securely.
        temporaryPassword: plainPassword,
        generatedPassword: !providedPassword,
      },
      err: {},
    });
  } catch (error) {
    console.error("❌ createAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create admin",
    });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const target = await findManagedAdmin(req.params.id);
    if (!assertMutableTarget(req, res, target, { allowSelf: true })) return;

    const { fullName, email } = req.body;
    const updates = {};

    if (fullName != null) {
      if (!String(fullName).trim()) {
        return res.status(400).json({ success: false, message: "Full name cannot be empty" });
      }
      updates.fullName = String(fullName).trim();
    }

    if (email != null) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "A valid email is required" });
      }
      const normalizedEmail = String(email).trim().toLowerCase();
      if (normalizedEmail !== target.email) {
        const conflicting = await User.findOne({ email: normalizedEmail, _id: { $ne: target._id } });
        if (conflicting) {
          return res.status(409).json({ success: false, message: "An account with this email already exists" });
        }
        updates.email = normalizedEmail;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided to update" });
    }

    const updated = await User.findByIdAndUpdate(target._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password -passwordResetToken -passwordResetExpiry -otp -otpExpiry");

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: { admin: sanitizeAdmin(updated) },
      err: {},
    });
  } catch (error) {
    console.error("❌ updateAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update admin",
    });
  }
};

export const setAdminStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive (boolean) is required" });
    }

    const target = await findManagedAdmin(req.params.id);
    if (!assertMutableTarget(req, res, target)) return;

    const updated = await User.findByIdAndUpdate(
      target._id,
      { isActive },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpiry -otp -otpExpiry");

    return res.status(200).json({
      success: true,
      message: isActive ? "Admin activated successfully" : "Admin deactivated successfully",
      data: { admin: sanitizeAdmin(updated) },
      err: {},
    });
  } catch (error) {
    console.error("❌ setAdminStatus error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update admin status",
    });
  }
};

export const resetAdminPassword = async (req, res) => {
  try {
    const target = await findManagedAdmin(req.params.id);
    if (!assertMutableTarget(req, res, target)) return;

    const providedPassword = req.body?.password != null && String(req.body.password).length > 0;
    const plainPassword = providedPassword ? String(req.body.password) : generateTemporaryPassword();
    if (plainPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const hashedPassword = await userService.hashPassword(plainPassword);

    await User.findByIdAndUpdate(target._id, {
      password: hashedPassword,
      // Force the admin to pick their own password on next login.
      mustChangePassword: true,
      // Invalidate any access tokens issued before this reset.
      passwordChangedAt: new Date(),
      passwordResetToken: null,
      passwordResetExpiry: null,
    });

    return res.status(200).json({
      success: true,
      message: "Admin password reset successfully",
      data: {
        temporaryPassword: plainPassword,
        generatedPassword: !providedPassword,
      },
      err: {},
    });
  } catch (error) {
    console.error("❌ resetAdminPassword error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset admin password",
    });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const target = await findManagedAdmin(req.params.id);
    if (!assertMutableTarget(req, res, target)) return;

    await User.findByIdAndDelete(target._id);

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
      data: {},
      err: {},
    });
  } catch (error) {
    console.error("❌ deleteAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete admin",
    });
  }
};
