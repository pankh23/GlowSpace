const mongoose = require('mongoose');
const Counselor = require('./models/Counselor.model');
require('dotenv').config();

const counselors = [
  {
    name: "Dr. John Doe",
    email: "john.doe@glowspace.com",
    specialization: "Anxiety and Stress Management",
    bio: "Experienced counselor with 10+ years of practice in anxiety and stress management. Specializes in cognitive-behavioral therapy and mindfulness techniques.",
    availability: [
      {
        day: "Monday",
        startTime: "09:00",
        endTime: "17:00"
      },
      {
        day: "Wednesday",
        startTime: "09:00",
        endTime: "17:00"
      },
      {
        day: "Friday",
        startTime: "09:00",
        endTime: "17:00"
      }
    ]
  },
  {
    name: "Dr. Sarah Smith",
    email: "sarah.smith@glowspace.com",
    specialization: "Depression and Mood Disorders",
    bio: "Licensed clinical psychologist specializing in depression and mood disorders. Uses evidence-based approaches including interpersonal therapy and positive psychology.",
    availability: [
      {
        day: "Tuesday",
        startTime: "10:00",
        endTime: "18:00"
      },
      {
        day: "Thursday",
        startTime: "10:00",
        endTime: "18:00"
      },
      {
        day: "Saturday",
        startTime: "09:00",
        endTime: "14:00"
      }
    ]
  },
  {
    name: "Dr. Michael Chen",
    email: "michael.chen@glowspace.com",
    specialization: "Relationship and Family Counseling",
    bio: "Expert in relationship dynamics and family systems. Helps clients navigate interpersonal challenges and improve communication skills.",
    availability: [
      {
        day: "Monday",
        startTime: "13:00",
        endTime: "20:00"
      },
      {
        day: "Wednesday",
        startTime: "13:00",
        endTime: "20:00"
      },
      {
        day: "Friday",
        startTime: "13:00",
        endTime: "20:00"
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing counselors
    await Counselor.deleteMany({});
    console.log('Cleared existing counselors');

    // Insert new counselors
    const insertedCounselors = await Counselor.insertMany(counselors);
    console.log(`Successfully seeded ${insertedCounselors.length} counselors`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 