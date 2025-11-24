const { emailLogs } = require('../models/dataStore');

function sendEmail(to, subject, body) {
    const email = {
        to,
        subject,
        body,
        sentAt: new Date().toISOString(),
        status: 'sent'
    };
    emailLogs.push(email);
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    return true;
}

module.exports = { sendEmail };
