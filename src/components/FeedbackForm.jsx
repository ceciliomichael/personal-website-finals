import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import './FeedbackForm.css';

const FeedbackForm = ({ onSubmit }) => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: '',
    message: '',
    rating: 0,
    udid: user?.udid || ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    message: '',
    rating: ''
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
    
    // Validate rating
    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // Send feedback to the backend API
        const response = await fetch('https://026vn2g1-5000.asse.devtunnels.ms/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to submit feedback');
        }
        
        // Call the onSubmit prop with the form data
        if (onSubmit) {
          onSubmit(formData);
        }
        
        // Show success message
        setSubmitted(true);
      } catch (error) {
        console.error('Error submitting feedback:', error);
      }
    }
  };

  const handleRatingChange = (rating) => {
    setFormData({
      ...formData,
      rating
    });
    
    // Clear rating error
    if (errors.rating) {
      setErrors({
        ...errors,
        rating: ''
      });
    }
  };

  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <label 
          key={i} 
          className={`star-label ${formData.rating >= i ? 'active' : ''}`}
        >
          <input
            type="radio"
            name="rating"
            value={i}
            checked={formData.rating === i}
            onChange={() => handleRatingChange(i)}
          />
          <span className="star">★</span>
        </label>
      );
    }
    
    return stars;
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
    <form className="feedback-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
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
        ></textarea>
        {errors.message && <div className="error-message">{errors.message}</div>}
      </div>
      
      <div className="form-group">
        <label>Rating</label>
        <div className="star-rating">
          {renderStars()}
        </div>
        {errors.rating && <div className="error-message">{errors.rating}</div>}
      </div>
      
      <motion.button
        type="submit"
        className="submit-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Submit Feedback
      </motion.button>
    </form>
  );
};

export default FeedbackForm; 