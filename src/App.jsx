import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Welcome from './pages/Welcome';
import Portfolio from './pages/Portfolio';
import { useUser } from './context/UserContext';
import './App.css';

function App() {
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: userLoading } = useUser();

  // Auto-login if user exists in context
  useEffect(() => {
    if (user && !showPortfolio) {
      setIsLoading(true);
      
      // Simulate loading for a smoother transition
      setTimeout(() => {
        setIsLoading(false);
        setShowPortfolio(true);
      }, 1000);
    }
  }, [user, showPortfolio]);

  const handleNameSubmit = (name, udid) => {
    setIsLoading(true);
    
    // Simulate loading for a smoother transition
    setTimeout(() => {
      setIsLoading(false);
      setShowPortfolio(true);
    }, 2000);
  };

  // If still loading user data, show nothing yet
  if (userLoading && !user) {
    return (
      <div className="app-container">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <AnimatePresence mode="wait">
        {!showPortfolio ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1 }}
          >
            <Welcome onNameSubmit={handleNameSubmit} isLoading={isLoading} />
          </motion.div>
        ) : (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <Portfolio userName={user?.name || "Visitor"} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App; 