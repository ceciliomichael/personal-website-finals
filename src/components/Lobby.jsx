import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import './Lobby.css';

// API Base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL + '/api';

// Helper to format message timestamps
const formatTimestamp = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Lobby = () => {
  const { user, loading: userLoading, error: userError } = useUser();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesPollRef = useRef(null);
  const usersPollRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages from API
  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load chat messages. Please try again later.');
      setLoading(false);
    }
  };

  // Fetch active users
  const fetchActiveUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/active`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch active users');
      }
      
      const data = await response.json();
      setOnlineUsers(data);
    } catch (err) {
      console.error('Error fetching active users:', err);
      // Don't set error state here to avoid UI disruption
    }
  };

  // Send message to API
  const sendMessage = async (messageText) => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          udid: user.udid,
          user: user.name,
          message: messageText
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const newMessage = await response.json();
      
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
      sendMessage(inputMessage.trim());
    }
  };

  // Set up polling for messages and users
  useEffect(() => {
    // Initial fetch
    fetchMessages();
    fetchActiveUsers();
    
    // Set up polling intervals
    messagesPollRef.current = setInterval(fetchMessages, 3000); // Poll messages every 3 seconds
    usersPollRef.current = setInterval(fetchActiveUsers, 10000); // Poll users every 10 seconds
    
    // Cleanup on unmount
    return () => {
      clearInterval(messagesPollRef.current);
      clearInterval(usersPollRef.current);
    };
  }, []);

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
      <div className="lobby-sidebar">
        <div className="lobby-info">
          <h3>Visitor Lobby</h3>
          <p>This is a private test environment. Chat messages are stored in MongoDB and limited to the most recent 20.</p>
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
                  key={msg.id || msg._id || `${msg.user}-${msg.timestamp}`}
                  className={`message ${msg.udid === user?.udid ? 'my-message' : 'other-message'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="message-header">
                    <span className="message-user">{msg.user || msg.userName}</span>
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