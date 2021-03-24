const nodemailer = require("nodemailer");

async function sendMail(to, subject, body) {
  let transporter = nodemailer.createTransport({
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 465,
    secure: true,
    auth: {
      user: "",
      pass: "",
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Sho Tseeker 🏆" <email@email.com>', // sender address
    to,
    subject,
    text: `${body}`, // plain text body
  });

  console.log("Email sent...");
  console.log(info);
}

module.exports = {
  sendMail,
};
