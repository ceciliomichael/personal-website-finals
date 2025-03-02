import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useAI } from '../context/AIContext';
import WorldMap from '../components/WorldMap';
import Section from '../components/Section';
import AIChat from '../components/AIChat';
import Feedback from '../components/Feedback';
import AchievementNotification from '../components/AchievementNotification';
import './Portfolio.css';

// Portfolio sections data
const sections = [
  {
    id: 'about',
    title: 'About Me',
    icon: '👤',
    color: '#6a11cb',
    position: { x: 20, y: 30 },
    content: {
      title: 'The Story of Me',
      description: `I'm a passionate developer with a love for creating interactive and engaging web experiences. My journey in tech began when I was just a teenager, tinkering with HTML and CSS to create my first websites. Since then, I've evolved into a full-stack developer with expertise in modern web technologies.`,
      details: [
        'Based in the digital realm, available worldwide',
        'Fluent in JavaScript, Python, and several other programming languages',
        'Believer in clean code and user-centered design',
        'Constantly learning and exploring new technologies'
      ],
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97'
    }
  },
  {
    id: 'experience',
    title: 'Experience',
    icon: '💼',
    color: '#2575fc',
    position: { x: 70, y: 20 },
    content: {
      title: 'My Professional Journey',
      description: 'Throughout my career, I\'ve had the opportunity to work on diverse projects across various industries, honing my skills and expanding my knowledge base.',
      timeline: [
        {
          year: '2022 - Present',
          role: 'Senior Frontend Developer',
          company: 'Tech Innovations Inc.',
          description: 'Leading the frontend development team in creating cutting-edge web applications using React and modern JavaScript.'
        },
        {
          year: '2019 - 2022',
          role: 'Full Stack Developer',
          company: 'Digital Solutions Ltd.',
          description: 'Developed and maintained full-stack applications using Node.js, Express, and React.'
        },
        {
          year: '2017 - 2019',
          role: 'Web Developer',
          company: 'Creative Web Agency',
          description: 'Created responsive websites and implemented interactive features for various clients.'
        }
      ]
    }
  },
  {
    id: 'education',
    title: 'Education',
    icon: '🎓',
    color: '#ff7e5f',
    position: { x: 40, y: 60 },
    content: {
      title: 'My Learning Path',
      description: 'Education has been a cornerstone of my development, both through formal channels and self-directed learning.',
      qualifications: [
        {
          year: '2013 - 2017',
          degree: 'Bachelor of Science in Computer Science',
          institution: 'Tech University',
          description: 'Focused on software engineering and web development.'
        },
        {
          year: '2018',
          degree: 'Full Stack Web Development Certification',
          institution: 'Coding Bootcamp',
          description: 'Intensive program covering modern web development technologies and practices.'
        },
        {
          year: 'Ongoing',
          degree: 'Continuous Learning',
          institution: 'Online Platforms & Self-Study',
          description: 'Regularly completing courses on platforms like Coursera, Udemy, and freeCodeCamp to stay current with industry trends.'
        }
      ]
    }
  },
  {
    id: 'skills',
    title: 'Skills',
    icon: '🛠️',
    color: '#17a2b8',
    position: { x: 80, y: 70 },
    content: {
      title: 'My Technical Toolkit',
      description: 'I\'ve developed a diverse set of skills that allow me to tackle various aspects of web development and software engineering.',
      skillCategories: [
        {
          category: 'Frontend',
          skills: ['React', 'JavaScript (ES6+)', 'TypeScript', 'HTML5', 'CSS3/SASS', 'Redux', 'Next.js']
        },
        {
          category: 'Backend',
          skills: ['Node.js', 'Express', 'Python', 'Django', 'RESTful APIs', 'GraphQL']
        },
        {
          category: 'Database',
          skills: ['MongoDB', 'PostgreSQL', 'MySQL', 'Firebase']
        },
        {
          category: 'DevOps & Tools',
          skills: ['Git', 'Docker', 'CI/CD', 'AWS', 'Webpack', 'Jest', 'Cypress']
        }
      ]
    }
  },
  {
    id: 'projects',
    title: 'Projects',
    icon: '🚀',
    color: '#28a745',
    position: { x: 15, y: 80 },
    content: {
      title: 'My Creative Works',
      description: 'Here are some of the projects I\'ve worked on that showcase my skills and passion for development.',
      projects: [
        {
          title: 'E-commerce Platform',
          description: 'A full-featured online shopping platform with payment integration, user authentication, and admin dashboard.',
          technologies: ['React', 'Node.js', 'MongoDB', 'Stripe API'],
          link: '#'
        },
        {
          title: 'Task Management App',
          description: 'A collaborative task management tool with real-time updates and team collaboration features.',
          technologies: ['React', 'Firebase', 'Material UI'],
          link: '#'
        },
        {
          title: 'Weather Dashboard',
          description: 'An interactive weather application that provides real-time weather data and forecasts for locations worldwide.',
          technologies: ['JavaScript', 'Weather API', 'Chart.js'],
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
  const [userAchievements, setUserAchievements] = useState(achievements);
  const [showAchievement, setShowAchievement] = useState(null);
  const [startTime] = useState(Date.now());
  const transformComponentRef = useRef(null);
  const { sendMessage } = useAI();

  // Handle first visit achievement
  useEffect(() => {
    unlockAchievement('first_visit');
    
    // Set up timer for the "Curious Mind" achievement
    const timerInterval = setInterval(() => {
      const timeSpent = Date.now() - startTime;
      const curiousMindAchievement = userAchievements.find(a => a.id === 'curious_mind');
      
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
      const explorerAchievement = userAchievements.find(a => a.id === 'explorer');
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

  const unlockAchievement = (achievementId) => {
    setUserAchievements(prev => {
      const updated = prev.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, unlocked: true } 
          : achievement
      );
      
      const unlockedAchievement = updated.find(a => a.id === achievementId);
      if (unlockedAchievement && unlockedAchievement.unlocked) {
        setShowAchievement(unlockedAchievement);
        setTimeout(() => setShowAchievement(null), 5000);
      }
      
      return updated;
    });
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

  return (
    <div className="portfolio-container">
      <header className="portfolio-header">
        <h1>Welcome, <span className="user-name">{userName}</span>!</h1>
        <p className="subtitle">Explore my interactive portfolio by clicking on the sections below</p>
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
      
      <div className="achievements-panel">
        <h3>Achievements</h3>
        <div className="achievements-list">
          {userAchievements.map(achievement => (
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
      
      {showAchievement && (
        <AchievementNotification achievement={showAchievement} />
      )}
    </div>
  );
};

export default Portfolio; 