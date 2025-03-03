import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import './AIChat.css';

const QUEST_TYPES = [
  {
    id: 'fantasy',
    name: 'Fantasy Adventure',
    description: 'Embark on a magical journey through enchanted realms',
    icon: '🧙‍♂️',
    prompt: `You are a fantasy adventure game master. Create an immersive fantasy world with magic, mythical creatures, and epic quests. Incorporate coding and technology concepts as magical elements.
    
    IMPORTANT: Always provide exactly 3 numbered choices for the user to select from.
    Format these choices as:
    1. First choice description
    2. Second choice description
    3. Third choice description`
  },
  {
    id: 'scifi',
    name: 'Sci-Fi Expedition',
    description: 'Explore the far reaches of space and futuristic technology',
    icon: '🚀',
    prompt: `You are an AI guide for a sci-fi adventure. Create a futuristic world with advanced technology, space exploration, and AI. Frame programming concepts as futuristic technology.
    
    IMPORTANT: Always provide exactly 3 numbered choices for the user to select from.
    Format these choices as:
    1. First choice description
    2. Second choice description
    3. Third choice description`
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Mission',
    description: 'Navigate a high-tech dystopian world of hackers and corporations',
    icon: '🤖',
    prompt: `You are a guide in a cyberpunk world. Create a story in a dystopian future with advanced technology, mega-corporations, and digital rebels. Present coding as hacking and digital infiltration.
    
    IMPORTANT: Always provide exactly 3 numbered choices for the user to select from.
    Format these choices as:
    1. First choice description
    2. Second choice description
    3. Third choice description`
  },
  {
    id: 'mystery',
    name: 'Digital Detective',
    description: 'Solve a complex mystery using your coding and logic skills',
    icon: '🔍',
    prompt: `You are a mystery game master. Create an intriguing detective story with clues, suspects, and puzzles. Present programming concepts as tools for solving the mystery.
    
    IMPORTANT: Always provide exactly 3 numbered choices for the user to select from.
    Format these choices as:
    1. First choice description
    2. Second choice description
    3. Third choice description`
  }
];

const AIChat = ({ onSendMessage, accentColor }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questStarted, setQuestStarted] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [choices, setChoices] = useState([]);
  const messagesEndRef = useRef(null);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `# Welcome to AI Quest! 🎮\n\nChoose your adventure type or let me generate a random quest for you:`
      }
    ]);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startQuest = (questType) => {
    setSelectedQuest(questType);
    setQuestStarted(true);
    
    const introMessage = {
      role: 'assistant',
      content: `# ${questType.name} ${questType.icon}\n\n*Initializing quest environment...*\n\n*Generating world and characters...*\n\n**Quest ready!** What would you like to do first?`
    };
    
    setMessages(prev => [...prev, introMessage]);
    
    // Add initial choices for the quest
    setChoices([
      "Explore the surroundings",
      "Introduce myself to nearby characters",
      "Check my inventory/equipment"
    ]);
  };

  const startRandomQuest = () => {
    const randomIndex = Math.floor(Math.random() * QUEST_TYPES.length);
    startQuest(QUEST_TYPES[randomIndex]);
  };

  const handleQuestSelection = (questId) => {
    const quest = QUEST_TYPES.find(q => q.id === questId);
    if (quest) {
      startQuest(quest);
    }
  };
  
  // Extract choices from AI response
  const extractChoices = (content) => {
    const choices = [];
    
    // Look for numbered choices (1. Choice one, 2. Choice two, etc.)
    const numberedChoiceRegex = /(\d+)\.\s+([^\n]+)/g;
    let match;
    
    while ((match = numberedChoiceRegex.exec(content)) !== null) {
      // Remove markdown formatting (** for bold)
      const cleanChoice = match[2].trim().replace(/\*\*/g, '');
      choices.push(cleanChoice);
    }
    
    // If no numbered choices found, look for bullet points
    if (choices.length === 0) {
      const bulletChoiceRegex = /[-*]\s+([^\n]+)/g;
      while ((match = bulletChoiceRegex.exec(content)) !== null) {
        // Remove markdown formatting (** for bold)
        const cleanChoice = match[1].trim().replace(/\*\*/g, '');
        choices.push(cleanChoice);
      }
    }
    
    return choices;
  };
  
  // Handle streaming response from AI
  const handleStreamingResponse = (chunk, fullResponse) => {
    console.log("Streaming message:", fullResponse.length, "characters"); // Debug log
    setStreamingMessage(fullResponse);
    
    // Don't extract choices during streaming - we'll extract them when streaming is complete
  };

  // Handle choice selection
  const handleChoiceClick = (choice) => {
    if (isLoading) return;
    
    // Add user message with the selected choice
    const userMessage = { role: 'user', content: choice };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear streaming message and choices
    setStreamingMessage('');
    setChoices([]);
    
    // Scroll to bottom with a slight delay to allow for smooth animation
    setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    // Send the choice to AI
    handleAIResponse(choice);
  };
  
  // Handle custom input submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Clear streaming message and choices
    setStreamingMessage('');
    setChoices([]);
    
    // Send the message to AI
    handleAIResponse(input);
  };
  
  // Handle AI response
  const handleAIResponse = async (message) => {
    setIsLoading(true);
    
    try {
      // Get AI response with the selected quest prompt
      const systemPrompt = `
        ${selectedQuest.prompt}
        
        Format your responses using markdown:
        - Use # for main headings
        - Use ** for bold text to highlight important information
        - Use * for italic text to describe environments or actions
        - Use > for quotes or special messages
        
        The user's name is ${message.includes('my name is') ? message.split('my name is')[1].trim() : 'Adventurer'}.
        Create an engaging, short response that progresses the adventure story based on the user's input.
        ALWAYS provide EXACTLY 3 numbered choices for how they can proceed next.
        Format these choices as:
        1. First choice description
        2. Second choice description
        3. Third choice description
        
        Keep responses under 200 words and maintain an appropriate tone for the selected quest type.
        Incorporate references to technology, coding, and web development in creative ways.
      `;
      
      // Use streaming API
      const finalResponse = await onSendMessage(message, systemPrompt, handleStreamingResponse);
      console.log("Final response received:", finalResponse);
      
      // When streaming is complete, add the full message to the chat
      setMessages(prev => [...prev, { role: 'assistant', content: finalResponse }]);
      
      // Extract choices after streaming is complete
      const newChoices = extractChoices(finalResponse);
      console.log("Extracted choices from final response:", newChoices);
      
      if (newChoices.length > 0) {
        setChoices(newChoices);
      }
      
      // Clear streaming message
      setStreamingMessage('');
      setIsLoading(false);
    } catch (error) {
      console.error('Error in AI chat:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: '## Connection Error\n\nI seem to be having trouble connecting to my knowledge base. Please try again in a moment.' 
        }
      ]);
      setStreamingMessage('');
      setChoices([]);
    }
  };

  const renderQuestSelection = () => {
    return (
      <div className="quest-selection">
        {QUEST_TYPES.map(quest => (
          <div 
            key={quest.id} 
            className="quest-option"
            onClick={() => handleQuestSelection(quest.id)}
            style={{ borderColor: accentColor }}
          >
            <div className="quest-icon" style={{ backgroundColor: accentColor }}>
              {quest.icon}
            </div>
            <div className="quest-info">
              <h3>{quest.name}</h3>
              <p>{quest.description}</p>
            </div>
          </div>
        ))}
        <div 
          className="quest-option random-quest"
          onClick={startRandomQuest}
          style={{ borderColor: accentColor }}
        >
          <div className="quest-icon" style={{ backgroundColor: accentColor }}>
            🎲
          </div>
          <div className="quest-info">
            <h3>Random Quest</h3>
            <p>Let fate decide your adventure</p>
          </div>
        </div>
      </div>
    );
  };
  
  const renderChoiceButtons = () => {
    // Debug log to see the state of variables
    console.log("Render choice buttons - questStarted:", questStarted, "choices length:", choices.length, "streamingMessage:", Boolean(streamingMessage), "isLoading:", isLoading);
    
    // Only show choices when quest has started, choices exist, and AI is not streaming a response
    if (!questStarted || choices.length === 0 || streamingMessage || isLoading) {
      return null;
    }
    
    return (
      <div className="choice-buttons">
        {choices.map((choice, index) => (
          <button
            key={index}
            className="choice-button"
            onClick={() => handleChoiceClick(choice)}
            style={{ backgroundColor: accentColor }}
            disabled={isLoading}
          >
            <span className="choice-number">{index + 1}</span>
            <span className="choice-text">Option {index + 1}</span>
          </button>
        ))}
      </div>
    );
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
            transition={{ duration: 0.5 }}
          >
            <div className="message-content">
              {message.role === 'assistant' && (
                <div className="assistant-icon" style={{ backgroundColor: accentColor }}>
                  {selectedQuest ? selectedQuest.icon : '🧠'}
                </div>
              )}
              <div className="message-text">
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  <p>{message.content}</p>
                )}
                
                {/* Add choice buttons directly after the last AI message */}
                {message.role === 'assistant' && index === messages.length - 1 && renderChoiceButtons()}
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* Streaming message display */}
        {streamingMessage && (
          <div className="message assistant streaming">
            <div className="message-content">
              <div className="assistant-icon" style={{ backgroundColor: accentColor }}>
                {selectedQuest ? selectedQuest.icon : '🧠'}
              </div>
              <div className="message-text">
                <ReactMarkdown>{streamingMessage}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && !streamingMessage && (
          <div className="message assistant">
            <div className="message-content">
              <div className="assistant-icon" style={{ backgroundColor: accentColor }}>
                {selectedQuest ? selectedQuest.icon : '🧠'}
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
      
      {!questStarted && !isLoading && !streamingMessage && renderQuestSelection()}
      
      {questStarted && (
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a custom response..."
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
      )}
    </div>
  );
};

export default AIChat; 