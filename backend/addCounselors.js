const mongoose = require('mongoose');
const Counselor = require('./models/Counselor.model');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Verify environment variables
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

const counselors = [
  {
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@example.com",
    specialization: "Anxiety and Depression",
    bio: "Dr. Johnson has over 10 years of experience helping individuals overcome anxiety and depression. She uses a combination of CBT and mindfulness techniques to help her clients achieve lasting change.",
    availability: [
      { day: "Monday", startTime: "09:00", endTime: "17:00" },
      { day: "Wednesday", startTime: "09:00", endTime: "17:00" },
      { day: "Friday", startTime: "09:00", endTime: "17:00" }
    ]
  },
  {
    name: "Dr. Michael Chen",
    email: "michael.chen@example.com",
    specialization: "Relationship Counseling",
    bio: "Dr. Chen specializes in relationship counseling and family therapy. With 8 years of experience, he helps couples and families build stronger, healthier relationships.",
    availability: [
      { day: "Tuesday", startTime: "10:00", endTime: "18:00" },
      { day: "Thursday", startTime: "10:00", endTime: "18:00" },
      { day: "Saturday", startTime: "09:00", endTime: "15:00" }
    ]
  },
  {
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@example.com",
    specialization: "Trauma and PTSD",
    bio: "Dr. Rodriguez is a trauma specialist with extensive experience in treating PTSD and trauma-related disorders. She uses evidence-based approaches to help clients heal and move forward.",
    availability: [
      { day: "Monday", startTime: "13:00", endTime: "20:00" },
      { day: "Wednesday", startTime: "13:00", endTime: "20:00" },
      { day: "Friday", startTime: "13:00", endTime: "20:00" }
    ]
  }
];

async function addCounselors() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Clear existing counselors
    await Counselor.deleteMany({});
    console.log('Cleared existing counselors');

    // Add new counselors
    const result = await Counselor.insertMany(counselors);
    console.log(`${result.length} counselors added successfully`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addCounselors(); 