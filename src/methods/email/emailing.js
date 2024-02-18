import e from 'express';
import SibApiV3Sdk from 'sib-api-v3-sdk';

export async function sendVerificationEmail(email, code) {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;
    // Configure API key authorization
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.EMAIL_API_KEY;

    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    let year = new Date().getFullYear();

    sendSmtpEmail.subject = "Verify Your Email";
    sendSmtpEmail.htmlContent = `<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Code</title><style>body{font-family:Arial,sans-serif;font-size:16px;background-color:#f4f4f4;margin:0;padding:0}.email-container{max-width:600px;margin:40px auto;background:#fff;border:1px solid #ddd}.email-header{background-color:#007bff;color:#fff;padding:20px;text-align:center}.email-body{padding:20px;text-align:center}.code{font-size:24px;color:#007bff;margin:20px 0;padding:10px;border:1px dashed #007bff;display:inline-block}.footer{text-align:center;color:#777;font-size:14px;padding:20px}</style></head><body><div class="email-container"><div class="email-header"><h1>Verification code</h1></div><div class="email-body"><p>Hello,</p><p>Thank you for choosing Attendora! Here is your verification code:</p><div class="code">${code}</div><p>Use this code at signup to verify your email</p><p>If you have any questions, feel free to contact us.</p><a href="mailto:questions@attendora.com" style="color:#007bff">questions@attendora.com</a></div><div class="footer">&copy; ${year} Attendora. All rights reserved.</div></div></body></html>`;
    sendSmtpEmail.sender = { "name": "Attendora", "email": "no-reply@attendora.com" };
    sendSmtpEmail.to = [{ "email": email }];

    try {
        let data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent Succesfully');
    } catch (error) {
        console.error(error);
    }
}