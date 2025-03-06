import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { getMessages, sendMessage, getActiveUsers, updateActiveUser } from '../lib/supabase';
import './Lobby.css';

// Helper to format message timestamps
const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Lobby = ({ userName }) => {
  const { user, loading: userLoading, error: userError } = useUser();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesPollRef = useRef(null);
  const usersPollRef = useRef(null);

  // Check if the device is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
      // Always show sidebar when not on mobile
      if (window.innerWidth > 480) {
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages from Supabase
  const fetchMessages = async () => {
    try {
      const data = await getMessages();
      setMessages(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load chat messages. Please try again later.');
      setLoading(false);
    }
  };

  // Fetch active users from Supabase
  const fetchActiveUsers = async () => {
    try {
      const data = await getActiveUsers();
      setOnlineUsers(data);
    } catch (err) {
      console.error('Error fetching active users:', err);
      // Don't set error state here to avoid UI disruption
    }
  };

  // Update user's active status
  const updateUserStatus = async () => {
    if (!user || !user.udid || !user.name) {
      console.warn('Cannot update user status: missing user data');
      return;
    }
    
    try {
      await updateActiveUser({
        udid: user.udid,
        name: user.name
      });
    } catch (err) {
      // Log the error but don't throw it to prevent disrupting the user experience
      console.error('Error updating active status:', err);
    }
  };

  // Send message to Supabase
  const handleSendMessage = async (messageText) => {
    if (!user) return;
    
    try {
      await sendMessage({
        udid: user.udid,
        user: user.name,
        message: messageText
      });
      
      // Fetch all messages again to make sure we have the latest
      fetchMessages();
      
      // Clear input
      setInputMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleSendMessage(inputMessage.trim());
    }
  };

  // Toggle sidebar visibility on mobile
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Set up polling for messages and users
  useEffect(() => {
    // Initial fetch
    fetchMessages();
    fetchActiveUsers();
    
    // Update user's active status
    if (user) {
      updateUserStatus();
    }
    
    // Set up polling intervals
    messagesPollRef.current = setInterval(fetchMessages, 3000); // Poll messages every 3 seconds
    usersPollRef.current = setInterval(fetchActiveUsers, 10000); // Poll users every 10 seconds
    
    // Update active status every minute
    const activeStatusInterval = setInterval(() => {
      if (user) {
        updateUserStatus();
      }
    }, 60000);
    
    // Cleanup on unmount
    return () => {
      clearInterval(messagesPollRef.current);
      clearInterval(usersPollRef.current);
      clearInterval(activeStatusInterval);
    };
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Retry fetching messages
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchMessages();
  };

  return (
    <div className="lobby-container">
      {isMobile && (
        <div className="mobile-header">
          <h3>VISITOR LOBBY</h3>
          <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
            {showSidebar ? 'X' : 'Users'}
          </button>
        </div>
      )}
      
      {(!isMobile || showSidebar) && (
        <div className="lobby-sidebar">
          <div className="lobby-info">
            <h3>Visitor Lobby</h3>
            <p>This is a private test environment. Chat messages are stored in Supabase and limited to the most recent 20.</p>
          </div>
          
          <div className="online-users">
            <h4>Online Users ({onlineUsers.length})</h4>
            <ul className="user-list">
              {onlineUsers.map(user => (
                <motion.li 
                  key={user.udid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="user-status"></span>
                  {user.name}
                </motion.li>
              ))}
              {onlineUsers.length === 0 && (
                <li className="no-users">No other visitors online</li>
              )}
            </ul>
          </div>
        </div>
      )}
      
      <div className="lobby-chat">
        <div className="chat-messages">
          {loading ? (
            <div className="loading-messages">
              <div className="loading-spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : error ? (
            <div className="error-messages">
              <p>{error}</p>
              <button onClick={handleRetry} className="retry-button">
                Retry
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-messages">
              <p>No messages yet. Be the first to say hello!</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id || `${msg.user}-${msg.timestamp}`}
                  className={`message ${msg.udid === user?.udid ? 'my-message' : 'other-message'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="message-header">
                    <span className="message-user">{msg.user}</span>
                    <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="message-form">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={userLoading ? "Loading..." : userError ? "Error loading user" : "Type a message..."}
            disabled={loading || error || userLoading || userError || !user}
            className="message-input"
          />
          <button 
            type="submit" 
            disabled={!inputMessage.trim() || loading || error || userLoading || userError || !user}
            className="send-button"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Lobby; 