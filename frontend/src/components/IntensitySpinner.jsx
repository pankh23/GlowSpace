import { motion } from 'framer-motion';
import { useState } from 'react';

const intensityLevels = [
  { level: 'Mild', color: '#90CAF9' },
  { level: 'Moderate', color: '#64B5F6' },
  { level: 'Severe', color: '#42A5F5' }
];

const IntensitySpinner = ({ onSelect }) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const newRotation = rotation + 1440 + Math.random() * 360;
    setRotation(newRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      const selectedIndex = Math.floor(((360 - (newRotation % 360)) / 120));
      onSelect(intensityLevels[selectedIndex].level);
    }, 3000);
  };

  return (
    <motion.div
      className="relative w-80 h-80 mx-auto"
      animate={{ rotate: rotation }}
      transition={{ duration: 3, type: "spring" }}
    >
      {intensityLevels.map((intensity, index) => (
        <div
          key={intensity.level}
          className="absolute w-full h-full"
          style={{
            transform: `rotate(${index * 120}deg)`,
            transformOrigin: '50% 50%',
          }}
        >
          <div
            className="w-40 h-40 rounded-tl-full flex items-center justify-center"
            style={{ backgroundColor: intensity.color }}
          >
            <span className="text-white font-bold -rotate-45 ml-8">
              {intensity.level}
            </span>
          </div>
        </div>
      ))}
      <button
        onClick={spinWheel}
        disabled={isSpinning}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                   bg-white rounded-full p-4 shadow-lg"
      >
        SPIN
      </button>
    </motion.div>
  );
};

export default IntensitySpinner;
