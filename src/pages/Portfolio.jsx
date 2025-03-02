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
      description: `Michael Cecilio is an AI Developer & AI Engineer specializing in AI integration and development, with a focus on creating intelligent chatbot systems and implementing pre-built AI models into practical applications.`,
      details: [
        'AI Developer & Tech Enthusiast',
        'Based in the digital realm, available worldwide',
        'GitHub: ceciliomichael | LinkedIn: ceciliomichael',
        'Passionate about exploring and developing artificial intelligence applications'
      ],
      image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=600&ixid=MnwxfDB8MXxyYW5kb218MHx8dGVjaHx8fHx8fDE2NDAyNjEyMDA&ixlib=rb-1.2.1&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=600'
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
      description: 'Specializing in AI integration and development, with expertise in creating intelligent systems and implementing advanced AI models.',
      timeline: [
        {
          year: 'Current Focus',
          role: 'AI Development & Integration',
          company: 'Various Projects',
          description: 'Development of web-based chatbot applications with advanced AI integration. Implementation of pre-built AI models for enhanced conversational abilities.'
        },
        {
          year: 'System Development',
          role: 'AI Communication Systems',
          company: 'Research Projects',
          description: 'Creation of systems enabling AI agents to communicate with each other. Development of deep thinking AI chat systems with evolutionary capabilities.'
        },
        {
          year: 'Mobile Integration',
          role: 'Mobile AI Applications',
          company: 'App Development',
          description: 'Developed a mobile application featuring an interactive AI chatbot. Implemented voice interaction capabilities for natural conversations.'
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
            { name: 'React.js', level: 88 },
            { name: 'Vue.js', level: 80 },
            { name: 'Angular', level: 75 },
            { name: 'UI Libraries & Frameworks', level: 85 }
          ]
        },
        {
          name: 'AI & Integration',
          skills: [
            { name: 'AI Model Integration', level: 95 },
            { name: 'Natural Language Processing', level: 90 },
            { name: 'Chatbot Development', level: 92 },
            { name: 'Machine Learning', level: 85 },
            { name: 'Computer Vision', level: 80 }
          ]
        },
        {
          name: 'Backend Development',
          skills: [
            { name: 'Node.js', level: 88 },
            { name: 'Express', level: 85 },
            { name: 'Django', level: 80 },
            { name: 'Flask', level: 75 },
            { name: 'MongoDB', level: 82 },
            { name: 'Supabase', level: 78 }
          ]
        },
        {
          name: 'Mobile Development',
          skills: [
            { name: 'Flutter', level: 85 },
            { name: 'React Native', level: 80 },
            { name: 'Kotlin (Android)', level: 75 },
            { name: 'Mobile UI/UX', level: 82 }
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
          year: 'Mobile Development',
          degree: 'Cross-Platform & Native',
          institution: 'App Ecosystems',
          description: 'Native Android development with Kotlin. Cross-platform development with Flutter and React Native. Mobile UI/UX design and implementation.'
        },
        {
          year: 'AI Development',
          degree: 'Artificial Intelligence',
          institution: 'Various Projects',
          description: 'Machine Learning model development and deployment. Natural Language Processing applications. Computer Vision projects. Integration of AI with web and mobile applications.'
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
          description: 'Advanced AI system with deep processing and evolutionary learning capabilities.',
          technologies: ['AI', 'NLP', 'Machine Learning', 'Web Development'],
          link: '#'
        },
        {
          title: 'AI-to-AI Communication Platform',
          description: 'Platform enabling multiple AI agents to interact and communicate.',
          technologies: ['AI', 'NLP', 'Multi-agent Systems', 'Web Development'],
          link: '#'
        },
        {
          title: 'Full Stack E-commerce Platform',
          description: 'Developed using MERN stack with real-time features.',
          technologies: ['MongoDB', 'Express', 'React', 'Node.js', 'Real-time'],
          link: '#'
        },
        {
          title: 'Mobile Fitness Tracking App',
          description: 'Built with Flutter, incorporating ML for pose estimation.',
          technologies: ['Flutter', 'ML', 'Mobile Development', 'UI/UX'],
          link: '#'
        },
        {
          title: 'AI-Powered Chat Application',
          description: 'Implemented using prebuilt open-source models and advanced prompting techniques.',
          technologies: ['AI', 'JavaScript', 'NLP', 'API Integration'],
          link: '#'
        },
        {
          title: 'Web Chatbot Interface',
          description: 'HTML-based chatbot with pre-built AI integration.',
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
          name: 'Gaming',
          description: 'I enjoy both video games and board games, particularly strategy and RPG genres.',
          icon: '🎮'
        },
        {
          name: 'Reading',
          description: 'Science fiction, fantasy, and technical books are my go-to genres for expanding my imagination and knowledge.',
          icon: '📚'
        },
        {
          name: 'Hiking',
          description: 'Exploring nature trails and mountains helps me disconnect and recharge.',
          icon: '🥾'
        },
        {
          name: 'Photography',
          description: 'Capturing moments and scenes, especially during my travels and outdoor adventures.',
          icon: '📷'
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
          title: 'Master AI and Machine Learning',
          description: 'Develop expertise in AI technologies to create more intelligent and adaptive web applications.',
          timeline: 'Next 2 years'
        },
        {
          title: 'Contribute to Open Source',
          description: 'Become an active contributor to major open-source projects in the web development ecosystem.',
          timeline: 'Ongoing'
        },
        {
          title: 'Launch a SaaS Product',
          description: 'Develop and launch my own Software as a Service product that solves a meaningful problem.',
          timeline: 'Next 3 years'
        },
        {
          title: 'Mentor New Developers',
          description: 'Help guide the next generation of developers through mentorship and educational content.',
          timeline: 'Current focus'
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
          url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
          caption: 'Coding session on a productive day'
        },
        {
          url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
          caption: 'Late night debugging'
        },
        {
          url: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d',
          caption: 'Team collaboration meeting'
        },
        {
          url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea',
          caption: 'Workspace setup'
        },
        {
          url: 'https://images.unsplash.com/photo-1503252947848-7338d3f92f31',
          caption: 'Hiking trip to recharge'
        },
        {
          url: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd',
          caption: 'Attending a tech conference'
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
    
    // Set up timer for the "Curious Mind" achievement
    const timerInterval = setInterval(() => {
      const timeSpent = Date.now() - startTime;
      const curiousMindAchievement = localAchievements.find(a => a.id === 'curious_mind');
      
      if (curiousMindAchievement && !curiousMindAchievement.unlocked && timeSpent >= curiousMindAchievement.timeRequired) {
        unlockAchievement('curious_mind');
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(timerInterval);
  }, []);

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

  const handleAIChat = async (message) => {
    // Unlock AI Friend achievement when user interacts with AI
    unlockAchievement('ai_friend');
    
    // System prompt to guide the AI for the quest/game
    const systemPrompt = `
      You are an interactive AI guide in a portfolio adventure game. 
      The user's name is ${userName}. 
      Create an engaging, short response that progresses an adventure story based on the user's input.
      Offer 2-3 clear choices for how they can proceed next.
      Keep responses under 150 words and maintain an adventurous, fantasy tone.
      Incorporate references to technology, coding, and web development in creative ways.
    `;
    
    return await sendMessage(message, systemPrompt);
  };

  const handleFeedbackSubmit = (feedback) => {
    // In a real application, you would send this feedback to a server
    console.log('Feedback submitted:', feedback);
    
    // Unlock the feedback achievement
    unlockAchievement('feedback_giver');
    
    // Show a thank you message or notification
    alert('Thank you for your feedback!');
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