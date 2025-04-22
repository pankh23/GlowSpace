export const emotionSuggestions = {
  happy: {
    activities: ['Journaling', 'Mindfulness Exercise', 'Gratitude Practice'],
    description: 'Great to see you happy! Let\'s maintain this positive energy.',
    icon: '😊'
  },
  sad: {
    activities: ['AI Chatbot Session', 'Cheer-Up Playlist', 'Guided Meditation'],
    description: 'It\'s okay to feel this way. Let\'s find something to lift your spirits.',
    icon: '😢'
  },
  angry: {
    activities: ['Breathing Exercise', 'Yoga Flow', 'Progressive Muscle Relaxation'],
    description: 'Let\'s channel this energy into something positive.',
    icon: '😡'
  },
  neutral: {
    activities: ['Mental Health Quiz', 'Mindful Breathing', 'Self-Reflection'],
    description: 'A balanced state is perfect for self-discovery.',
    icon: '😐'
  },
  fearful: {
    activities: ['Guided Meditation', 'Grounding Exercise', 'Safe Space Visualization'],
    description: 'Let\'s create a safe space for you to process these feelings.',
    icon: '😨'
  },
  surprised: {
    activities: ['Light Games', 'Community Chat', 'Creative Expression'],
    description: 'New experiences can be exciting! Let\'s explore this feeling.',
    icon: '😮'
  }
};

export const getEmotionSuggestion = (emotion) => {
  return emotionSuggestions[emotion] || {
    activities: ['Mindful Breathing', 'Self-Reflection'],
    description: 'Let\'s take a moment to check in with yourself.',
    icon: '🤔'
  };
}; 