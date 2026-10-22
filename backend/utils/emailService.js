import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/**
 * EmailService handles sending different types of emails from different sender addresses.
 * 
 * Transactional: noreply@dataknowledge.in (process.env.TransactionalEmail / process.env.TransactionalEmailPass)
 * Founder/Casual: noreply@dataknowledge.in (process.env.FounderEmail / process.env.FounderEmailPass)
 * Support: noreply@dataknowledge.in (process.env.SupportEmail / process.env.SupportEmailPass)
 */
class EmailService {
  constructor() {
    this.transporters = {};
  }

  /**
   * Helper to get a clean, validated frontend base URL without trailing slashes,
   * leading dots in domain names, or malformed ports/routes.
   */
  getFrontendUrl() {
    let url = process.env.FRONTEND_URL || "https://dataknowledge.in";
    url = String(url).trim();

    if (!url) return "https://dataknowledge.in";

    // Ensure protocol
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    // Strip accidental leading dot right after protocol (e.g. "https://.dataknowledge.in")
    url = url.replace(/^(https?:\/\/)\.+/i, "$1");

    // Strip trailing colons, slashes, or whitespace (e.g. "https://dataknowledge.in:" or "https://dataknowledge.in/")
    url = url.replace(/[:\/]+$/, "");

    // Strip any accidental route attached to FRONTEND_URL (e.g. ":reset-password" or "/reset-password")
    url = url.replace(/[:\/](reset-password|login|dashboard|api).*$/i, "");

    try {
      const parsed = new URL(url);
      // Strip leading dot from hostname
      parsed.hostname = parsed.hostname.replace(/^\.+/, "");
      if (!parsed.hostname || parsed.hostname === ".") {
        parsed.hostname = "dataknowledge.in";
      }
      // If port is not a purely numeric string, remove it
      if (parsed.port && !/^\d+$/.test(parsed.port)) {
        parsed.port = "";
      }
      return parsed.origin;
    } catch {
      return "https://dataknowledge.in";
    }
  }

  resolveFrontendUrl(clientOrigin = null) {
    if (clientOrigin) {
      try {
        let clean = String(clientOrigin).trim();
        if (!/^https?:\/\//i.test(clean)) {
          clean = `https://${clean}`;
        }
        clean = clean.replace(/[:\/]+$/, "");
        clean = clean.replace(/[:\/](reset-password|login|dashboard|api).*$/i, "");
        const parsed = new URL(clean);
        if (parsed.origin && (parsed.protocol === "http:" || parsed.protocol === "https:")) {
          return parsed.origin;
        }
      } catch (_) {}
    }
    return this.getFrontendUrl();
  }

  _createTransporter(user, pass, portOverride = null, secureOverride = null) {
    const host = process.env.SMTP_HOST || process.env.MAIL_HOST || "smtp.hostinger.com";
    const port = portOverride !== null
      ? portOverride
      : Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 465);
    const secure = secureOverride !== null
      ? secureOverride
      : (process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === "true"
        : port === 465);

    const username = user || process.env.SMTP_USER || process.env.MAIL_USERNAME || process.env.EMAIL_FROM || "noreply@dataknowledge.in";
    const password = pass || process.env.SMTP_PASS || process.env.MAIL_PASSWORD || "";

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: username,
        pass: password,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
    });
  }

  /**
   * Helper to get the correct "from" field for each type of email.
   */
  getFrom(type = "transactional") {
    const defaultEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.TransactionalEmail || "noreply@dataknowledge.in";
    switch (type) {
      case "transactional":
        return `"Data Knowledge" <${process.env.TransactionalEmail || defaultEmail}>`;
      case "founder":
        return `"Data Knowledge" <${process.env.FounderEmail || defaultEmail}>`;
      case "support":
        return `"Data Knowledge Support" <${process.env.SupportEmail || defaultEmail}>`;
      default:
        return `"Data Knowledge" <${defaultEmail}>`;
    }
  }

  _getCredentials(type = "transactional") {
    let user, pass;
    if (type === "transactional") {
      user = process.env.TransactionalEmail || process.env.SMTP_USER || process.env.MAIL_USERNAME;
      pass = process.env.TransactionalEmailPass || process.env.SMTP_PASS || process.env.MAIL_PASSWORD;
    } else if (type === "founder") {
      user = process.env.FounderEmail || process.env.TransactionalEmail || process.env.SMTP_USER;
      pass = process.env.FounderEmailPass || process.env.TransactionalEmailPass || process.env.SMTP_PASS;
    } else if (type === "support") {
      user = process.env.SupportEmail || process.env.TransactionalEmail || process.env.SMTP_USER;
      pass = process.env.SupportEmailPass || process.env.TransactionalEmailPass || process.env.SMTP_PASS;
    } else {
      user = process.env.TransactionalEmail || process.env.SMTP_USER;
      pass = process.env.TransactionalEmailPass || process.env.SMTP_PASS;
    }
    return { user, pass };
  }

  /**
   * Helper to get the correct transporter for each type of email.
   */
  getTransporter(type = "transactional") {
    if (!this.transporters[type]) {
      const { user, pass } = this._getCredentials(type);
      this.transporters[type] = this._createTransporter(user, pass);
    }
    return this.transporters[type];
  }

  /**
   * Send mail with automatic fallback to alternative SMTP port (e.g. 465 SSL <-> 587 STARTTLS)
   */
  async sendMail(type, mailOptions) {
    const primaryTransporter = this.getTransporter(type);
    try {
      const info = await primaryTransporter.sendMail(mailOptions);
      return info;
    } catch (primaryError) {
      console.warn(`⚠️ Primary SMTP send failed on port ${process.env.SMTP_PORT || 465} (${primaryError.message}). Attempting automatic fallback port...`);
      const primaryPort = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 465);
      const fallbackPort = primaryPort === 465 ? 587 : 465;
      const fallbackSecure = fallbackPort === 465;

      const { user, pass } = this._getCredentials(type);
      const fallbackTransporter = this._createTransporter(user, pass, fallbackPort, fallbackSecure);
      const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully via fallback port ${fallbackPort}`);
      return fallbackInfo;
    }
  }

  /**
   * Send OTP/verification email (Transactional)
   */
  async sendOtpEmail(email, otp, userName = 'User') {
    const mailOptions = {
      from: this.getFrom("transactional"),
      to: email,
      subject: 'Your OTP for Verification',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>OTP Verification</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Your One-Time Password (OTP) for verification is:</p>
          <h3 style="color: #007bff;">${otp}</h3>
          <p>This OTP is valid for 10 minutes. Please use it to complete your verification.</p>
          <p>If you didn’t request this OTP, please ignore this email or contact our support team.</p>
          <hr />
          <p style="font-size: 12px; color: #777;">This is an automated email, please do not reply.</p>
        </div>
      `,
    };

    try {
      const info = await this.sendMail("transactional", mailOptions);
      console.log('✅ OTP email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending OTP email:', error);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }

  /**
   * Send password reset email (Transactional)
   */
  async sendPasswordResetEmail(email, resetToken, userName, clientOrigin = null) {
    const frontendBase = this.resolveFrontendUrl(clientOrigin);
    const resetUrl = `${frontendBase}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const mailOptions = {
      from: this.getFrom("transactional"),
      to: email,
      subject: "Password Reset Request - Data Knowledge",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Data Knowledge</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0b0f19;">
        <tr>
            <td style="padding: 30px 15px;" align="center">
                <table role="presentation" style="width: 100%; max-width: 580px; margin: 0 auto; background-color: #131b2e; border: 1px solid #1e293b; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    
                    <!-- Header with Official Logo -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px 30px; text-align: center;">
                            <img src="https://dataknowledge.in/data_knowlege/logo/logo.png" alt="Data Knowledge" width="180" style="max-height: 48px; width: auto; display: block; margin: 0 auto 10px auto; border: 0; outline: none;" />
                            <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 3px;">DATA KNOWLEDGE</div>
                            <div style="font-size: 13px; color: #e0f2fe; margin-bottom: 14px; letter-spacing: 0.5px;">Practical Learning Ecosystem</div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 14px; letter-spacing: 0.5px;">Password Reset Request</h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 36px 32px; color: #e2e8f0;">
                            <p style="margin: 0 0 18px 0; font-size: 16px; line-height: 1.6; color: #f8fafc;">
                                Hello <strong style="color: #38bdf8;">${userName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 25px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                                We received a request to reset your password for your Data Knowledge account. If you made this request, please click the button below to set a new password:
                            </p>
                            
                            <!-- Reset Button -->
                            <table role="presentation" style="margin: 28px auto;" align="center">
                                <tr>
                                    <td style="text-align: center; border-radius: 8px; background-color: #0284c7;">
                                        <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 34px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; text-align: center; border: 1px solid #38bdf8;">
                                            Reset My Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link Box -->
                            <div style="background-color: #0f172a; padding: 18px; border-radius: 8px; margin: 26px 0; border: 1px solid #1e293b;">
                                <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; font-weight: 500;">
                                    If the button doesn't work, copy and paste this link into your browser:
                                </p>
                                <p style="margin: 0; word-break: break-all; font-size: 13px; line-height: 1.5;">
                                    <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline;">${resetUrl}</a>
                                </p>
                            </div>
                            
                            <!-- Security Notice -->
                            <div style="border-left: 3px solid #0284c7; background-color: rgba(2,132,199,0.08); padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                                <p style="margin: 0 0 6px 0; font-size: 13px; color: #f87171; font-weight: 700;">
                                    ⏰ Important Security Notice
                                </p>
                                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #cbd5e1;">
                                    This password reset link will expire in <strong>1 hour</strong> for your security.
                                </p>
                            </div>
                            
                            <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                                If you didn't request a password reset, you can safely ignore this email. Your password will remain completely unchanged.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0a0f1d; padding: 26px 30px; text-align: center; border-top: 1px solid #1e293b;">
                            <p style="margin: 0 0 8px 0; color: #38bdf8; font-size: 15px; font-weight: 700; letter-spacing: 1px;">
                                Data Knowledge
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                                This is an automated email, please do not reply directly.<br>
                                If you need assistance, please contact our support team at <a href="mailto:noreply@dataknowledge.in" style="color: #38bdf8; text-decoration: none;">noreply@dataknowledge.in</a>.
                            </p>
                            <p style="margin: 12px 0 0 0; font-size: 11px; color: #475569;">
                                © ${new Date().getFullYear()} Data Knowledge. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
      `,
    };

    try {
      const info = await this.sendMail("transactional", mailOptions);
      console.log("✅ Password reset email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw new Error(`Failed to send reset email: ${error.message}`);
    }
  }

  /**
   * Send order confirmation email (Transactional)
   */
  async sendOrderConfirmationEmail(email, name, password) {
    console?.log("Sending order confirmation email to:", email);
    const loginUrl = `${this.getFrontendUrl()}/login`;
    const mailOptions = {
      from: this.getFrom("transactional"),
      to: email,
      subject: "Course Enrollment Confirmation - Data Knowledge",
      html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #0284c7; padding: 24px 30px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 22px;">Course Enrollment Confirmation</h2>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Data Knowledge – Practical Learning Ecosystem</p>
        </div>
        <div style="padding: 30px; color: #1e293b;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for enrolling in our course(s)! Your enrollment is confirmed and your access has been activated.</p>
          ${
          password !== null && password !== undefined && password !== ''
            ? `
            <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px; font-weight: bold; color: #0f172a;">Your Account Details:</p>
              <p style="margin: 0 0 4px;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 0 0 14px;"><strong>Password:</strong> ${password}</p>
              <a href="${loginUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                Login to your account
              </a>
            </div>
            `
            : `
            <div style="margin: 20px 0;">
              <a href="${loginUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                Go to Dashboard
              </a>
            </div>
            `
          }
          <p>Once logged in, you can access your enrolled courses directly from your student dashboard.</p>
          <p>If you have any questions or need assistance, feel free to contact us at <a href="mailto:noreply@dataknowledge.in" style="color: #0284c7;">noreply@dataknowledge.in</a>.</p>
        </div>
        <div style="background: #f1f5f9; padding: 16px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">This is an automated email, please do not reply.</p>
        </div>
      </div>
      `,
    };

    try {
      const info = await this.sendMail("transactional", mailOptions);
      console.log("✅ Order confirmation email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw new Error(
        `Failed to send order confirmation email: ${error.message}`
      );
    }
  }

  /**
   * Send enrollment mail (not order confirmation, just enrollment info)
   * Uses the same design as the welcome mail (with login info if needed).
   */
  async sendEnrollmentMail(email, name, courseTitle) {
    const loginUrl = `${this.getFrontendUrl()}/login`;
    const mailOptions = {
      from: this.getFrom("transactional"),
      to: email,
      subject: "Welcome to Data Knowledge – Enrollment Successful!",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enrollment Successful - Data Knowledge</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background-color: #ffffff; color: #000000; line-height: 1.6; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 2px solid #000000; }
        .header { background-color: #0284c7; color: #ffffff; padding: 30px 40px; text-align: center; }
        .logo { font-size: 32px; font-weight: bold; letter-spacing: 2px; margin-bottom: 10px; }
        .tagline { font-size: 14px; font-weight: normal; opacity: 0.9; }
        .content { padding: 40px; background-color: #ffffff; }
        .greeting { font-size: 20px; font-weight: bold; margin-bottom: 25px; color: #000000; }
        .message-text { font-size: 16px; margin-bottom: 20px; color: #333333; }
        .highlight-box { background-color: #f8f8f8; border-left: 4px solid #0284c7; padding: 20px; margin: 30px 0; }
        .highlight-text { font-size: 16px; font-style: italic; color: #000000; }
        .course-title { font-size: 18px; font-weight: bold; color: #000000; margin-bottom: 10px; }
        .login-info { background-color: #f1f5f9; border-left: 4px solid #000; margin: 30px 0; padding: 20px; }
        .download-section { text-align: center; margin: 40px 0; padding: 30px 20px; background-color: #0f172a; color: #ffffff; border-radius: 8px; }
        .download-title { font-size: 22px; font-weight: bold; margin-bottom: 15px; color: #ffffff; }
        .download-subtitle { font-size: 16px; margin-bottom: 25px; opacity: 0.9; color: #ffffff; }
        .download-buttons { display: flex; justify-content: center; gap: 20px; }
        .download-btn { display: inline-block; padding: 12px 25px; background-color: #0284c7; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 6px; }
        .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        .signature-text { font-size: 16px; margin-bottom: 5px; }
        .signature-name { font-weight: bold; color: #000000; }
        .footer { background-color: #0f172a; color: #ffffff; padding: 20px 40px; text-align: center; }
        .support-info { font-size: 14px; margin-bottom: 10px; }
        .support-email { color: #38bdf8; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">DATA KNOWLEDGE</div>
            <div class="tagline">Practical Learning Ecosystem</div>
        </div>
        <div class="content">
            <div class="greeting">Hi ${name},</div>
            <p class="message-text">Congratulations! You have been successfully enrolled in:</p>
            <div class="course-title">${courseTitle || "Your Course"}</div>
            <div class="highlight-box">
                <p class="highlight-text">We're thrilled to have you join us. This course is designed to be hands-on: watch, practice, and connect with our mentors if you need help. Your learning journey starts now!</p>
            </div>
          
            <div class="download-section">
                <div class="download-title">Start Learning Now</div>
                <div class="download-subtitle">Access your course on the web platform</div>
                <div class="download-buttons">
                    <a href="${loginUrl}" class="download-btn" target="_blank">🌐 Go to Dashboard</a>
                </div>
            </div>
            <p class="message-text">If you have any questions or need assistance, our support team is here for you.</p>
            <div class="signature">
                <p class="signature-text">Happy learning!</p>
                <p class="signature-name">Data Knowledge Team</p>
            </div>
        </div>
        <div class="footer">
            <p class="support-info">Need help? Contact us at</p>
            <a href="mailto:noreply@dataknowledge.in" class="support-email">noreply@dataknowledge.in</a>
        </div>
    </div>
</body>
</html>
      `,
    };

    try {
      const info = await this.sendMail("transactional", mailOptions);
      console.log("✅ Enrollment email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending enrollment mail:", error);
      throw new Error(`Failed to send enrollment mail: ${error.message}`);
    }
  }

  /**
   * Send event registration email (Founder for event/casual, Transactional if login details)
   * If password is provided, it's a new user, so use transactional. Otherwise, use founder.
   */
  async sendEventRegistrationEmail(email, name, eventDetails, password = null) {
    // If password is present, it's a transactional email (new user), else it's a founder/casual info email
    const fromType = password ? "transactional" : "founder";
    const mailOptions = {
      from: this.getFrom(fromType),
      to: email,
      subject: `Registration Confirmation for ${eventDetails.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Event Registration Confirmation</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for registering for the event: <strong>${eventDetails.title
        }</strong>.</p>
          <p>Event Details:</p>
          <ul>
            <li><strong>Date:</strong> ${eventDetails.startDate}</li>
            <li><strong>Location:</strong> ${eventDetails.venue.address}, ${eventDetails.venue.city
        }, ${eventDetails.venue.country}</li>
          ${eventDetails.onlineLink
          ? `
            <li><strong>Platform:</strong> ${eventDetails.onlineLink.platform
          }</li>
            <li><strong>Meeting URL:</strong> <a href="${eventDetails.onlineLink.url
          }" target="_blank">Join</a></li>
            ${eventDetails.onlineLink.meetingId
            ? `<li><strong>Meeting ID:</strong> ${eventDetails.onlineLink.meetingId}</li>`
            : ""
          }
            ${eventDetails.onlineLink.password
            ? `<li><strong>Password:</strong> ${eventDetails.onlineLink.password}</li>`
            : ""
          }
          `
          : ""
        }
          ${password
          ? `
          <p>Your login details are as follows:</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
          `
          : ""
        }
          <p>If you have any questions or need assistance, feel free to contact our support team.</p>
          <hr />
          <p style="font-size: 12px; color: #777;">This is an automated email, please do not reply.</p>
        </div>
      `,
    };

    try {
      const info = await this.sendMail(fromType, mailOptions);
      console.log("✅ Event registration email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw new Error(
        `Failed to send event registration email: ${error.message}`
      );
    }
  }

  /**
   * Send job proposal email to job creator (job feature is user-to-user, not from Edrilla)
   * This email is sent from the applicant to the job creator, using the applicant's email as the "from" address.
   * Edrilla only relays the email, it is not a proposal to Edrilla.
   */
  async sendJobProposalEmail(jobCreatorEmail, jobCreatorName, jobTitle, proposalDetails, applicant) {
    // applicant: { name, email }
    const attachments = [];
    if (proposalDetails.cv) {
      attachments.push({
        filename: "CV.pdf",
        path: proposalDetails.cv, // Should be a file path or URL accessible to the server
      });
    }

    const mailOptions = {
      from: this.getFrom("support"),
      to: jobCreatorEmail,
      replyTo: applicant.email,
      subject: `New Proposal for Your Job: "${jobTitle}" from ${applicant.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>New Proposal for Your Job</h2>
          <p>Hello <strong>${jobCreatorName}</strong>,</p>
          <p><strong>${applicant.name}</strong> has submitted a proposal for your job post: <strong>${jobTitle}</strong>.</p>
          <p><strong>Proposal Details:</strong></p>
          <ul>
            <li><strong>Cover Letter:</strong> ${proposalDetails.coverLetter || "N/A"}</li>
            <li><strong>Proposed Amount:</strong> ${proposalDetails.proposedAmount ? proposalDetails.proposedAmount : "N/A"}</li>
            <li><strong>Status:</strong> ${proposalDetails.status || "pending"}</li>
            <li><strong>Submitted At:</strong> ${proposalDetails.submittedAt ? new Date(proposalDetails.submittedAt).toLocaleString() : "N/A"}</li>
            <li><strong>Applicant Email:</strong> ${applicant.email}</li>
          </ul>
          ${proposalDetails.cv
          ? `<p><strong>CV is attached to this email.</strong></p>`
          : ""
        }
          <p>You can reply directly to this email to contact the applicant.</p>
          <hr />
          <p style="font-size: 12px; color: #777;">This is an automated email, please do not reply.</p>
        </div>
      `,
      attachments,
      replyTo: applicant.email,
    };

    try {
      const info = await this.sendMail("support", mailOptions);
      console.log("✅ Job proposal email relayed to job creator:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error relaying job proposal email:", error);
      throw new Error(`Failed to relay job proposal email: ${error.message}`);
    }
  }

  /**
   * Send a notification to admin(s) when a new consultation is booked.
   */
  async sendConsultationBookingAdminEmail(adminEmails, booking) {
    const recipients = (Array.isArray(adminEmails) ? adminEmails : [adminEmails])
      .filter(Boolean)
      .join(", ");

    if (!recipients) {
      throw new Error("No admin email recipients provided");
    }

    const slot = booking?.slotId || {};

    const formatDateTime = (value) => {
      if (!value) return "N/A";
      try {
        return new Date(value).toLocaleString("en-IN", {
          dateStyle: "full",
          timeStyle: "short",
          timeZone: "Asia/Kolkata",
        });
      } catch (e) {
        return new Date(value).toLocaleString();
      }
    };

    const statusLabel = (booking.paymentStatus || "free").toUpperCase();
    const amountLabel =
      booking.paymentStatus === "paid" && slot.price ? `₹${slot.price}` : "Free";

    const row = (label, value) => `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #334155; width: 190px;">${label}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #0f172a;">${value || "—"}</td>
      </tr>`;

    const mailOptions = {
      from: this.getFrom("transactional"),
      to: recipients,
      replyTo: booking.email || undefined,
      subject: `New Consultation Booking – ${booking.fullName}`,
      html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:24px;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
          <div style="background:#1f6696; padding:22px 28px;">
            <h2 style="margin:0; color:#ffffff; font-size:20px;">New Consultation Booking</h2>
            <p style="margin:6px 0 0; color:#dbeafe; font-size:13px;">A student has booked a 1-on-1 consultation session.</p>
          </div>
          <div style="padding:24px 28px;">
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              ${row("Name", booking.fullName)}
              ${row("Email", booking.email)}
              ${row("Phone", booking.phone)}
              ${row("Designation", booking.designation)}
              ${row("Department", booking.department)}
              ${row("Institute", booking.institute)}
              ${row("Slot Start", formatDateTime(slot.startTime))}
              ${row("Slot End", formatDateTime(slot.endTime))}
              ${row("Duration", slot.duration ? `${slot.duration} minutes` : "—")}
              ${row("Payment Status", statusLabel)}
              ${row("Amount", amountLabel)}
              ${row("Payment ID", booking.paymentId)}
              ${row("Query", booking.query)}
            </table>
            <p style="margin:22px 0 0; font-size:13px; color:#64748b;">
              ${booking.fileUpload ? "A file was uploaded with this booking." : "No file was uploaded with this booking."}
            </p>
          </div>
          <div style="background:#f8fafc; padding:16px 28px; border-top:1px solid #e5e7eb;">
            <p style="margin:0; font-size:12px; color:#94a3b8;">Automated notification from the Data Knowledge booking system.</p>
          </div>
        </div>
      </div>
      `,
    };

    try {
      const info = await this.sendMail("transactional", mailOptions);
      console.log("✅ Consultation booking email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending consultation booking admin email:", error);
      throw new Error(`Failed to send consultation booking admin email: ${error.message}`);
    }
  }

  /**
   * Send notification to admin(s) when a new contact form message is submitted.
   */
  async sendContactFormAdminEmail(adminEmails, contactRequest) {
    const recipients = (Array.isArray(adminEmails) ? adminEmails : [adminEmails])
      .filter(Boolean)
      .join(", ");

    if (!recipients) {
      throw new Error("No recipient email provided for contact notification");
    }

    const formatDateTime = (value) => {
      if (!value) return "Just now";
      try {
        return new Date(value).toLocaleString("en-IN", {
          dateStyle: "full",
          timeStyle: "short",
          timeZone: "Asia/Kolkata",
        });
      } catch (e) {
        return new Date(value).toLocaleString();
      }
    };

    const row = (label, value) => `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #334155; width: 170px;">${label}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #0f172a;">${value || "—"}</td>
      </tr>`;

    const mailOptions = {
      from: this.getFrom("support"),
      to: recipients,
      replyTo: contactRequest.email || undefined,
      subject: `New Contact Request: ${contactRequest.subject || 'General Inquiry'} – ${contactRequest.name}`,
      html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:24px;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
          <div style="background:#1f6696; padding:22px 28px;">
            <h2 style="margin:0; color:#ffffff; font-size:20px;">New Contact Request</h2>
            <p style="margin:6px 0 0; color:#dbeafe; font-size:13px;">A visitor has submitted a new inquiry via the public Contact page.</p>
          </div>
          <div style="padding:24px 28px;">
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              ${row("Sender Name", contactRequest.name)}
              ${row("Email Address", `<a href="mailto:${contactRequest.email}" style="color:#1f6696; text-decoration:none; font-weight:600;">${contactRequest.email}</a>`)}
              ${row("Phone Number", `<a href="tel:${contactRequest.phone}" style="color:#1f6696; text-decoration:none;">${contactRequest.phone}</a>`)}
              ${row("Subject", contactRequest.subject)}
              ${row("Submitted At", formatDateTime(contactRequest.createdAt))}
              ${row("Source", contactRequest.source || "Contact Form")}
            </table>

            <div style="margin-top:24px; padding:18px; background:#f8fafc; border-left:4px solid #1f6696; border-radius:6px;">
              <p style="margin:0 0 8px; font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Message Details:</p>
              <p style="margin:0; font-size:14px; color:#1e293b; line-height:1.6; white-space:pre-wrap;">${contactRequest.message || "No additional message text provided."}</p>
            </div>

            <p style="margin:22px 0 0; font-size:13px; color:#64748b;">
              You can reply directly to this email to respond to <strong>${contactRequest.name}</strong> (${contactRequest.email}).
            </p>
          </div>
          <div style="background:#f8fafc; padding:16px 28px; border-top:1px solid #e5e7eb;">
            <p style="margin:0; font-size:12px; color:#94a3b8;">Automated notification from Data Knowledge System.</p>
          </div>
        </div>
      </div>
      `,
    };

    try {
      const info = await this.sendMail("support", mailOptions);
      console.log("✅ Contact form admin notification email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending contact form admin email:", error);
      throw new Error(`Failed to send contact form admin email: ${error.message}`);
    }
  }

  /**
   * Send notification to admin(s) when a student submits a query on a course details page.
   */
  async sendCourseQueryAdminEmail(adminEmails, query) {
    const recipients = (Array.isArray(adminEmails) ? adminEmails : [adminEmails])
      .filter(Boolean)
      .join(", ");

    if (!recipients) {
      throw new Error("No recipient email provided for course query notification");
    }

    const formatDateTime = (value) => {
      if (!value) return "Just now";
      try {
        return new Date(value).toLocaleString("en-IN", {
          dateStyle: "full",
          timeStyle: "short",
          timeZone: "Asia/Kolkata",
        });
      } catch (e) {
        return new Date(value).toLocaleString();
      }
    };

    const row = (label, value) => `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #334155; width: 170px;">${label}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; color: #0f172a;">${value || "—"}</td>
      </tr>`;

    const mailOptions = {
      from: this.getFrom("support"),
      to: recipients,
      replyTo: query.email || undefined,
      subject: `New Student Course Query: ${query.courseTitle || 'Course Inquiry'} – ${query.name}`,
      html: `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:24px;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
          <div style="background:#1f6696; padding:22px 28px;">
            <h2 style="margin:0; color:#ffffff; font-size:20px;">New Student Course Query</h2>
            <p style="margin:6px 0 0; color:#dbeafe; font-size:13px;">A student requested a callback / information from a course details page.</p>
          </div>
          <div style="padding:24px 28px;">
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              ${row("Student Name", query.name)}
              ${row("Email Address", `<a href="mailto:${query.email}" style="color:#1f6696; text-decoration:none; font-weight:600;">${query.email}</a>`)}
              ${row("Phone Number", `<a href="tel:${query.phone}" style="color:#1f6696; text-decoration:none;">${query.phone}</a>`)}
              ${row("Course Name", `<strong style="color:#1f6696;">${query.courseTitle || "Course Page Inquiry"}</strong>`)}
              ${row("Category", query.category || "course")}
              ${row("Submitted At", formatDateTime(query.createdAt))}
              ${row("Source", query.source || "Course Details Callback")}
            </table>

            <div style="margin-top:24px; padding:18px; background:#f8fafc; border-left:4px solid #1f6696; border-radius:6px;">
              <p style="margin:0 0 8px; font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Student Query / Questions:</p>
              <p style="margin:0; font-size:14px; color:#1e293b; line-height:1.6; white-space:pre-wrap;">${query.message || "Callback requested."}</p>
            </div>

            <p style="margin:22px 0 0; font-size:13px; color:#64748b;">
              You can reply directly to this email to reach <strong>${query.name}</strong> (${query.email}), or call them at <strong>${query.phone}</strong>.
            </p>
          </div>
          <div style="background:#f8fafc; padding:16px 28px; border-top:1px solid #e5e7eb;">
            <p style="margin:0; font-size:12px; color:#94a3b8;">Automated notification from Data Knowledge Student Inquiries.</p>
          </div>
        </div>
      </div>
      `,
    };

    try {
      const info = await this.sendMail("support", mailOptions);
      console.log("✅ Student course query admin notification email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending student course query admin email:", error);
      throw new Error(`Failed to send student course query admin email: ${error.message}`);
    }
  }
}

export default new EmailService();
