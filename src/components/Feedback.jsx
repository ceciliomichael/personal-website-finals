import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FeedbackForm from './FeedbackForm';
import Section from './Section';
import './Feedback.css';

const Feedback = ({ onSubmit }) => {
  // State to store feedback comments - limit to 2 most recent
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      name: "John Doe",
      message: "This portfolio is amazing! I love the design and the interactive elements.",
      date: new Date(Date.now() - 86400000).toLocaleDateString()
    },
    {
      id: 2,
      name: "Jane Smith",
      message: "Very impressive work! The UI is clean and intuitive.",
      date: new Date().toLocaleDateString()
    }
  ]);

  const handleFeedbackSubmit = (formData) => {
    // Create a new feedback item
    const newFeedback = {
      id: Date.now(),
      name: formData.name,
      message: formData.message,
      date: new Date().toLocaleDateString()
    };
    
    // Add to the beginning of the array and keep only the 2 most recent
    setFeedbacks(prevFeedbacks => {
      const updatedFeedbacks = [newFeedback, ...prevFeedbacks];
      return updatedFeedbacks.slice(0, 2);
    });
    
    // Pass the feedback data to the parent component if onSubmit prop exists
    if (onSubmit) {
      onSubmit(formData);
    }
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
              Leave a comment on the left and see recent feedback on the right.
            </p>
          </div>
          
          <div className="feedback-layout">
            <div className="feedback-form-container">
              <FeedbackForm onSubmit={handleFeedbackSubmit} />
            </div>
            
            <div className="feedback-divider"></div>
            
            <div className="feedback-comments-container">
              <h4>Recent Comments</h4>
              <div className="feedback-comments-list">
                {feedbacks.map(feedback => (
                  <div className="feedback-comment" key={feedback.id}>
                    <div className="comment-header">
                      <h5>{feedback.name}</h5>
                      <span className="comment-date">{feedback.date}</span>
                    </div>
                    <p>{feedback.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

export default Feedback; 