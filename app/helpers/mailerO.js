const sgMail = require('@sendgrid/mail')
const dotenv = require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

console.log('API KEY',process.env.SENDGRID_API_KEY)
console.log('FROM EMAIL',process.env.FROM_EMAIL)

exports.send = function (from, to, subject, html)
{
	const msg = {
	    to,
	    from: process.env.FROM_EMAIL, // Change to your verified sender
	    subject,
	    html,
	}
	return sgMail.send(msg).then(() => {
	    console.log('Email sent')
	})
};