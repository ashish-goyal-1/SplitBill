/**
 * Email Service using Nodemailer + Gmail
 * Handles all email sending functionality for SplitBill
 */

const nodemailer = require('nodemailer');

// Create transporter with Gmail
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // App password, not regular password
        }
    });
};

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of email
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async (to, subject, html) => {
    try {
        // Skip if email not configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('[Email] Email not configured, skipping:', subject);
            return false;
        }

        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || `SplitBill <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[Email] Sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('[Email] Failed to send:', error.message);
        return false;
    }
};

/**
 * Send payment reminder to a user who owes money
 * @param {string} userEmail - User's email
 * @param {Array} debts - Array of {to, amount, groupName}
 * @param {string} currency - Currency symbol
 */
const sendPaymentReminder = async (userEmail, debts, currency = '₹') => {
    const totalOwed = debts.reduce((sum, d) => sum + d.amount, 0);

    const debtsList = debts.map(d => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${d.groupName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${d.to}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #e74c3c;">
                ${currency}${d.amount.toLocaleString()}
            </td>
        </tr>
    `).join('');

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">💰 Payment Reminder</h1>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; color: #333;">Hi there,</p>
                    <p style="font-size: 16px; color: #333;">
                        You have pending payments totaling <strong style="color: #e74c3c;">${currency}${totalOwed.toLocaleString()}</strong>
                    </p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 12px; text-align: left;">Group</th>
                                <th style="padding: 12px; text-align: left;">Pay To</th>
                                <th style="padding: 12px; text-align: left;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${debtsList}
                        </tbody>
                    </table>

                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.APP_URL || 'http://localhost:3000'}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                            Settle Now
                        </a>
                    </div>
                </div>
                <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px;">
                    Sent by SplitBill • <a href="#" style="color: #667eea;">Unsubscribe</a>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail(userEmail, `💰 You owe ${currency}${totalOwed.toLocaleString()} - Payment Reminder`, html);
};

/**
 * Notify group members about a new expense
 * @param {Array} memberEmails - Array of member emails (excluding expense owner)
 * @param {Object} expense - Expense details
 * @param {string} groupName - Name of the group
 * @param {string} currency - Currency symbol
 */
const sendExpenseNotification = async (memberEmails, expense, groupName, currency = '₹') => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">📝 New Expense Added</h1>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 16px; color: #333;">
                        <strong>${expense.expenseOwner}</strong> added a new expense in <strong>${groupName}</strong>
                    </p>
                    
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">${expense.expenseName}</h3>
                        <p style="margin: 5px 0; color: #666;">
                            Total: <strong style="color: #11998e; font-size: 20px;">${currency}${expense.expenseAmount?.toLocaleString()}</strong>
                        </p>
                        <p style="margin: 5px 0; color: #666;">
                            Your share: <strong>${currency}${expense.expensePerMember?.toLocaleString()}</strong>
                        </p>
                        <p style="margin: 5px 0; color: #888; font-size: 14px;">
                            ${new Date(expense.expenseDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${process.env.APP_URL || 'http://localhost:3000'}" 
                           style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                            View Details
                        </a>
                    </div>
                </div>
                <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px;">
                    Sent by SplitBill • <a href="#" style="color: #11998e;">Unsubscribe</a>
                </div>
            </div>
        </body>
        </html>
    `;

    // Send to all members
    const results = await Promise.all(
        memberEmails.map(email =>
            sendEmail(email, `📝 New expense in ${groupName}: ${expense.expenseName}`, html)
        )
    );

    return results.every(r => r);
};

/**
 * Send settlement confirmation
 * @param {string} fromEmail - Person who paid
 * @param {string} toEmail - Person who received
 * @param {number} amount - Amount settled
 * @param {string} groupName - Group name
 * @param {string} currency - Currency symbol
 */
const sendSettlementConfirmation = async (fromEmail, toEmail, amount, groupName, currency = '₹') => {
    const createHtml = (isPayee) => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">✅ Settlement Complete</h1>
                </div>
                <div style="padding: 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🤝</div>
                    <p style="font-size: 18px; color: #333;">
                        ${isPayee
            ? `<strong>${fromEmail}</strong> paid you`
            : `You paid <strong>${toEmail}</strong>`
        }
                    </p>
                    <p style="font-size: 36px; font-weight: bold; color: #667eea; margin: 20px 0;">
                        ${currency}${amount.toLocaleString()}
                    </p>
                    <p style="color: #888;">in ${groupName}</p>
                </div>
                <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #888; font-size: 12px;">
                    Sent by SplitBill
                </div>
            </div>
        </body>
        </html>
    `;

    // Send to both parties
    await Promise.all([
        sendEmail(fromEmail, `✅ You paid ${currency}${amount} to ${toEmail}`, createHtml(false)),
        sendEmail(toEmail, `✅ ${fromEmail} paid you ${currency}${amount}`, createHtml(true))
    ]);
};

module.exports = {
    sendEmail,
    sendPaymentReminder,
    sendExpenseNotification,
    sendSettlementConfirmation
};
