const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

function getFromAddress() {
  return process.env.SMTP_FROM || '"Splitty" <no-reply@splitty.app>';
}

function assertMailConfig() {
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
  ];

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing mail configuration: ${missingEnvVars.join(', ')}`);
  }
}

async function sendMail({ to, subject, text, html }) {
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log('[mailer] Email disabled (test mode). Skipping SMTP send to:', to);
    return { skipped: true };
  }

  assertMailConfig();

  return getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });
}

async function sendPasswordResetEmail({ to, username, resetUrl }) {
  const subject = 'Reset your Splitty password';
  const text = [
    `Hi ${username || 'there'},`,
    '',
    'We received a request to reset your Splitty password.',
    'Use the link below to choose a new password:',
    resetUrl,
    '',
    'This link expires in 15 minutes.',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  const html = [
    `<p>Hi ${username || 'there'},</p>`,
    '<p>We received a request to reset your Splitty password.</p>',
    '<p>Use the button below to choose a new password:</p>',
    `<p><a href="${resetUrl}">Click Here to Reset Your Password</a></p>`,
    '<p>This link expires in 15 minutes.</p>',
    '<p>If you did not request this, you can ignore this email.</p>',
  ].join('');

  return sendMail({
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendMail,
  sendPasswordResetEmail,
};
