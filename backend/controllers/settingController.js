import Setting from '../models/setting.js';
import { calculatePricingBreakdown } from '../utils/pricingCalculator.js';

export const getSettings = async (req, res) => {
  try {
    // Validate Content-Type
    if (!req.is('application/json')) {
      return res.status(400).json({ message: "Content-Type must be application/json" });
    }

    const { keys } = req.body;

    // Validate input
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ message: "Keys must be a non-empty array" });
    }

    // Fetch settings for the provided keys
    const settings = await Setting.find({ key: { $in: keys } }).select('key value description');

    // Create a response object mapping keys to values
    const result = {};
    keys.forEach(key => {
      const setting = settings.find(s => s.key === key);
      result[key] = setting ? setting.value : null; // Return null if key not found
    });

    return res.status(200).json({
      message: "Settings retrieved successfully",
      settings: result
    });
  } catch (err) {
    console.error("Get Settings Error:", err);
    return res.status(500).json({ message: "Failed to retrieve settings", error: err.message });
  }
};

export const getAllSettings = async (req, res) => {
  try {
    // Fetch all settings
    const settings = await Setting.find().select('key value description');

    // Create a response object mapping keys to values
    const result = {};
    settings.forEach(setting => {
      // Hide secrets like RAZORPAY_KEY_SECRET unless request is verified admin
      if (setting.key === 'RAZORPAY_KEY_SECRET' && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.roles !== 'admin'))) {
        return;
      }
      result[setting.key] = setting.value;
    });

    // Ensure fallback defaults for tax and payment settings if not in DB yet
    if (result.gstRate === undefined) result.gstRate = 0.18;
    if (result.gstType === undefined) result.gstType = "exclusive";
    if (result.paymentGatewayFeeRate === undefined) result.paymentGatewayFeeRate = 0.02;
    if (result.collectPaymentGatewayFeeFromStudent === undefined) result.collectPaymentGatewayFeeFromStudent = false;

    return res.status(200).json({
      message: "All settings retrieved successfully",
      settings: result
    });
  } catch (err) {
    console.error("Get All Settings Error:", err);
    return res.status(500).json({ message: "Failed to retrieve all settings", error: err.message });
  }
};

/**
 * GET /api/v1/settings/tax-payment
 * Retrieves tax, GST, payment gateway charges, and company billing info
 */
export const getTaxAndPaymentSettingsController = async (req, res) => {
  try {
    const settings = await Setting.getTaxAndPaymentSettings();
    return res.status(200).json({
      success: true,
      message: "Tax and payment settings retrieved successfully",
      data: settings,
      settings,
    });
  } catch (err) {
    console.error("Get Tax & Payment Settings Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve tax and payment settings",
      error: err.message,
    });
  }
};

/**
 * PUT /api/v1/settings/tax-payment (Admin only)
 * Updates global GST rate, GST mode (inclusive/exclusive), PG fee, and billing details
 */
export const updateTaxAndPaymentSettingsController = async (req, res) => {
  try {
    const updated = await Setting.updateTaxAndPaymentSettings(req.body);
    return res.status(200).json({
      success: true,
      message: "Tax and payment settings updated successfully",
      data: updated,
      settings: updated,
    });
  } catch (err) {
    console.error("Update Tax & Payment Settings Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update tax and payment settings",
      error: err.message,
    });
  }
};

/**
 * POST /api/v1/settings/calculate-preview
 * Calculates live pricing breakdown for simulation or testing
 */
export const calculatePricingPreviewController = async (req, res) => {
  try {
    const {
      listedPrice,
      discount = 0,
      gstType,
      gstRate,
      paymentGatewayFeeRate,
      collectGatewayFee,
      otherCharges = 0,
    } = req.body;

    const globalDefaults = await Setting.getTaxAndPaymentSettings();

    const breakdown = calculatePricingBreakdown({
      listedPrice: listedPrice !== undefined ? listedPrice : 1000,
      discount,
      gstType: gstType || globalDefaults.gstType,
      gstRate: gstRate !== undefined ? gstRate : globalDefaults.gstRatePercent,
      paymentGatewayFeeRate: paymentGatewayFeeRate !== undefined ? paymentGatewayFeeRate : globalDefaults.paymentGatewayFeeRatePercent,
      collectGatewayFee: collectGatewayFee !== undefined ? collectGatewayFee : globalDefaults.collectPaymentGatewayFeeFromStudent,
      otherCharges,
    });

    return res.status(200).json({
      success: true,
      breakdown,
    });
  } catch (err) {
    console.error("Calculate Pricing Preview Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate pricing preview",
      error: err.message,
    });
  }
};