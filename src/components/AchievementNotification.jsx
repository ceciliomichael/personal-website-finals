import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AchievementNotification.css';

const AchievementNotification = ({ achievement }) => {
  // Play a sound effect when the achievement appears
  useEffect(() => {
    // In a real application, you might want to play a sound here
    // const sound = new Audio('/sounds/achievement.mp3');
    // sound.play().catch(e => console.log('Error playing sound:', e));
  }, []);

  return (
    <AnimatePresence>
      <motion.div 
        className="achievement-notification"
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="achievement-icon-container">
          <span className="achievement-icon">{achievement.icon}</span>
        </div>
        <div className="achievement-details">
          <h3>Achievement Unlocked!</h3>
          <h4>{achievement.title}</h4>
          <p>{achievement.description}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementNotification; 