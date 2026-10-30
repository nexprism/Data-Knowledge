import mongoose from 'mongoose';
import Certificate from '../models/Certificate.js';
import Course from '../models/Course.js';
import User from '../models/user.js';
import CertificateTemplate from '../models/CertificateTemplate.js';
import CourseEnrollment from '../models/CourseEnrollment.js';
import { generatePdfForCertificate } from '../controllers/certificateController.js';

export const autoGenerateCertificate = async (userId, courseId, customTemplateId = null) => {
  try {
    console.log(`[autoGenerateCertificate] Starting helper for userId: ${userId}, courseId: ${courseId}, customTemplateId: ${customTemplateId}`);

    // 1. Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      user_id: userId,
      course_id: courseId,
      type: 'course'
    });

    if (existingCertificate) {
      console.log(`[autoGenerateCertificate] Certificate already exists: ${existingCertificate._id}`);
      return existingCertificate;
    }

    // 2. Fetch Course details
    const course = await Course.findById(courseId).lean();
    if (!course) {
      console.error(`[autoGenerateCertificate] Course with ID ${courseId} not found`);
      throw new Error(`Course not found: ${courseId}`);
    }

    console.log(`[autoGenerateCertificate] Course found: "${course.title}". certificateTemplate field value: "${course.certificateTemplate}"`);

    // 3. Resolve template ID
    let templateId = null;
    if (customTemplateId && mongoose.Types.ObjectId.isValid(customTemplateId)) {
      templateId = customTemplateId;
      console.log(`[autoGenerateCertificate] Prioritizing customTemplateId from request: ${templateId}`);
    } else if (course.certificateTemplate && mongoose.Types.ObjectId.isValid(course.certificateTemplate)) {
      templateId = course.certificateTemplate;
      console.log(`[autoGenerateCertificate] Using course-defined template ID: ${templateId}`);
    } else {
      // If template is explicitly set to "false" or disabled and no custom template is provided, do not generate
      if (course.certificateTemplate === 'false') {
        console.log(`[autoGenerateCertificate] Certificate generation is disabled ('false') for course: ${course.title} and no custom template was requested.`);
        return null;
      }

      // Fallback to the latest published course template
      const defaultTemplate = await CertificateTemplate.findOne({
        type: 'course',
        status: 'publish'
      }).sort({ createdAt: -1 }).lean();
      
      templateId = defaultTemplate?._id || null;
      console.log(`[autoGenerateCertificate] Fallback to latest published course template: ${templateId} (${defaultTemplate?.title || 'None'})`);
    }

    if (!templateId) {
      console.warn(`[autoGenerateCertificate] No certificate template found for course: ${course.title}. Skipping automatic generation.`);
      return null;
    }

    // 4. Fetch student and instructor details
    const student = await User.findById(userId).select('fullName').lean();
    if (!student) {
      throw new Error(`Student not found: ${userId}`);
    }

    const instructor = await User.findById(course.instructorId).select('fullName').lean();
    const instructorName = instructor?.fullName || "Instructor";

    // 5. Generate a unique serial number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const serialNumber = `CERT-${dateStr}-${Date.now().toString(16).toUpperCase()}-${randomSuffix}`;

    // 6. Create the Certificate record in database
    const certificate = await Certificate.create({
      user_id: userId,
      course_id: courseId,
      type: 'course',
      status: 'issued',
      issued_at: new Date(),
      certification_template: templateId,
      serial_number: serialNumber,
      instructor_id: course.instructorId || null,
      instructor_name: instructorName,
      completion_date: new Date(),
      remarks: 'Automatically generated on course completion',
      grade: 'A',
    });

    // 7. Generate PDF and save file path
    try {
      await generatePdfForCertificate(certificate);
    } catch (pdfErr) {
      console.error(`Error rendering PDF for certificate ${certificate._id}:`, pdfErr.message);
    }

    // 8. Update CourseEnrollment record
    await CourseEnrollment.findOneAndUpdate(
      { userId, courseId },
      {
        certificateIssued: true,
        certificateIssuedAt: new Date(),
        iscompleted: true,
        completedAt: new Date()
      }
    );

    console.log(`Successfully auto-generated certificate for student: ${student.fullName} in course: ${course.title}`);
    return certificate;
  } catch (error) {
    console.error('autoGenerateCertificate helper error:', error.message);
    throw error;
  }
};
