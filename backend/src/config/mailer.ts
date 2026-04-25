import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST ?? 'smtplw.com.br',
  port:   Number(process.env.SMTP_PORT ?? 465),
  secure: true,        // SSL/TLS na porta 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export default transporter;
