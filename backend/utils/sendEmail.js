import emailService from './emailService.js';

const sendEmail = async (to, textOrHtml, subject) => {
  try {
    const transporter = emailService.getTransporter('transactional');
    const from = emailService.getFrom('transactional');
    const isHtml = typeof textOrHtml === 'string' && /<[a-z][\s\S]*>/i.test(textOrHtml);
    await transporter.sendMail({
      from,
      to,
      subject: subject || 'Notification',
      ...(isHtml ? { html: textOrHtml } : { text: textOrHtml }),
    });
  } catch (error) {
    console.error('❌ Email send failed:', error);
    throw new Error(error.message);
  }
};

export default sendEmail;

