import { BrevoClient } from "@getbrevo/brevo";

const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

const sendEmail = async (email, subject, message) => {
  await client.transactionalEmails.sendTransacEmail({
    sender: { name: "Greetings, Friend", email: "example@email.com" },
    to: [{ email }],
    subject,
    textContent: message,
  });
};

export default sendEmail;