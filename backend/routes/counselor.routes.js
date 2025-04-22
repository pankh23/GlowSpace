const express = require('express');
const router = express.Router();
const Counselor = require('../models/Counselor.model');

// Get all active counselors
router.get('/', async (req, res) => {
  try {
    const counselors = await Counselor.find({ isActive: true })
      .select('name email specialization bio availability');
    res.json({
      success: true,
      counselors
    });
  } catch (error) {
    console.error('Error fetching counselors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching counselors',
      error: error.message
    });
  }
});

// Get counselor by ID
router.get('/:id', async (req, res) => {
  try {
    const counselor = await Counselor.findById(req.params.id)
      .select('name email specialization bio availability');
    
    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: 'Counselor not found'
      });
    }

    res.json({
      success: true,
      counselor
    });
  } catch (error) {
    console.error('Error fetching counselor:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching counselor',
      error: error.message
    });
  }
});

module.exports = router; 