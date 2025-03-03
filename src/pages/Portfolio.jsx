import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useAI } from '../context/AIContext';
import WorldMap from '../components/WorldMap';
import Section from '../components/Section';
import AIChat from '../components/AIChat';
import Feedback from '../components/Feedback';
import AchievementNotification from '../components/AchievementNotification';
import './Portfolio.css';
import { useUser } from '../context/UserContext';

import profile from '../assets/images/profile/me.jpg';
import gallery1 from '../assets/images/gallery/image1.png';
import gallery2 from '../assets/images/gallery/image2.jpg';
import gallery3 from '../assets/images/gallery/image3.jpg';
import gallery4 from '../assets/images/gallery/image4.jpg';
import gallery5 from '../assets/images/gallery/image5.png';
import gallery6 from '../assets/images/gallery/image6.png';


// Portfolio sections data
const sections = [
  {
    id: 'about',
    title: 'About Me',
    icon: '👤',
    color: '#6a11cb',
    position: { x: 20, y: 30 },
    content: {
      title: 'About Michael Cecilio',
      description: `Michael Cecilio is an Aspiring AI Developer & AI Engineer specializing in AI integration and development, with a focus on creating intelligent chatbot systems and implementing pre-built AI models into practical applications.`,
      details: [
        'AI Developer, Prompt Engineer & Tech Enthusiast',
        'GitHub: ceciliomichael | LinkedIn: ceciliomichael',
        'Specializing in AI integration and development, with a focus on creating intelligent chatbot systems and implementing pre-built AI models into practical applications.',
        'Aspiring AI Engineer with expertise in maximizing AI potential through advanced prompting techniques',
        'Full-stack developer leveraging AI for efficient development workflows'
      ],
      image: profile
    }
  },
  {
    id: 'ai-expertise',
    title: 'AI Expertise',
    icon: '🤖',
    color: '#2575fc',
    position: { x: 70, y: 20 },
    content: {
      title: 'AI Development Experience',
      description: 'Specializing in AI integration and development, with a focus on creating intelligent chatbot systems and implementing pre-built AI models into practical applications.',
      timeline: [
        {
          year: 'Current Focus',
          role: 'Development of web-based chatbot applications',
          company: 'Various Projects',
          description: 'Development of web-based chatbot applications with advanced AI integration'
        },
        {
          year: 'AI Prompting',
          role: 'Advanced Prompt Engineering',
          company: 'Various Projects',
          description: 'Expertise in crafting effective prompts to maximize AI potential and extract optimal responses from large language models'
        },
        {
          year: 'AI Optimization',
          role: 'AI Performance Enhancement',
          company: 'Various Projects',
          description: 'Specialized techniques to optimize AI systems for better performance, accuracy, and user experience'
        },
        {
          year: 'Full Stack AI',
          role: 'AI-Assisted Development',
          company: 'Various Projects',
          description: 'Using AI to accelerate and enhance the full stack development process across front-end and back-end systems'
        },
        {
          year: 'System Development',
          role: 'Implementation of pre-built AI models',
          company: 'Research Projects',
          description: 'Implementation of pre-built AI models for enhanced conversational abilities'
        },
        {
          year: 'System Development',
          role: 'Creation of AI communication systems',
          company: 'Research Projects',
          description: 'Creation of systems enabling AI agents to communicate with each other'
        },
        {
          year: 'System Development',
          role: 'Development of deep thinking AI',
          company: 'Research Projects',
          description: 'Development of deep thinking AI chat systems with evolutionary capabilities'
        }
      ]
    }
  },
  {
    id: 'technical-skills',
    title: 'Technical Skills',
    icon: '💻',
    color: '#17a2b8',
    position: { x: 45, y: 60 },
    content: {
      title: 'My Technical Toolkit',
      description: 'A diverse set of skills spanning AI development, web technologies, and software engineering.',
      skillCategories: [
        {
          name: 'Client-Side Technologies',
          skills: [
            { name: 'HTML5', level: 90 },
            { name: 'CSS3', level: 85 },
            { name: 'JavaScript (ES6+)', level: 92 },
            { name: 'Frontend Frameworks', level: 88 },
            { name: 'UI Libraries', level: 85 },
            { name: 'Responsive Web Design', level: 90 }
          ]
        },
        {
          name: 'Client-Side Details',
          skills: [
            { name: 'HTML5: Semantic markup, accessibility', level: 90 },
            { name: 'CSS3: Flexbox, Grid, animations', level: 85 },
            { name: 'JavaScript: ES6+, DOM manipulation', level: 92 },
            { name: 'Frontend Frameworks: React.js, Vue.js, Angular', level: 88 },
            { name: 'UI Libraries: Bootstrap, Material-UI, Tailwind CSS', level: 85 }
          ]
        },
        {
          name: 'Framework Expertise',
          skills: [
            { name: 'React', level: 90 },
            { name: 'Vue', level: 85 },
            { name: 'Flutter', level: 82 }
          ]
        },
        {
          name: 'AI & Integration',
          skills: [
            { name: 'AI Model Integration', level: 95 },
            { name: 'Natural Language Processing', level: 90 },
            { name: 'Chatbot Development', level: 92 },
            { name: 'Prompt Engineering', level: 95 },
            { name: 'AI Optimization Techniques', level: 88 },
            { name: 'AI-Assisted Development', level: 90 }
          ]
        }
      ]
    }
  },
  {
    id: 'development',
    title: 'Development',
    icon: '🚀',
    color: '#ff7e5f',
    position: { x: 25, y: 75 },
    content: {
      title: 'Development Experience',
      description: 'Comprehensive experience across multiple development domains, focusing on creating practical applications and solutions.',
      qualifications: [
        {
          year: 'Web Development',
          degree: 'Full Stack Development',
          institution: 'Multiple Platforms',
          description: 'Frontend: React.js, Vue.js. Backend: Node.js, Express, Django, Flask. Database: MongoDB & Supabase. Tools: Git, Docker, VMware & Virtualbox.'
        },
        {
          year: 'Responsive Design',
          degree: 'Mobile-First Web Development',
          institution: 'Various Projects',
          description: 'Creating responsive web applications optimized for mobile devices. Implementing fluid layouts and adaptive designs that work across different screen sizes.'
        },
        {
          year: 'Flutter Development',
          degree: 'Mobile App Development',
          institution: 'App Projects',
          description: 'Building mobile applications with Flutter. Focusing on creating engaging UI and integrating AI functionalities into mobile experiences.'
        },
        {
          year: 'AI Development',
          degree: 'Artificial Intelligence',
          institution: 'Various Projects',
          description: 'Machine Learning model development and deployment. Natural Language Processing applications. Computer Vision projects. Integration of AI with web and mobile applications.'
        },
        {
          year: 'AI & Chatbot Development',
          degree: 'Specialized AI Systems',
          institution: 'Various Projects',
          description: 'Developed a mobile application featuring an interactive AI chatbot. Implemented voice interaction capabilities for natural conversations. Created web-based chatbot applications using HTML and modern frameworks. Integrated pre-built AI models for enhanced conversational abilities. Experience with natural language processing APIs and libraries.'
        },
        {
          year: 'AI Projects Highlight',
          degree: 'Advanced AI Systems',
          institution: 'Research Projects',
          description: 'Developed an AI system capable of deep thinking and careful thought processing. Created a platform for multiple AI agents to interact and communicate. Implemented evolutionary learning capabilities in AI chat systems. Integrated pre-built AI models with custom learning algorithms.'
        }
      ]
    }
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: '🔮',
    color: '#9147ff',
    position: { x: 75, y: 70 },
    content: {
      title: 'Featured Projects',
      description: 'A selection of my most notable projects, showcasing my skills in AI development, web and mobile applications.',
      projects: [
        {
          title: 'Deepthinking AI Chat',
          description: 'Advanced AI system with deep processing and evolutionary learning capabilities',
          technologies: ['AI', 'NLP', 'Machine Learning', 'Web Development'],
          link: '#'
        },
        {
          title: 'AI-to-AI Communication Platform',
          description: 'Platform enabling multiple AI agents to interact and communicate',
          technologies: ['AI', 'NLP', 'Multi-agent Systems', 'Web Development'],
          link: '#'
        },
        {
          title: 'AIFriend',
          description: 'Mobile application where AI can be your personal friend and companion, created with Flutter',
          technologies: ['Flutter', 'AI', 'Mobile Development', 'UI/UX'],
          link: '#'
        },
        {
          title: 'AI-Powered Chat Application',
          description: 'Implemented using prebuilt open-source models and advanced prompting techniques',
          technologies: ['AI', 'JavaScript', 'NLP', 'API Integration'],
          link: '#'
        },
        {
          title: 'Web Chatbot Interface',
          description: 'HTML-based chatbot with pre-built AI integration',
          technologies: ['HTML', 'CSS', 'JavaScript', 'AI Integration'],
          link: '#'
        }
      ]
    }
  },
  {
    id: 'hobbies',
    title: 'Hobbies',
    icon: '🎮',
    color: '#ffc107',
    position: { x: 60, y: 40 },
    content: {
      title: 'Beyond Coding',
      description: 'When I\'m not immersed in code, you can find me enjoying these activities.',
      hobbies: [
        {
          name: 'AI Experimentation',
          description: 'Passionate about exploring and learning about artificial intelligence and its applications.',
          icon: '🤖'
        },
        {
          name: 'Reading Tech Blogs',
          description: 'Staying updated with the latest in technology and AI development.',
          icon: '📚'
        },
        {
          name: 'Singing',
          description: 'Enjoy singing and performing vocal music in my free time.',
          icon: '🎤'
        },
        {
          name: 'Broadway & Musicals',
          description: 'Love listening to and experiencing Broadway shows and musical theater.',
          icon: '🎭'
        }
      ]
    }
  },
  {
    id: 'goals',
    title: 'Goals',
    icon: '🎯',
    color: '#dc3545',
    position: { x: 30, y: 15 },
    content: {
      title: 'My Future Aspirations',
      description: 'I believe in continuous growth and setting ambitious goals for my personal and professional development.',
      goals: [
        {
          title: 'Further develop expertise in Large Language Models',
          description: 'Expand knowledge in neural network architectures and transformers.',
          timeline: 'Ongoing'
        },
        {
          title: 'Advance as an AI Engineer',
          description: 'Continue developing skills in AI engineering to build more sophisticated AI systems.',
          timeline: 'Current focus'
        },
        {
          title: 'Create practical AI applications',
          description: 'Develop AI solutions that solve real problems and provide value.',
          timeline: 'Current focus'
        },
        {
          title: 'Master prompt engineering techniques',
          description: 'Refine abilities to maximize AI potential through advanced prompting methodologies.',
          timeline: 'Ongoing'
        },
        {
          title: 'AI model optimization and deployment',
          description: 'Learn and implement efficient ways to optimize and deploy AI models.',
          timeline: 'Next 2 years'
        },
        {
          title: 'Full-stack development with AI integration',
          description: 'Combine full-stack development expertise with advanced AI integration capabilities.',
          timeline: 'Current focus'
        },
        {
          title: 'Balance academic studies with AI project development',
          description: 'Continue academic learning while applying knowledge to practical AI projects.',
          timeline: 'Ongoing'
        }
      ]
    }
  },
  {
    id: 'gallery',
    title: 'Gallery',
    icon: '🖼️',
    color: '#6f42c1',
    position: { x: 85, y: 40 },
    content: {
      title: 'Visual Showcase',
      description: 'A collection of images from my work, travels, and creative endeavors.',
      images: [
        {
          url: gallery1,
          caption: 'Minecraft with friends'
        },
        {
          url: gallery2,
          caption: 'Chanel the cat'
        },
        {
          url: gallery3,
          caption: 'Wednesday the cat'
        },
        {
          url: gallery4,
          caption: 'My wallpaper blackhole'
        },
        {
          url: gallery5,
          caption: 'HahTdog'
        },
        {
          url: gallery6,
          caption: 'In the battle of PUBG with friend'
        }
      ]
    }
  },
  {
    id: 'feedback',
    title: 'Feedback',
    icon: '💬',
    color: '#20c997',
    position: { x: 50, y: 85 },
    content: {
      title: 'Share Your Thoughts',
      description: 'I value your feedback! Let me know what you think about my portfolio or leave a message.',
      form: true
    }
  },
  {
    id: 'lobby',
    title: 'Lobby',
    icon: '🗣️',
    color: '#fd7e14',
    position: { x: 90, y: 15 },
    content: {
      title: 'Visitor Lobby',
      description: 'Join the conversation! Connect with other visitors and chat in real-time.',
      lobby: true
    }
  },
  {
    id: 'quest',
    title: 'AI Quest',
    icon: '🧠',
    color: '#e83e8c',
    position: { x: 10, y: 50 },
    content: {
      title: 'Interactive AI Adventure',
      description: 'Embark on an AI-powered adventure where your choices shape the story. Chat with the AI to progress through the narrative and discover hidden paths.',
      aiChat: true
    }
  }
];

// Achievements data
const achievements = [
  {
    id: 'first_visit',
    title: 'First Steps',
    description: 'Visited the portfolio for the first time',
    icon: '🏆',
    unlocked: false
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Visited at least 5 different sections',
    icon: '🧭',
    unlocked: false,
    requiredVisits: 5
  },
  {
    id: 'curious_mind',
    title: 'Curious Mind',
    description: 'Spent more than 5 minutes exploring',
    icon: '🧠',
    unlocked: false,
    timeRequired: 5 * 60 * 1000 // 5 minutes in milliseconds
  },
  {
    id: 'ai_friend',
    title: 'AI Friend',
    description: 'Had a conversation with the AI assistant',
    icon: '🤖',
    unlocked: false
  },
  {
    id: 'feedback_giver',
    title: 'Feedback Giver',
    description: 'Submitted feedback',
    icon: '📝',
    unlocked: false
  },
  {
    id: 'completionist',
    title: 'Completionist',
    description: 'Visited all sections of the portfolio',
    icon: '🌟',
    unlocked: false
  }
];

const Portfolio = ({ userName }) => {
  const [activeSection, setActiveSection] = useState(null);
  const [visitedSections, setVisitedSections] = useState([]);
  const [showAchievement, setShowAchievement] = useState(null);
  const [startTime] = useState(Date.now());
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const transformComponentRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const { sendMessage } = useAI();
  const { user, saveAchievement, isAchievementUnlocked, achievements: userAchievements } = useUser();

  // Initialize local achievements state with unlocked status from the database
  const [localAchievements, setLocalAchievements] = useState(() => {
    return achievements.map(achievement => ({
      ...achievement,
      unlocked: isAchievementUnlocked(achievement.id)
    }));
  });

  // Update local achievements when user achievements change
  useEffect(() => {
    setLocalAchievements(prev => 
      prev.map(achievement => ({
        ...achievement,
        unlocked: isAchievementUnlocked(achievement.id)
      }))
    );
  }, [userAchievements]);

  // Handle first visit achievement
  useEffect(() => {
    unlockAchievement('first_visit');
    
    // Only set up timer if curious_mind achievement is not already unlocked
    const curiousMindAchievement = localAchievements.find(a => a.id === 'curious_mind');
    if (!curiousMindAchievement?.unlocked) {
      const timerInterval = setInterval(() => {
        const timeSpent = Date.now() - startTime;
        if (timeSpent >= curiousMindAchievement.timeRequired) {
          unlockAchievement('curious_mind');
          clearInterval(timerInterval); // Clear interval once achievement is unlocked
        }
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(timerInterval);
    }
  }, [localAchievements]);

  // Track visited sections and check for achievements
  useEffect(() => {
    if (activeSection && !visitedSections.includes(activeSection.id)) {
      const updatedVisitedSections = [...visitedSections, activeSection.id];
      setVisitedSections(updatedVisitedSections);
      
      // Check for "Explorer" achievement
      const explorerAchievement = localAchievements.find(a => a.id === 'explorer');
      if (explorerAchievement && !explorerAchievement.unlocked && updatedVisitedSections.length >= explorerAchievement.requiredVisits) {
        unlockAchievement('explorer');
      }
      
      // Check for "Completionist" achievement
      const totalSections = sections.length;
      if (updatedVisitedSections.length === totalSections) {
        unlockAchievement('completionist');
      }
    }
  }, [activeSection]);

  const unlockAchievement = async (achievementId) => {
    // Check if achievement is already unlocked
    const achievement = localAchievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;
    
    // Update local state
    setLocalAchievements(prev => {
      const updated = prev.map(a => 
        a.id === achievementId 
          ? { ...a, unlocked: true } 
          : a
      );
      
      const unlockedAchievement = updated.find(a => a.id === achievementId);
      if (unlockedAchievement && unlockedAchievement.unlocked) {
        setShowAchievement(unlockedAchievement);
        setTimeout(() => setShowAchievement(null), 5000);
      }
      
      return updated;
    });
    
    // Save to database if user is logged in
    if (user && user.udid) {
      try {
        await saveAchievement(achievementId);
      } catch (error) {
        console.error('Failed to save achievement:', error);
      }
    }
  };

  const handleSectionClick = (section) => {
    setActiveSection(section);
    
    // Calculate zoom position based on section position
    if (transformComponentRef.current) {
      const { zoomToElement } = transformComponentRef.current;
      const element = document.getElementById(`section-${section.id}`);
      if (element) {
        zoomToElement(element);
      }
    }
  };

  const handleCloseSection = () => {
    setActiveSection(null);
    
    // Reset zoom
    if (transformComponentRef.current) {
      const { resetTransform } = transformComponentRef.current;
      resetTransform();
    }
  };

  const handleAIChat = async (message, systemPrompt = '', onStream = null) => {
    // Unlock AI Friend achievement when user interacts with AI
    unlockAchievement('ai_friend');
    
    // If a custom system prompt is provided, use it (from the AIChat component)
    // Otherwise, use the default system prompt
    if (!systemPrompt) {
      systemPrompt = `
        You are an interactive AI guide in a portfolio adventure game. 
        The user's name is ${userName}. 
        Create an engaging, short response that progresses an adventure story based on the user's input.
        
        IMPORTANT: Always provide exactly 3 numbered choices for the user to select from.
        Format these choices as:
        1. First choice description
        2. Second choice description
        3. Third choice description
        
        Keep responses under 150 words and maintain an adventurous, fantasy tone.
        Incorporate references to technology, coding, and web development in creative ways.
      `;
    }
    
    return await sendMessage(message, systemPrompt, onStream);
  };

  const handleFeedbackSubmit = (feedback) => {
    // In a real application, you would send this feedback to a server
    console.log('Feedback submitted:', feedback);
    
    // Unlock the feedback achievement
    unlockAchievement('feedback_giver');
    
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownRef]);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This will remove all your achievements and personal data, but chat history will be preserved.')) {
      // Here you would implement the actual account deletion logic
      // For now, we'll just show an alert
      alert('Account data deleted successfully. Chat history has been preserved.');
      // You could redirect to login page or reset user state here
    }
  };

  return (
    <div className="portfolio-container">
      <header className="portfolio-header">
        <h1>Welcome, <span className="user-name">{userName}</span>!</h1>
        <p className="subtitle">Explore my interactive portfolio by clicking on the sections below</p>
        <div className="profile-icon-container" ref={profileDropdownRef}>
          <button 
            className="profile-icon-button" 
            onClick={toggleProfileDropdown}
            aria-label="Open profile menu"
          >
            <div className="profile-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
          </button>
          
          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <h3>Profile</h3>
              </div>
              
              <div className="profile-dropdown-section">
                <h4>Achievements</h4>
                <div className="achievements-list dropdown-achievements">
                  {localAchievements.map(achievement => (
                    <div 
                      key={achievement.id} 
                      className={`achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                      title={achievement.unlocked ? `${achievement.title}: ${achievement.description}` : 'Achievement locked'}
                    >
                      <span className="achievement-icon">{achievement.icon}</span>
                      <span className="achievement-title">{achievement.title}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="profile-dropdown-section">
                <h4>Account Settings</h4>
                <button 
                  className="danger-button" 
                  onClick={handleDeleteAccount}
                >
                  Delete Account & Data
                </button>
                <p className="settings-note">Note: Chat history will be preserved</p>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <div className="world-container">
        <TransformWrapper
          ref={transformComponentRef}
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
          wrapperClass="react-transform-wrapper"
          contentClass="react-transform-component"
        >
          {({ zoomIn, zoomOut }) => (
            <>
              <div className="zoom-controls">
                <button onClick={() => zoomIn()}>+</button>
                <button onClick={() => zoomOut()}>-</button>
                {activeSection && (
                  <button className="back-button" onClick={handleCloseSection}>
                    Back to Map
                  </button>
                )}
              </div>
              
              <TransformComponent wrapperClass="react-transform-component">
                <WorldMap 
                  sections={sections} 
                  onSectionClick={handleSectionClick} 
                  activeSection={activeSection}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
      
      {activeSection && (
        <Section 
          section={activeSection} 
          onClose={handleCloseSection}
          onAIChat={handleAIChat}
          onFeedbackSubmit={handleFeedbackSubmit}
          userName={userName}
        />
      )}
      
      {showAchievement && (
        <AchievementNotification achievement={showAchievement} />
      )}
    </div>
  );
};

export default Portfolio; 