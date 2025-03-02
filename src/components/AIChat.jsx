import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './AIChat.css';

const AIChat = ({ onSendMessage, accentColor }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Welcome, brave adventurer! You've discovered the AI Quest portal. I'll be your guide through this interactive adventure. What would you like to do?

1. Embark on a coding quest to discover hidden treasures
2. Explore the mysterious digital forest
3. Learn about the ancient programming artifacts`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Get AI response
      const response = await onSendMessage(input);
      
      if (response) {
        // Add AI response to chat
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'I seem to be having trouble connecting to my knowledge base. Please try again in a moment.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            className={`message ${message.role}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="message-content">
              {message.role === 'assistant' && (
                <div className="assistant-icon" style={{ backgroundColor: accentColor }}>
                  🧠
                </div>
              )}
              <div className="message-text">
                {message.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-content">
              <div className="assistant-icon" style={{ backgroundColor: accentColor }}>
                🧠
              </div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your response or question..."
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          style={{ 
            backgroundColor: input.trim() && !isLoading ? accentColor : '#4a4a6a'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIChat; 