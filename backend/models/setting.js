import mongoose, { Schema } from "mongoose";

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

// Create a default GST rate setting if it doesn't exist
settingSchema.statics.getGstRate = async function () {
  let setting = await this.findOne({ key: "gstRate" });
  if (!setting) {
    setting = await this.create({
      key: "gstRate",
      value: 0.18, // Default GST rate of 18%
      description: "Default GST rate for order calculations",
    });
  }
  return parseFloat(setting.value);
};

// Retrieve all tax and payment gateway settings with global defaults
settingSchema.statics.getTaxAndPaymentSettings = async function () {
  const keys = [
    "gstRate",
    "gstType",
    "paymentGatewayFeeRate",
    "collectPaymentGatewayFeeFromStudent",
    "companyName",
    "companyGstNumber",
    "companyAddress",
    "companyEmail",
    "companyPhone",
    "otherChargesRate",
    "otherChargesLabel",
    "RAZORPAY_KEY_ID"
  ];

  const docs = await this.find({ key: { $in: keys } });
  const map = {};
  docs.forEach((d) => {
    map[d.key] = d.value;
  });

  const rawGstRate = map.gstRate !== undefined ? parseFloat(map.gstRate) : 0.18;
  const gstRatePercent = rawGstRate <= 1 && rawGstRate > 0 ? Math.round(rawGstRate * 100) : rawGstRate;
  const gstRateDecimal = rawGstRate > 1 ? rawGstRate / 100 : rawGstRate;

  const rawPgRate = map.paymentGatewayFeeRate !== undefined ? parseFloat(map.paymentGatewayFeeRate) : 0.02;
  const paymentGatewayFeeRatePercent = rawPgRate <= 1 && rawPgRate > 0 ? Math.round(rawPgRate * 100) : rawPgRate;
  const paymentGatewayFeeRateDecimal = rawPgRate > 1 ? rawPgRate / 100 : rawPgRate;

  return {
    gstRate: gstRateDecimal,
    gstRatePercent,
    gstType: (map.gstType || "exclusive").toLowerCase(),
    paymentGatewayFeeRate: paymentGatewayFeeRateDecimal,
    paymentGatewayFeeRatePercent,
    collectPaymentGatewayFeeFromStudent:
      map.collectPaymentGatewayFeeFromStudent === true ||
      map.collectPaymentGatewayFeeFromStudent === "true",
    companyName: map.companyName || "Data Knowledge",
    companyGstNumber: map.companyGstNumber || "",
    companyAddress: map.companyAddress || "",
    companyEmail: map.companyEmail || "support@dataknowledge.in",
    companyPhone: map.companyPhone || "",
    otherChargesRate: map.otherChargesRate ? parseFloat(map.otherChargesRate) : 0,
    otherChargesLabel: map.otherChargesLabel || "",
    razorpayKeyId: map.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
  };
};

// Update tax and payment gateway settings
settingSchema.statics.updateTaxAndPaymentSettings = async function (newSettings = {}) {
  const updates = [];

  if (newSettings.gstRate !== undefined) {
    const val = parseFloat(newSettings.gstRate);
    const decimalVal = val > 1 ? val / 100 : val;
    updates.push(
      this.findOneAndUpdate(
        { key: "gstRate" },
        { value: decimalVal, description: "Default GST rate for courses (decimal, e.g. 0.18 for 18%)" },
        { upsert: true, new: true }
      )
    );
  }

  if (newSettings.gstType !== undefined) {
    updates.push(
      this.findOneAndUpdate(
        { key: "gstType" },
        { value: newSettings.gstType === "inclusive" ? "inclusive" : "exclusive", description: "Default GST calculation type (inclusive or exclusive)" },
        { upsert: true, new: true }
      )
    );
  }

  if (newSettings.paymentGatewayFeeRate !== undefined) {
    const pgVal = parseFloat(newSettings.paymentGatewayFeeRate);
    const decimalPg = pgVal > 1 ? pgVal / 100 : pgVal;
    updates.push(
      this.findOneAndUpdate(
        { key: "paymentGatewayFeeRate" },
        { value: decimalPg, description: "Default payment gateway fee rate (decimal, e.g. 0.02 for 2%)" },
        { upsert: true, new: true }
      )
    );
  }

  if (newSettings.collectPaymentGatewayFeeFromStudent !== undefined) {
    const boolVal =
      newSettings.collectPaymentGatewayFeeFromStudent === true ||
      newSettings.collectPaymentGatewayFeeFromStudent === "true";
    updates.push(
      this.findOneAndUpdate(
        { key: "collectPaymentGatewayFeeFromStudent" },
        { value: boolVal, description: "Whether to collect payment gateway fee from student at checkout" },
        { upsert: true, new: true }
      )
    );
  }

  const stringFields = ["companyName", "companyGstNumber", "companyAddress", "companyEmail", "companyPhone", "otherChargesLabel"];
  stringFields.forEach((field) => {
    if (newSettings[field] !== undefined) {
      updates.push(
        this.findOneAndUpdate(
          { key: field },
          { value: String(newSettings[field]).trim(), description: `Business/Invoice detail for ${field}` },
          { upsert: true, new: true }
        )
      );
    }
  });

  if (newSettings.otherChargesRate !== undefined) {
    updates.push(
      this.findOneAndUpdate(
        { key: "otherChargesRate" },
        { value: parseFloat(newSettings.otherChargesRate) || 0, description: "Default other charges rate" },
        { upsert: true, new: true }
      )
    );
  }

  await Promise.all(updates);
  return this.getTaxAndPaymentSettings();
};

// CHANGE: Added method to get default enrolledStudentsCount
settingSchema.statics.getDefaultEnrolledStudentsCount = async function () {
  let setting = await this.findOne({ key: "defaultEnrolledStudentsCount" });
  if (!setting) {
    setting = await this.create({
      key: "defaultEnrolledStudentsCount",
      value: 10, // Default enrolled students count
      description: "Default enrolled students count for courses",
    });
  }
  return parseInt(setting.value);
};

// Add singleton pattern to prevent model recompilation
const Setting =
  mongoose.model.Setting || mongoose.model("Setting", settingSchema);

export default Setting;