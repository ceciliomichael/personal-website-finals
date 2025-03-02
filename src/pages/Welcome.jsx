import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import './Welcome.css';

const Welcome = ({ onNameSubmit, isLoading: propIsLoading }) => {
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [stars, setStars] = useState([]);
  const nameInputRef = useRef(null);
  const { registerUser, loading: userLoading } = useUser();
  
  const isLoading = propIsLoading || userLoading;

  // Generate stars for the background
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      const starCount = 100;
      
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          size: `${Math.random() * 2 + 1}px`,
          animationDelay: `${Math.random() * 5}s`
        });
      }
      
      setStars(newStars);
    };
    
    generateStars();
  }, []);

  // Show name input after initial animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNameInput(true);
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim()) {
      try {
        // Register the user and get UDID
        const userData = await registerUser(name);
        
        // Pass the user data to the parent component
        onNameSubmit(userData.name, userData.udid);
      } catch (error) {
        console.error('Error registering user:', error);
      }
    }
  };

  return (
    <div className="welcome-container">
      {/* Stars background */}
      <div className="stars">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.animationDelay
            }}
          />
        ))}
      </div>
      
      <div className="welcome-content">
        <motion.h1
          className="welcome-title"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <span className="text-gradient">Welcome to</span> <br />
          <span className="adventure-text">The Interactive Portfolio Adventure</span>
        </motion.h1>
        
        {showNameInput && (
          <motion.div
            className="name-input-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <form onSubmit={handleSubmit}>
              <motion.label
                htmlFor="name-input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                What is your name, adventurer?
              </motion.label>
              
              <motion.div
                className="input-wrapper"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <input
                  id="name-input"
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  disabled={isLoading}
                  maxLength={30}
                  required
                />
                
                <motion.button
                  type="submit"
                  disabled={!name.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                >
                  Begin Adventure
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        )}
      </div>
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Preparing your adventure...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Welcome; 