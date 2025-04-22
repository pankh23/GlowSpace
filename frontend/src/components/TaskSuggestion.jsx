import { motion } from 'framer-motion';

const TaskSuggestion = ({ suggestion, onReset }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6 shadow-lg mt-8"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Suggested Activity</h2>
      <p className="text-lg text-gray-600 mb-4">{suggestion}</p>
      <button
        onClick={onReset}
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
      >
        Try Another Mood
      </button>
    </motion.div>
  );
};

export default TaskSuggestion;
