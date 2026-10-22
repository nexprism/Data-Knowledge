import mongoose from 'mongoose';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import Certificate from './models/Certificate.js';
import User from './models/user.js';
import Course from './models/Course.js';
import CertificateTemplate from './models/CertificateTemplate.js';
import { generateCertificatePDF } from './utils/certificateGenerator.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lms_backend';

import emailService from './utils/emailService.js';

async function sendCertificateEmail(certificateId) {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const cert = await Certificate.findById(certificateId).lean();
    if (!cert) { console.error('Certificate not found'); await mongoose.disconnect(); return; }

    const user = await User.findById(cert.user_id).select('email fullName').lean();
    const course = cert.course_id ? await Course.findById(cert.course_id).select('title').lean() : null;

    const studentEmail = user?.email;
    const studentName = user?.fullName || 'Student';
    const courseName = 'Become an Ai Builder in 30 Days';

    if (!studentEmail) { console.error('Student email not found'); await mongoose.disconnect(); return; }

    const template = cert.certification_template
      ? await CertificateTemplate.findById(cert.certification_template).lean() : null;

    let pdfPath;

    if (template && user) {
      const instructor = cert.instructor_id
        ? await User.findById(cert.instructor_id).select('fullName').lean() : null;

      const certificateData = {
        student_name: studentName,
        course_name: 'Become an Ai Builder in 30 Days',
        completion_date: cert.completion_date ? new Date(cert.completion_date) : new Date(),
        instructor_name: instructor?.fullName || cert.instructor_name || 'Instructor',
        platform_name: 'Edrilla',
        serial_number: cert.serial_number || '',
        extra_lines: [
          'for participating in the AI Live Cohort',
          'conducted from June 5 to July 10, 2026',
          '',
          '"The future belongs to those who learn, unlearn, and relearn."',
          '"AI is not going to replace you - a person using AI will."',
        ],
      };

      const newUrl = await generateCertificatePDF({ template, certificateData });
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const fileName = `certificate_${cert._id}.pdf`;
      const newPath = path.join(uploadsDir, fileName);
      const newRelativePath = `uploads/${fileName}`;
      const tempPath = path.join(process.cwd(), newUrl);
      if (fs.existsSync(tempPath)) {
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
        fs.renameSync(tempPath, newPath);
      }
      pdfPath = newPath;
      await Certificate.findByIdAndUpdate(cert._id, { certificate_url: newRelativePath });
    } else if (cert.certificate_url) {
      const p = path.join(process.cwd(), cert.certificate_url);
      if (fs.existsSync(p)) pdfPath = p;
    }

    if (!pdfPath || !fs.existsSync(pdfPath)) { console.error('PDF not found'); await mongoose.disconnect(); return; }

    const completionDate = cert.completion_date
      ? new Date(cert.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

    await emailService.sendMail('transactional', {
      from: emailService.getFrom('transactional'),
      to: studentEmail,
      subject: `Your Certificate for ${courseName} - Data Knowledge`,
      html: `<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;background:#f4f7fa;padding:40px 10px}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden}.header{background:#0d1b2a;padding:50px 30px;text-align:center;border-bottom:5px solid #B1E346}.header h1{color:#fff;margin:0;font-size:32px;letter-spacing:6px}.content{padding:40px 35px}.content h2{color:#0d1b2a}.footer{background:#0d1b2a;padding:40px;text-align:center;color:#94a3b8}</style></head><body><div class="container"><div class="header"><h1>DATA KNOWLEDGE</h1></div><div class="content"><h2>Congratulations, ${studentName}!</h2><p>You have successfully completed <strong>${courseName}</strong>${completionDate ? ` on <strong>${completionDate}</strong>` : ''}.</p><p>Your certificate is attached.</p></div><div class="footer"><p style="color:#fff;font-size:18px;font-weight:bold">DATA KNOWLEDGE</p><p>Warm Regards,<br>Team Data Knowledge</p></div></div></body></html>`,
      attachments: [{ filename: `Certificate_${courseName.replace(/\s+/g, '_')}.pdf`, path: pdfPath }],
    });

    console.log(`Certificate email sent to ${studentEmail}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

const id = process.argv[2];
if (!id) { console.log('Usage: node send_certificate_email.js <certificateId>'); process.exit(1); }
sendCertificateEmail(id);
