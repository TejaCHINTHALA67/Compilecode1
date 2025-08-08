const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendOTP(email, otp, userName) {
    try {
      const mailOptions = {
        from: `"StartupLink" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your StartupLink Login OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">StartupLink</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your secure login code</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${userName},</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                You requested a login code for your StartupLink account. Use the code below to complete your login:
              </p>
              
              <div style="background: #fff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${otp}</span>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                <strong>This code will expire in 10 minutes.</strong>
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                If you didn't request this code, please ignore this email or contact our support team.
              </p>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 12px;">
                  © 2024 StartupLink. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAccountConfirmation(email, userData) {
    try {
      const mailOptions = {
        from: `"StartupLink" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Welcome to StartupLink - Your Account is Ready!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">StartupLink</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Welcome to the future of startup investment</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin: 0 0 20px 0;">Welcome ${
                userData.firstName
              }!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Thank you for joining StartupLink! Your account has been successfully created and you're now part of our growing community of entrepreneurs and investors.
              </p>
              
              <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">Your Account Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Name:</strong></td>
                    <td style="padding: 8px 0; color: #333;">${
                      userData.firstName
                    } ${userData.lastName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                    <td style="padding: 8px 0; color: #333;">${
                      userData.email
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Unique ID:</strong></td>
                    <td style="padding: 8px 0; color: #333; font-family: monospace; font-weight: bold;">${
                      userData.uniqueId
                    }</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Account Type:</strong></td>
                    <td style="padding: 8px 0; color: #333;">${
                      userData.userType.charAt(0).toUpperCase() +
                      userData.userType.slice(1)
                    }</td>
                  </tr>
                  ${
                    userData.businessName
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666;"><strong>Business:</strong></td>
                    <td style="padding: 8px 0; color: #333;">${userData.businessName}</td>
                  </tr>
                  `
                      : ''
                  }
                </table>
              </div>
              
              <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 15px; margin: 25px 0;">
                <h4 style="color: #2e7d32; margin: 0 0 10px 0;">🔐 Secure Login with Unique ID + OTP</h4>
                <p style="color: #2e7d32; margin: 0; font-size: 14px;">
                  Use your Unique ID and email to login. We'll send you a secure OTP code for verification.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="${
                  process.env.FRONTEND_URL || 'https://startuplink.app'
                }" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                  Get Started
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <h4 style="color: #333; margin: 0 0 15px 0;">What's Next?</h4>
                <ul style="color: #666; line-height: 1.6; padding-left: 20px;">
                  <li>Complete your profile and upload required documents</li>
                  <li>Explore startups or connect with investors</li>
                  <li>Join our community discussions</li>
                  <li>Start your investment journey</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 12px;">
                  © 2024 StartupLink. All rights reserved.<br>
                  If you have any questions, contact us at support@startuplink.app
                </p>
              </div>
            </div>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        'Account confirmation email sent successfully:',
        result.messageId,
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending account confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendDocumentUploadConfirmation(email, userName, documentType) {
    try {
      const mailOptions = {
        from: `"StartupLink" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Document Upload Confirmation - StartupLink',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">StartupLink</h1>
              <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Document upload confirmation</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin: 0 0 20px 0;">Hello ${userName},</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                We've successfully received your uploaded document: <strong>${documentType}</strong>
              </p>
              
              <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #333; margin: 0 0 15px 0;">Document Details:</h3>
                <p style="color: #666; margin: 0;"><strong>Type:</strong> ${documentType}</p>
                <p style="color: #666; margin: 5px 0;"><strong>Status:</strong> <span style="color: #ff9800;">Under Review</span></p>
                <p style="color: #666; margin: 5px 0;"><strong>Uploaded:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Our team will review your document within 1-2 business days. You'll receive a notification once the review is complete.
              </p>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #999; font-size: 12px;">
                  © 2024 StartupLink. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        'Document upload confirmation email sent successfully:',
        result.messageId,
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending document upload confirmation email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
