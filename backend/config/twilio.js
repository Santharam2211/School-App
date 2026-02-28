const twilio = require('twilio');

// Twilio configuration
const accountSid = ;
const authToken = ;
const twilioPhoneNumber = ;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

module.exports = {
  client,
  twilioPhoneNumber,
  accountSid,
  authToken
};
