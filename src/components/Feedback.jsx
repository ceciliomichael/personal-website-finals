import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FeedbackForm from './FeedbackForm';
import Section from './Section';
import { getFeedback } from '../lib/supabase';
import './Feedback.css';

const Feedback = ({ onSubmit }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch feedback on component mount
  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getFeedback();
      // Only show the 2 most recent feedbacks
      setFeedbacks(data.slice(0, 2));
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError('Failed to load feedback. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async (formData) => {
    try {
      // Add the new feedback to the list and keep only the 2 most recent
      setFeedbacks(prevFeedbacks => {
        const updatedFeedbacks = [formData, ...prevFeedbacks];
        return updatedFeedbacks.slice(0, 2);
      });
      
      // Pass the feedback data to the parent component if onSubmit prop exists
      if (onSubmit) {
        onSubmit(formData);
      }
    } catch (error) {
      console.error('Error handling feedback submission:', error);
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
                {isLoading ? (
                  <div className="feedback-loading">Loading feedback...</div>
                ) : error ? (
                  <div className="feedback-error">{error}</div>
                ) : feedbacks.length > 0 ? (
                  feedbacks.map(feedback => (
                    <div className="feedback-comment" key={feedback.id}>
                      <div className="comment-header">
                        <h5>{feedback.name}</h5>
                        <span className="comment-date">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p>{feedback.message}</p>
                      {feedback.rating && (
                        <div className="comment-rating">
                          Rating: {feedback.rating}/5
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-feedback">No feedback yet. Be the first to share your thoughts!</div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

export default Feedback; 