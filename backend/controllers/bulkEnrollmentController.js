import XLSX from 'xlsx';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import CourseEnrollment from '../models/CourseEnrollment.js';
import Course from '../models/Course.js';
import CourseChatRoom from '../models/CourseChatRoom.js';
import CoursePlan from '../models/CoursePlan.js';

/**
 * Derive a display name from an email address.
 * e.g. "john.doe123@gmail.com" → "John Doe"
 */
function nameFromEmail(email) {
    const local = email.split('@')[0];
    return local
        .replace(/[._\-+]/g, ' ')
        .replace(/\d+/g, '')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ') || 'Student';
}

/**
 * Add a user to the course chat room (community access).
 */
async function addUserToCourseChat(userId, courseId) {
    try {
        const room = await CourseChatRoom.findOne({ courseId });
        if (room && !room.participants.map(String).includes(String(userId))) {
            room.participants.push(userId);
            await room.save();
        }
    } catch (err) {
        console.error(`❌ Chat-room add failed for user ${userId}:`, err.message);
    }
}

/**
 * POST /enrollment/bulk-enroll
 *
 * Body (multipart/form-data):
 *   file       - Excel (.xlsx / .xls) with at least "email" and optionally "phone" columns
 *   courseId   - MongoDB ObjectId of the target course
 *   planId     - MongoDB ObjectId of the course plan
 *   accessExpiry - ISO date string for course expiry (default: 2026-09-10)
 *
 * OR Body (application/json) if you want to use the embedded Excel stored on disk:
 *   courseId, planId, accessExpiry, filePath (absolute server path)
 */
export const bulkEnrollFromExcel = async (req, res) => {
    const results = { enrolled: [], created: [], skipped: [], errors: [] };

    try {
        const courseId = req.body.courseId;
        const planId = req.body.planId;
        const accessExpiry = req.body.accessExpiry
            ? new Date(req.body.accessExpiry)
            : new Date('2026-09-10T23:59:59.000Z');

        if (!courseId || !planId) {
            return res.status(400).json({
                success: false,
                message: 'courseId and planId are required in the request body.',
            });
        }

        // ── 1. Read the workbook ─────────────────────────────────────────────────
        let workbook;
        if (req.file) {
            // Uploaded via multipart
            workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        } else if (req.body.filePath) {
            workbook = XLSX.readFile(req.body.filePath);
        } else {
            return res.status(400).json({
                success: false,
                message: 'No Excel file provided. Upload a file or supply a filePath.',
            });
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet); // uses first row as headers

        if (!rows.length) {
            return res.status(400).json({ success: false, message: 'Excel sheet is empty.' });
        }

        // ── 2. Verify course exists ──────────────────────────────────────────────
        const course = await Course.findById(courseId).lean();
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        // ── 3. Process each row ──────────────────────────────────────────────────
        for (const row of rows) {
            // Normalise column names (handles variations like "Email", "EMAIL", "email")
            const email = (
                row['email'] || row['Email'] || row['EMAIL'] || ''
            ).toString().trim().toLowerCase();

            const phone = (
                row['phone'] || row['Phone'] || row['PHONE'] ||
                row['mobile'] || row['Mobile'] || ''
            ).toString().trim();

            if (!email || !email.includes('@')) {
                results.errors.push({ row, reason: 'Invalid or missing email' });
                continue;
            }

            // Only skip if status is present and NOT 'captured' or 'success'
            const rawStatus = (row['payment status'] || row['Payment Status'] || row['status'] || '').toString().trim().toLowerCase();
            if (rawStatus && rawStatus !== 'captured' && rawStatus !== 'success') {
                results.skipped.push({ email, reason: `Payment status is '${rawStatus}', not 'captured' or 'success'.` });
                continue;
            }

            try {
                // ── 3a. Find or create user ──────────────────────────────────────────
                let user = await User.findOne({ email });
                let isNewUser = false;

                if (!user) {
                    const hashedPwd = await bcrypt.hash('Student@123', 10);
                    user = await User.create({
                        fullName: nameFromEmail(email),
                        email,
                        password: hashedPwd,
                        role: 'student',
                        phone: phone || undefined,
                        is_verify: true,
                        emailVerified: true,
                    });
                    isNewUser = true;
                    results.created.push(email);
                }

                const userId = user._id;

                // ── 3b. Check existing enrollment ────────────────────────────────────
                const existing = await CourseEnrollment.findOne({ userId, courseId });

                if (existing) {
                    const now = new Date();
                    const isExpired =
                        existing.accessExpiry && existing.accessExpiry < now;

                    if (existing.status === 'active' && !isExpired) {
                        results.skipped.push({ email, reason: 'Already enrolled and active' });
                        // Still ensure community chat access
                        await addUserToCourseChat(userId, courseId);
                        continue;
                    }

                    // Renew expired enrollment
                    await CourseEnrollment.findByIdAndUpdate(existing._id, {
                        status: 'active',
                        enrolledAt: new Date(),
                        accessExpiry,
                        accessType: 'limited',
                        enrollmentSource: 'import',
                        coursePlanId: planId,
                    });
                    await addUserToCourseChat(userId, courseId);
                    results.enrolled.push({ email, action: 'renewed', userId });
                    continue;
                }

                // ── 3c. Create fresh enrollment ──────────────────────────────────────
                await CourseEnrollment.create({
                    userId,
                    courseId,
                    coursePlanId: planId,
                    type: 'coursePlan',
                    status: 'active',
                    accessType: 'limited',
                    accessExpiry,
                    enrollmentSource: 'import',
                    enrolledAt: new Date(),
                });

                // Update Course.enrolledStudents
                await Course.findByIdAndUpdate(courseId, {
                    $addToSet: { enrolledStudents: userId },
                    $inc: { enrolledStudentsCount: 1 },
                });

                // Community chat access
                await addUserToCourseChat(userId, courseId);

                results.enrolled.push({
                    email,
                    action: isNewUser ? 'created+enrolled' : 'enrolled',
                    userId,
                });

            } catch (rowErr) {
                results.errors.push({ email, reason: rowErr.message });
            }
        }

        // ── 4. Invalidate enrollment cache ───────────────────────────────────────
        try {
        } catch (_) { /* cache clear is non-critical */ }

        return res.status(200).json({
            success: true,
            message: 'Bulk enrollment complete.',
            summary: {
                total: rows.length,
                enrolled: results.enrolled.length,
                created: results.created.length,
                skipped: results.skipped.length,
                errors: results.errors.length,
            },
            details: results,
        });

    } catch (err) {
        console.error('❌ bulkEnrollFromExcel error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Migration enrollment controller
 */
export const enrollFromMigration = async (req, res) => {
    const results = { enrolled: [], skipped: [], errors: [] };

    try {
        const sourceCourseId = '68cd611b764a92c354346a4c';
        const sourcePlanId = '68d14ab6863c4aa13942389d';
        const targetCourseId = '6a1f02677a8d1f8e480a783a';
        const targetPlanId = '6a1f02677a8d1f8e480a7841';

        // Expiry fixed to Sep 10 2026
        const targetExpiry = new Date('2026-09-10T23:59:59.000Z');

        // Expiry filter: more than a month left (30 days)
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setDate(oneMonthFromNow.getDate() + 30);

        // 1. Find source enrollments
        const sourceEnrollments = await CourseEnrollment.find({
            courseId: sourceCourseId,
            coursePlanId: sourcePlanId,
            status: 'active',
            accessExpiry: { $gt: oneMonthFromNow }
        }).populate('userId', 'email fullName');

        if (!sourceEnrollments.length) {
            return res.status(200).json({
                success: true,
                message: 'No students found matching the migration criteria.',
                summary: { totalSourceFound: 0 }
            });
        }

        // 2. Verify target course
        const targetCourse = await Course.findById(targetCourseId).lean();
        if (!targetCourse) {
            return res.status(404).json({ success: false, message: 'Target Course not found.' });
        }

        // 3. Process each student
        for (const enrollment of sourceEnrollments) {
            const user = enrollment.userId;
            if (!user) continue;

            const userId = user._id;
            const email = user.email || 'unknown';

            try {
                // Check if already enrolled in target
                const existingTarget = await CourseEnrollment.findOne({
                    userId,
                    courseId: targetCourseId
                });

                if (existingTarget) {
                    const isExpired = existingTarget.accessExpiry && existingTarget.accessExpiry < new Date();

                    if (existingTarget.status === 'active' && !isExpired) {
                        results.skipped.push({ email, reason: 'Already active in target course' });
                        await addUserToCourseChat(userId, targetCourseId);
                        continue;
                    }

                    // Renew/Update
                    await CourseEnrollment.findByIdAndUpdate(existingTarget._id, {
                        status: 'active',
                        enrolledAt: new Date(),
                        accessExpiry: targetExpiry,
                        coursePlanId: targetPlanId,
                        enrollmentSource: 'migration'
                    });
                } else {
                    // Fresh enrollment in target
                    await CourseEnrollment.create({
                        userId,
                        courseId: targetCourseId,
                        coursePlanId: targetPlanId,
                        type: 'coursePlan',
                        status: 'active',
                        accessType: 'limited',
                        accessExpiry: targetExpiry,
                        enrollmentSource: 'migration',
                        enrolledAt: new Date()
                    });

                    // Update Course total
                    await Course.findByIdAndUpdate(targetCourseId, {
                        $addToSet: { enrolledStudents: userId },
                        $inc: { enrolledStudentsCount: 1 },
                    });
                }

                // Community chat access
                await addUserToCourseChat(userId, targetCourseId);
                results.enrolled.push({ email, userId });

            } catch (err) {
                results.errors.push({ email, reason: err.message });
            }
        }

        // 4. Invalidate cache
        try {
        } catch (_) { }

        return res.status(200).json({
            success: true,
            message: 'Migration enrollment complete.',
            summary: {
                totalSourceFound: sourceEnrollments.length,
                successfullyEnrolled: results.enrolled.length,
                skipped: results.skipped.length,
                errors: results.errors.length
            },
            details: results
        });

    } catch (err) {
        console.error('❌ enrollFromMigration error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /enrollment/bulk-enroll-special
 * 
 * Same as bulkEnrollFromExcel but ALSO enrolls every student into
 * the secondary course (69aebfc38e1d5253aca58f29) with expiry Sep 8 2026.
 */
export const bulkEnrollSpecial = async (req, res) => {
    const results = { enrolled: [], created: [], skipped: [], errors: [], secondary: [] };

    try {
        const courseId = req.body.courseId;
        const planId = req.body.planId;
        const accessExpiry = req.body.accessExpiry
            ? new Date(req.body.accessExpiry)
            : new Date('2026-09-10T23:59:59.000Z');

        const secondaryCourseId = '69aebfc38e1d5253aca58f29';
        let secondaryPlanId = '69aebfc38e1d5253aca58f2b'; // Fallback
        let secondaryEnrollmentType = 'coursePlan';

        // Try to find a valid CoursePlan for the secondary course
        try {
            const foundPlan = await CoursePlan.findOne({ courseId: secondaryCourseId });
            if (foundPlan) {
                secondaryPlanId = foundPlan._id;
            } else {
                secondaryEnrollmentType = 'course'; // No plan found, use direct course enrollment
            }
        } catch (err) {
            console.warn('⚠️ Could not fetch secondary course plan, falling back to basic or direct course type:', err.message);
            secondaryEnrollmentType = 'course';
        }

        const secondaryExpiry = new Date('2026-09-08T23:59:59.000Z');

        if (!courseId || !planId) {
            return res.status(400).json({
                success: false,
                message: 'courseId and planId are required in the request body.',
            });
        }

        // 1. Read workbook
        let workbook;
        if (req.file) {
            workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        } else if (req.body.filePath) {
            workbook = XLSX.readFile(req.body.filePath);
        } else {
            return res.status(400).json({
                success: false,
                message: 'No Excel file provided.',
            });
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (!rows.length) {
            return res.status(400).json({ success: false, message: 'Excel sheet is empty.' });
        }

        // 2. Verify primary course
        const course = await Course.findById(courseId).lean();
        if (!course) {
            return res.status(404).json({ success: false, message: 'Primary course not found.' });
        }

        // 3. Process rows
        for (const row of rows) {
            const email = (row['email'] || row['Email'] || row['EMAIL'] || '').toString().trim().toLowerCase();
            const phone = (row['phone'] || row['Phone'] || row['PHONE'] || row['mobile'] || row['Mobile'] || '').toString().trim();

            if (!email || !email.includes('@')) {
                results.errors.push({ row, reason: 'Invalid or missing email' });
                continue;
            }

            // Payment status check
            const rawStatus = (row['payment status'] || row['Payment Status'] || row['status'] || '').toString().trim().toLowerCase();
            if (rawStatus && rawStatus !== 'captured' && rawStatus !== 'success') {
                results.skipped.push({ email, reason: `Payment status is '${rawStatus}'` });
                continue;
            }

            try {
                // Find or create user
                let user = await User.findOne({ email });
                let isNewUser = false;

                if (!user) {
                    const hashedPwd = await bcrypt.hash('Student@123', 10);
                    user = await User.create({
                        fullName: nameFromEmail(email),
                        email,
                        password: hashedPwd,
                        role: 'student',
                        phone: phone || undefined,
                        is_verify: true,
                        emailVerified: true,
                    });
                    isNewUser = true;
                    results.created.push(email);
                }

                const userId = user._id;

                // --- 3a. Primary Enrollment ---
                const existing = await CourseEnrollment.findOne({ userId, courseId });
                let primaryAction = 'none';

                if (existing) {
                    const isExpired = existing.accessExpiry && existing.accessExpiry < new Date();
                    if (existing.status !== 'active' || isExpired) {
                        await CourseEnrollment.findByIdAndUpdate(existing._id, {
                            status: 'active',
                            enrolledAt: new Date(),
                            accessExpiry,
                            coursePlanId: planId,
                            enrollmentSource: 'import',
                        });
                        primaryAction = 'renewed';
                    } else {
                        primaryAction = 'already_active';
                    }
                } else {
                    await CourseEnrollment.create({
                        userId, courseId, coursePlanId: planId,
                        type: 'coursePlan', status: 'active', accessType: 'limited',
                        accessExpiry, enrollmentSource: 'import', enrolledAt: new Date(),
                    });
                    await Course.findByIdAndUpdate(courseId, {
                        $addToSet: { enrolledStudents: userId },
                        $inc: { enrolledStudentsCount: 1 },
                    });
                    primaryAction = 'enrolled';
                }
                await addUserToCourseChat(userId, courseId);
                results.enrolled.push({ email, action: primaryAction, userId });

                // --- 3b. Secondary Enrollment (Special) ---
                const existingSec = await CourseEnrollment.findOne({ userId, courseId: secondaryCourseId });
                let secAction = 'none';

                if (existingSec) {
                    const isExpired = existingSec.accessExpiry && existingSec.accessExpiry < new Date();
                    if (existingSec.status !== 'active' || isExpired) {
                        await CourseEnrollment.findByIdAndUpdate(existingSec._id, {
                            status: 'active',
                            enrolledAt: new Date(),
                            accessExpiry: secondaryExpiry,
                            coursePlanId: secondaryPlanId,
                        });
                        secAction = 'renewed';
                    } else {
                        secAction = 'already_active';
                    }
                } else {
                    await CourseEnrollment.create({
                        userId,
                        courseId: secondaryCourseId,
                        coursePlanId: secondaryEnrollmentType === 'coursePlan' ? secondaryPlanId : undefined,
                        type: secondaryEnrollmentType,
                        status: 'active',
                        accessType: 'limited',
                        accessExpiry: secondaryExpiry,
                        enrollmentSource: 'import',
                        enrolledAt: new Date(),
                    });
                    await Course.findByIdAndUpdate(secondaryCourseId, {
                        $addToSet: { enrolledStudents: userId },
                        $inc: { enrolledStudentsCount: 1 },
                    });
                    secAction = 'enrolled';
                }
                await addUserToCourseChat(userId, secondaryCourseId);
                results.secondary.push({ email, action: secAction });

            } catch (rowErr) {
                results.errors.push({ email, reason: rowErr.message });
            }
        }

        // 4. Cache clear
        try {
        } catch (_) { }

        return res.status(200).json({
            success: true,
            message: 'Special bulk enrollment complete.',
            summary: {
                total: rows.length,
                primaryEnrolled: results.enrolled.length,
                secondaryEnrolled: results.secondary.length,
                errors: results.errors.length,
            },
            details: results,
        });

    } catch (err) {
        console.error('❌ bulkEnrollSpecial error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};
