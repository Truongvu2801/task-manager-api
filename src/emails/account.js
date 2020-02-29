const sgMail = require("@sendgrid/mail");

// const sendgridAPIKey = 
//   "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";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "truongvu2801@gmail.com",
    subject: "Thanks for join in",
    text: `Welcome to the app, ${name}`
  });
};

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "truongvu2801@gmail.com",
    subject: "Sorry to see you go",
    text: `Goodbye, ${name}. I hope to see you comeback soon`
  });
};

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail
};
