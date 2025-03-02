import React from 'react';
import { motion } from 'framer-motion';
import FeedbackForm from './FeedbackForm';
import Section from './Section';
import './Feedback.css';

const Feedback = ({ onSubmit }) => {
  const handleFeedbackSubmit = (formData) => {
    // In a real application, you would send this data to a server
    console.log('Feedback submitted:', formData);
    
    // Pass the feedback data to the parent component if onSubmit prop exists
    if (onSubmit) {
      onSubmit(formData);
    }
    
    // You could implement API calls here:
    // Example:
    // fetch('/api/feedback', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(formData),
    // })
    // .then(response => response.json())
    // .then(data => console.log('Success:', data))
    // .catch(error => console.error('Error:', error));
  };

  return (
    <Section id="feedback" title="Feedback">
      <div className="feedback-container">
        <motion.div 
          className="feedback-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="feedback-intro">
            <h3>Share Your Thoughts</h3>
            <p>
              I value your feedback! Please take a moment to share your thoughts, 
              suggestions, or any comments you might have about my portfolio. 
              Your input helps me improve and create better experiences.
            </p>
          </div>
          
          <FeedbackForm onSubmit={handleFeedbackSubmit} />
        </motion.div>
      </div>
    </Section>
  );
};

export default Feedback; 