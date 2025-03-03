import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { addFeedback } from '../lib/supabase';
import './FeedbackForm.css';

const FeedbackForm = ({ onSubmit }) => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: '',
    message: '',
    rating: 5 // Default rating
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }
    
    // Validate message
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
      valid = false;
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message should be at least 10 characters';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setIsSubmitting(true);
        
        // Add feedback using Supabase client
        const newFeedback = await addFeedback(formData);
        
        // Call the onSubmit prop with the form data
        if (onSubmit) {
          onSubmit(newFeedback);
        }
        
        // Show success message temporarily
        setSubmitted(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
            name: user?.name || '',
            email: '',
            message: '',
            rating: 5
          });
        }, 3000);
      } catch (error) {
        console.error('Error submitting feedback:', error);
        // Show error in the form
        setErrors({
          ...errors,
          submit: 'Failed to submit feedback. Please try again.'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (submitted) {
    return (
      <motion.div 
        className="feedback-success"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="success-icon">✓</div>
        <h3>Thank You!</h3>
        <p>Your feedback has been submitted successfully.</p>
      </motion.div>
    );
  }

  return (
    <motion.form 
      className="feedback-form" 
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
          placeholder="Your name"
          disabled={isSubmitting}
        />
        {errors.name && <div className="error-message">{errors.name}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'error' : ''}
          placeholder="Your email address"
          disabled={isSubmitting}
        />
        {errors.email && <div className="error-message">{errors.email}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows="5"
          value={formData.message}
          onChange={handleChange}
          className={errors.message ? 'error' : ''}
          placeholder="Share your thoughts or feedback..."
          disabled={isSubmitting}
        ></textarea>
        {errors.message && <div className="error-message">{errors.message}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="rating">Rating (1-5)</label>
        <input
          type="number"
          id="rating"
          name="rating"
          min="1"
          max="5"
          value={formData.rating}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </div>
      
      {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
      
      <motion.button
        type="submit"
        className="submit-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </motion.button>
    </motion.form>
  );
};

export default FeedbackForm; 