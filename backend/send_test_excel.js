import XLSX from 'xlsx';
import emailService from './utils/emailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const wb = XLSX.utils.book_new();
const data = [
  ['Name', 'Email', 'Course', 'Status', 'Date'],
  ['Anshul Jha', 'anshuljha1149@gmail.com', 'AI Live Cohort', 'Completed', new Date().toISOString().split('T')[0]],
];
const ws = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'Students');

const filePath = path.join(__dirname, 'test_certificates.xlsx');
XLSX.writeFile(wb, filePath);

const info = await emailService.sendMail('transactional', {
  from: emailService.getFrom('transactional'),
  to: 'anshuljha1149@gmail.com',
  subject: 'Test Excel File - Certificate Report',
  text: 'Please find attached the test Excel file.',
  attachments: [{ filename: 'test_certificates.xlsx', path: filePath }],
});

console.log('Sent:', info.messageId);
