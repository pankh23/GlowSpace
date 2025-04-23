const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const Appointment = require('../models/Appointment.model');

// Generate a 4-digit passcode
const generatePasscode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

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

// Generate room for appointment
router.post('/generate/:appointmentId', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Appointment must be confirmed to generate a video room'
      });
    }

    // Generate unique room ID and passcode
    const roomId = `glowRoom-${nanoid(8)}`;
    const passcode = generatePasscode();

    appointment.roomId = roomId;
    appointment.passcode = passcode;
    await appointment.save();

    res.json({
      success: true,
      roomId,
      passcode
    });
  } catch (error) {
    console.error('Error generating room:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating room',
      error: error.message
    });
  }
});

module.exports = router; 