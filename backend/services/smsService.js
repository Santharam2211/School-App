const { client, twilioPhoneNumber } = require('../config/twilio');
const Student = require('../models/Student');

/**
 * Format phone number to E.164 format
 * @param {String} mobile - Mobile number
 * @returns {String} Formatted phone number
 */
function formatPhoneNumber(mobile) {
  if (!mobile) return null;
  
  // Remove all spaces, dashes, and parentheses
  let cleaned = mobile.replace(/[\s\-\(\)]/g, '');
  
  // If it already starts with +, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it starts with 91 (India country code), add +
  if (cleaned.startsWith('91') && cleaned.length >= 12) {
    return '+' + cleaned;
  }
  
  // If it's a 10-digit number, assume it's Indian and add +91
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return '+91' + cleaned;
  }
  
  // Otherwise, add +91 as default (Indian numbers)
  return '+91' + cleaned;
}

/**
 * Send SMS notification to students when homework is assigned
 * @param {Object} homeworkData - Homework information
 * @param {Number} classId - Class ID for the homework
 */
async function sendHomeworkSMS(homeworkData, classId) {
  try {
    console.log('📱 Starting SMS notification for class:', classId);
    console.log('📝 Homework text:', homeworkData.homeworkText?.substring(0, 100));
    
    // Get all students in the class
    const students = await Student.find({ stuClass: classId });
    
    if (students.length === 0) {
      console.log(`❌ No students found for class ${classId}`);
      return { success: false, message: 'No students found for this class' };
    }

    console.log(`👥 Found ${students.length} students in class ${classId}`);

    const results = [];
    
    // Send SMS to each student
    for (const student of students) {
      if (student.mobile && student.mobile.trim()) {
        try {
          const message = createHomeworkMessage(homeworkData, student);
          const formattedPhone = formatPhoneNumber(student.mobile);
          
          console.log(`📤 Attempting to send SMS to ${student.name}`);
          console.log(`   Original number: ${student.mobile}`);
          console.log(`   Formatted number: ${formattedPhone}`);
          
          const messageResult = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: formattedPhone
          });
          
          console.log(`✅ SMS queued for ${student.name}`);
          console.log(`   Message SID: ${messageResult.sid}`);
          console.log(`   Status: ${messageResult.status}`);
          console.log(`   To: ${messageResult.to}`);
          
          // Check if it's a trial account message
          if (messageResult.status === 'queued' || messageResult.status === 'sent') {
            console.log(`   ⚠️  Note: If using Twilio trial account, SMS will only be delivered to verified numbers`);
          }
          
          results.push({
            student: student.name,
            mobile: student.mobile,
            formattedMobile: formattedPhone,
            status: 'sent',
            messageId: messageResult.sid,
            twilioStatus: messageResult.status
          });
        } catch (error) {
          console.error(`❌ Failed to send SMS to ${student.name} (${student.mobile})`);
          console.error(`   Error Code: ${error.code}`);
          console.error(`   Error Message: ${error.message}`);
          
          // Provide helpful error messages
          let errorHelp = '';
          if (error.code === 21211) {
            errorHelp = 'Invalid phone number format. Please check the number.';
          } else if (error.code === 21608) {
            errorHelp = 'Phone number is not verified. For Twilio trial accounts, you must verify phone numbers first.';
          } else if (error.code === 21614) {
            errorHelp = 'Invalid phone number format. Use international format (e.g., +919876543210).';
          } else if (error.code === 21606) {
            errorHelp = 'The From phone number is not a valid Twilio number.';
          }
          
          if (errorHelp) {
            console.error(`   💡 Help: ${errorHelp}`);
          }
          
          results.push({
            student: student.name,
            mobile: student.mobile,
            status: 'failed',
            error: error.message,
            errorCode: error.code,
            errorHelp: errorHelp
          });
        }
      } else {
        console.log(`⚠️  No mobile number for student ${student.name}`);
        results.push({
          student: student.name,
          mobile: 'N/A',
          status: 'skipped',
          reason: 'No mobile number'
        });
      }
    }
    
    const sentCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    
    console.log('\n📊 SMS Summary:');
    console.log(`   ✅ Sent: ${sentCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);
    
    if (failedCount > 0) {
      console.log('\n⚠️  IMPORTANT: Some messages failed to send.');
      console.log('   If you are using a Twilio TRIAL account:');
      console.log('   1. You can only send SMS to verified phone numbers');
      console.log('   2. Verify numbers at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.log('   3. Or upgrade to a paid account to send to any number');
    }
    
    return {
      success: true,
      message: `SMS notifications sent to ${sentCount} students`,
      sentCount,
      failedCount,
      skippedCount,
      results
    };
    
  } catch (error) {
    console.error('Error sending homework SMS:', error);
    return {
      success: false,
      message: 'Failed to send SMS notifications',
      error: error.message
    };
  }
}

/**
 * Create a formatted message for homework notification
 * @param {Object} homeworkData - Homework information
 * @param {Object} student - Student information
 * @returns {String} Formatted message
 */
function createHomeworkMessage(homeworkData, student) {
  const { homeworkText, day, teacherId } = homeworkData;
  
  // Send only homework text for trial account compatibility
  const message = homeworkText;
  console.log('📨 Creating SMS message:', message?.substring(0, 100));
  return message;
}

/**
 * Send SMS to a specific student
 * @param {String} studentId - Student ID
 * @param {String} message - Custom message
 */
async function sendSMSToStudent(studentId, message) {
  try {
    const student = await Student.findById(studentId);
    
    if (!student) {
      return { success: false, message: 'Student not found' };
    }
    
    if (!student.mobile || !student.mobile.trim()) {
      return { success: false, message: 'Student has no mobile number' };
    }
    
    const formattedPhone = formatPhoneNumber(student.mobile);
    
    console.log(`📤 Sending SMS to ${student.name}`);
    console.log(`   Original: ${student.mobile}`);
    console.log(`   Formatted: ${formattedPhone}`);
    
    const messageResult = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone
    });
    
    console.log(`✅ SMS queued: ${messageResult.sid}`);
    console.log(`   Status: ${messageResult.status}`);
    
    if (messageResult.status === 'queued' || messageResult.status === 'sent') {
      console.log(`   ⚠️  Note: If using Twilio trial account, SMS will only be delivered to verified numbers`);
    }
    
    return {
      success: true,
      message: 'SMS sent successfully',
      messageId: messageResult.sid,
      student: student.name
    };
    
  } catch (error) {
    console.error('Error sending SMS to student:', error);
    return {
      success: false,
      message: 'Failed to send SMS',
      error: error.message
    };
  }
}

module.exports = {
  sendHomeworkSMS,
  sendSMSToStudent,
  createHomeworkMessage,
  formatPhoneNumber
};
