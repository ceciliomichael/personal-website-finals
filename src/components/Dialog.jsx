import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Dialog.css';

const Dialog = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  confirmText = 'OK', 
  cancelText = null, 
  onConfirm, 
  type = 'info', // 'info', 'success', 'error', 'warning', 'confirm'
  isLoading = false
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isLoading]);

  // Prevent scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Get icon based on dialog type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'confirm':
        return '?';
      default:
        return 'ℹ';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="dialog-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? null : onClose}
          />
          <div className="dialog-container">
            <motion.div 
              className={`dialog-content dialog-${type}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className={`dialog-header`}>
                <div className={`dialog-icon dialog-icon-${type}`}>
                  {getIcon()}
                </div>
                <h2 className="dialog-title">{title}</h2>
              </div>
              <div className="dialog-body">
                <p>{message}</p>
                {isLoading && (
                  <div className="dialog-loading">
                    <div className="dialog-spinner"></div>
                    <p>Processing your request...</p>
                  </div>
                )}
              </div>
              <div className="dialog-footer">
                {cancelText && !isLoading && (
                  <button 
                    className="dialog-button dialog-button-secondary" 
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </button>
                )}
                <button 
                  className={`dialog-button dialog-button-${type} ${isLoading ? 'dialog-button-loading' : ''}`} 
                  onClick={() => {
                    if (!isLoading) {
                      onConfirm?.();
                      if (!onConfirm) onClose();
                    }
                  }}
                  disabled={isLoading}
                  autoFocus
                >
                  {isLoading ? 'Processing...' : confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Dialog; 