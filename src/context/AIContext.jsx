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

  const sendMessage = async (message, systemPrompt = '', onStream = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const messages = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...conversation,
        { role: 'user', content: message }
      ];

      // If streaming callback is provided, use streaming API
      if (onStream && typeof onStream === 'function') {
        const controller = new AbortController();
        const response = await fetch(MISTRAL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRAL_API_KEY}`
          },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages,
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullResponse = '';

        // Helper function to add delay between chunks
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                    
                    // Process each character with a delay for slower streaming effect
                    let displayedSoFar = '';
                    for (const char of content) {
                      displayedSoFar += char;
                      onStream(char, fullResponse.slice(0, fullResponse.length - content.length + displayedSoFar.length));
                      // Add a delay between characters (100ms for a noticeable slow effect)
                      await delay(20);
                    }
                  }
                } catch (e) {
                  console.error('Error parsing streaming data:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error reading stream:', error);
          controller.abort();
          throw error;
        }

        // Update conversation history
        const updatedConversation = [
          ...conversation,
          { role: 'user', content: message },
          { role: 'assistant', content: fullResponse }
        ];
        
        setConversation(updatedConversation);
        setIsLoading(false);
        
        return fullResponse;
      } else {
        // Non-streaming API call (original implementation)
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
      }
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