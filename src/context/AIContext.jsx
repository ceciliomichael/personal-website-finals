import { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AIContext = createContext();

export const useAI = () => useContext(AIContext);

export const AIProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState([]);

  const MISTRAL_API_KEY = 'JxhLjaoE6MkKqjClC2cEq8jflyMo3GNO';
  const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

  const sendMessage = async (message, systemPrompt = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const messages = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...conversation,
        { role: 'user', content: message }
      ];

      const response = await axios.post(
        MISTRAL_API_URL,
        {
          model: 'mistral-small-latest',
          messages,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRAL_API_KEY}`
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      
      // Update conversation history
      const updatedConversation = [
        ...conversation,
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      ];
      
      setConversation(updatedConversation);
      setIsLoading(false);
      
      return aiResponse;
    } catch (err) {
      console.error('Error communicating with Mistral AI:', err);
      setError('Failed to communicate with AI. Please try again.');
      setIsLoading(false);
      return null;
    }
  };

  const clearConversation = () => {
    setConversation([]);
  };

  const value = {
    sendMessage,
    clearConversation,
    isLoading,
    error,
    conversation
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export default AIContext; 