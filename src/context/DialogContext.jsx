import React, { createContext, useContext, useState } from 'react';
import Dialog from '../components/Dialog';

const DialogContext = createContext();

export const useDialog = () => useContext(DialogContext);

export const DialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: null,
    onConfirm: null,
    type: 'info',
    isLoading: false
  });

  const openDialog = (options) => {
    setDialogState({
      isOpen: true,
      title: options.title || '',
      message: options.message || '',
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || null,
      onConfirm: options.onConfirm || null,
      type: options.type || 'info',
      isLoading: options.isLoading || false
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  const setLoading = (isLoading) => {
    setDialogState(prev => ({ ...prev, isLoading }));
  };

  // Helper methods for common dialog types
  const showInfo = (title, message, confirmText = 'OK', onConfirm = null) => {
    openDialog({ title, message, confirmText, onConfirm, type: 'info' });
  };

  const showSuccess = (title, message, confirmText = 'OK', onConfirm = null) => {
    openDialog({ title, message, confirmText, onConfirm, type: 'success' });
  };

  const showError = (title, message, confirmText = 'OK', onConfirm = null) => {
    openDialog({ title, message, confirmText, onConfirm, type: 'error' });
  };

  const showWarning = (title, message, confirmText = 'OK', onConfirm = null) => {
    openDialog({ title, message, confirmText, onConfirm, type: 'warning' });
  };

  const showConfirm = (title, message, confirmText = 'Yes', cancelText = 'No', onConfirm = null) => {
    openDialog({ title, message, confirmText, cancelText, onConfirm, type: 'confirm' });
  };

  return (
    <DialogContext.Provider 
      value={{ 
        openDialog, 
        closeDialog, 
        setLoading,
        showInfo, 
        showSuccess, 
        showError, 
        showWarning, 
        showConfirm 
      }}
    >
      {children}
      <Dialog 
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={dialogState.onConfirm}
        type={dialogState.type}
        isLoading={dialogState.isLoading}
      />
    </DialogContext.Provider>
  );
};

export default DialogContext; 