import nodemailer from "nodemailer"
export const sendEmailToVendor = async (order, products) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            type: 'OAuth2',
            user: process.env.EMAIL, // your email address
            pass: process.env.EMAIL_PASS,  // your email password,
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
        },

    });
    console.log(transporter)
    const mailOptions = {
        from: 'mustafakheda07@gmail.com', // sender address
        to: 'mustafakheda07@gmail.com', // list of receivers
        subject: 'Welcome to Our Service', // Subject line
        text: 'Dear UserThank you for signing up for our service.Best Regards', // plain text body
        html: `<p>Dear User,</p><p>Thank you for signing up for our service.</p><p>Best Regards,<br>Your Company</p>` // html body
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email: %s', error);
    }
}