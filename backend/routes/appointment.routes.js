const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Appointment = require('../models/Appointment.model');
const Counselor = require('../models/Counselor.model');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready to send emails');
  }
});

// Helper function to generate a random room ID and passcode
const generateVideoRoom = () => {
  const roomId = crypto.randomBytes(8).toString('hex');
  const passcode = Math.floor(100000 + Math.random() * 900000).toString();
  return { roomId, passcode };
};

router.post('/book', async (req, res) => {
  try {
    const { name, email, reason, preferredDate, counselorId } = req.body;
    console.log('Received appointment booking request:', { name, email, reason, preferredDate, counselorId });

    // Get counselor details
    const counselor = await Counselor.findById(counselorId);
    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: 'Selected counselor not found'
      });
    }

    // Generate video room details
    const { roomId, passcode } = generateVideoRoom();

    const appointment = new Appointment({
      name,
      email,
      reason,
      preferredDate,
      counselor: {
        name: counselor.name,
        email: counselor.email,
        specialization: counselor.specialization
      },
      roomId,
      passcode,
      status: 'confirmed'
    });

    await appointment.save();
    console.log('Appointment saved to database successfully');

    // Use the request's origin as the frontend URL if not set in env
    const frontendUrl = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:3000';
    const videoCallUrl = `${frontendUrl}/video-call/${roomId}`;

    // Send confirmation email with video call details
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      cc: [process.env.ADMIN_EMAIL, counselor.email],
      subject: 'Appointment Confirmed - GlowSpace',
      html: `
        <h2>Your Appointment is Confirmed!</h2>
        <p>Dear ${name},</p>
        <p>Your appointment has been confirmed with the following details:</p>
        <ul>
          <li><strong>Counselor:</strong> ${counselor.name} (${counselor.specialization})</li>
          <li><strong>Date & Time:</strong> ${new Date(preferredDate).toLocaleString()}</li>
          <li><strong>Reason:</strong> ${reason}</li>
        </ul>
        <h3>Video Call Information:</h3>
        <p>To join your video consultation:</p>
        <ol>
          <li>Click the link below at your scheduled time</li>
          <li>Enter the passcode when prompted</li>
          <li>Allow camera and microphone access when requested</li>
        </ol>
        <p><a href="${videoCallUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Video Call</a></p>
        <p><strong>Passcode:</strong> ${passcode}</p>
        <p>Note: The video call link will only work within 10 minutes of your scheduled appointment time.</p>
        <p>Best regards,<br>The GlowSpace Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Confirmation email with video call details sent successfully');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: {
        ...appointment.toObject(),
        videoCallUrl // Include the video call URL in the response
      }
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = status;
    await appointment.save();

    // Send status update email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: appointment.email,
      cc: [process.env.ADMIN_EMAIL, appointment.counselor.email],
      subject: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)} - GlowSpace`,
      html: `
        <h2>Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p>Dear ${appointment.name},</p>
        <p>Your appointment has been ${status}.</p>
        <ul>
          <li><strong>Counselor:</strong> ${appointment.counselor.name}</li>
          <li><strong>Date & Time:</strong> ${new Date(appointment.preferredDate).toLocaleString()}</li>
          <li><strong>Reason:</strong> ${appointment.reason}</li>
        </ul>
        ${status === 'confirmed' ? `
          <p>To join your video consultation:</p>
          <ol>
            <li>Click the link below at your scheduled time</li>
            <li>Enter the passcode when prompted</li>
            <li>Allow camera and microphone access when requested</li>
          </ol>
          <p><a href="${process.env.FRONTEND_URL}/video-call/${appointment.roomId}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Video Call</a></p>
          ${appointment.passcode ? `<p><strong>Passcode:</strong> ${appointment.passcode}</p>` : ''}
        ` : ''}
        <p>Best regards,<br>The GlowSpace Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Status update email sent successfully');

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment status',
      error: error.message
    });
  }
});

// Validate video room access
router.get('/validate/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const appointment = await Appointment.findOne({ roomId });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Invalid video room ID'
      });
    }

    // Check if the appointment time is within 10 minutes of the current time
    const appointmentTime = new Date(appointment.preferredDate);
    const currentTime = new Date();
    const timeDifference = Math.abs(currentTime - appointmentTime) / (1000 * 60); // in minutes

    if (timeDifference > 10) {
      return res.status(403).json({
        success: false,
        message: 'Video call is only accessible within 10 minutes of the scheduled time'
      });
    }

    res.json({
      success: true,
      appointment: {
        roomId: appointment.roomId,
        passcode: appointment.passcode,
        counselor: appointment.counselor,
        patient: {
          name: appointment.name,
          email: appointment.email
        }
      }
    });
  } catch (error) {
    console.error('Error validating video room:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating video room',
      error: error.message
    });
  }
});

module.exports = router; 