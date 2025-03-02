import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import './Login.css';

const Login = ({ onLogin }) => {
  const [userName, setUserName] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const { user, loading, error, registerUser } = useUser();

  // Reset errors when user types
  const handleNameChange = (e) => {
    setUserName(e.target.value);
    if (submitAttempted) {
      validateName(e.target.value);
    }
    // Clear API error when user starts typing again
    if (error) {
      setNameError('');
    }
  };

  // Validation function
  const validateName = (name) => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    } else if (name.trim().length < 3) {
      setNameError('Name must be at least 3 characters');
      return false;
    } else if (name.trim().length > 20) {
      setNameError('Name must be less than 20 characters');
      return false;
    } else {
      setNameError('');
      return true;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    // Validate input
    if (!validateName(userName)) {
      return;
    }

    try {
      // Attempt to register/login
      const userData = await registerUser(userName.trim());
      
      // Call onLogin prop if successful
      if (onLogin) {
        onLogin(userData);
      }
    } catch (err) {
      console.error('Login error:', err);
      // Error state is handled by UserContext and displayed below
    }
  };

  // Update error message from context
  useEffect(() => {
    if (error) {
      if (error.includes('username already taken') || error.includes('Username already taken')) {
        setNameError('This username is already taken. Please choose another one.');
      } else {
        setNameError(error);
      }
    }
  }, [error]);

  return (
    <div className="login-container">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Welcome to My Portfolio</h2>
        <p>Please enter your name to continue</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userName">Your Name</label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={handleNameChange}
              placeholder="Enter your name"
              className={nameError ? 'error' : ''}
              disabled={loading}
            />
            <AnimatePresence>
              {nameError && (
                <motion.div 
                  className="error-message"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {nameError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Enter Portfolio'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login; 