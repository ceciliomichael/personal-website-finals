import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './WorldMap.css';

const WorldMap = ({ sections, onSectionClick, activeSection }) => {
  const [stars, setStars] = useState([]);
  
  // Log sections for debugging
  useEffect(() => {
    console.log('WorldMap rendered with sections:', sections);
  }, [sections]);
  
  // Generate stars for the background
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      const starCount = 150;
      
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          size: `${Math.random() * 2 + 1}px`,
          animationDelay: `${Math.random() * 5}s`
        });
      }
      
      setStars(newStars);
    };
    
    generateStars();
  }, []);

  // Add fallback sections if none are provided
  const displaySections = sections && sections.length > 0 ? sections : [
    {
      id: 'about',
      title: 'About Me',
      icon: '👤',
      color: '#6a11cb',
      position: { x: 30, y: 30 }
    },
    {
      id: 'experience',
      title: 'Experience',
      icon: '💼',
      color: '#2575fc',
      position: { x: 70, y: 30 }
    },
    {
      id: 'education',
      title: 'Education',
      icon: '🎓',
      color: '#ff7e5f',
      position: { x: 30, y: 70 }
    },
    {
      id: 'skills',
      title: 'Skills',
      icon: '🛠️',
      color: '#17a2b8',
      position: { x: 70, y: 70 }
    }
  ];

  return (
    <div className="world-map">
      {/* Debugging output */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, color: 'white', fontSize: '12px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px', display: 'none' }}>
        Sections: {displaySections.length}
      </div>
      
      {/* Stars background */}
      <div className="stars">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.animationDelay
            }}
          />
        ))}
      </div>
      
      {/* Map paths connecting sections */}
      <svg className="map-paths" viewBox="0 0 100 100" preserveAspectRatio="none">
        {displaySections.map((section, index) => {
          // Connect each section to a few nearby sections to create a network
          const connections = displaySections
            .filter((_, i) => i !== index)
            .sort((a, b) => {
              const distA = Math.sqrt(
                Math.pow(section.position.x - a.position.x, 2) + 
                Math.pow(section.position.y - a.position.y, 2)
              );
              const distB = Math.sqrt(
                Math.pow(section.position.x - b.position.x, 2) + 
                Math.pow(section.position.y - b.position.y, 2)
              );
              return distA - distB;
            })
            .slice(0, 2); // Connect to the 2 closest sections
          
          return connections.map((connection, i) => (
            <motion.path
              key={`${section.id}-${connection.id}-${i}`}
              d={`M${section.position.x} ${section.position.y} L${connection.position.x} ${connection.position.y}`}
              stroke={`url(#gradient-${section.id}-${connection.id})`}
              strokeWidth="0.5"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 1.5, delay: index * 0.1 }}
            />
          ));
        }).flat()}
        
        {/* Define gradients for paths */}
        <defs>
          {displaySections.map(section => 
            displaySections.map(connection => (
              <linearGradient
                key={`gradient-${section.id}-${connection.id}`}
                id={`gradient-${section.id}-${connection.id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={section.color} />
                <stop offset="100%" stopColor={connection.color} />
              </linearGradient>
            ))
          ).flat()}
        </defs>
      </svg>
      
      {/* Section nodes */}
      {displaySections.map((section) => (
        <motion.div
          id={`section-${section.id}`}
          key={section.id}
          className={`map-node ${activeSection && activeSection.id === section.id ? 'active' : ''}`}
          style={{
            left: `${section.position.x}%`,
            top: `${section.position.y}%`,
            backgroundColor: section.color
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: displaySections.indexOf(section) * 0.1 }}
          onClick={() => onSectionClick(section)}
          whileHover={{ scale: 1.2, boxShadow: `0 0 20px ${section.color}` }}
        >
          <span className="node-icon">{section.icon}</span>
          <div className="node-tooltip">
            <span>{section.title}</span>
          </div>
        </motion.div>
      ))}
      
      {/* Map decorations */}
      <div className="map-decorations">
        <div className="decoration decoration-1"></div>
        <div className="decoration decoration-2"></div>
        <div className="decoration decoration-3"></div>
      </div>
    </div>
  );
};

export default WorldMap; 