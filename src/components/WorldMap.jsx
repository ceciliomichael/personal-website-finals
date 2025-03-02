import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './WorldMap.css';

const WorldMap = ({ sections, onSectionClick, activeSection }) => {
  const [stars, setStars] = useState([]);
  const [shootingStars, setShootingStars] = useState([]);
  const mapRef = useRef(null);
  
  // Log sections for debugging
  useEffect(() => {
    console.log('WorldMap rendered with sections:', sections);
  }, [sections]);
  
  // Generate stars for the background
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      const starCount = 180;
      
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
  
  // Generate occasional shooting stars
  useEffect(() => {
    const shootingStarInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of shooting star
        const newShootingStar = {
          id: Date.now(),
          left: `${Math.random() * 50}%`,
          top: `${Math.random() * 40}%`,
          angle: Math.random() * 45,
          animationDelay: `${Math.random() * 0.5}s`,
          opacity: 0
        };
        
        setShootingStars(prev => [...prev, newShootingStar]);
        
        // Remove shooting star after animation
        setTimeout(() => {
          setShootingStars(prev => prev.filter(star => star.id !== newShootingStar.id));
        }, 4000);
      }
    }, 3000);
    
    return () => clearInterval(shootingStarInterval);
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
      id: 'ai-expertise',
      title: 'AI Expertise',
      icon: '🤖',
      color: '#2575fc',
      position: { x: 70, y: 30 }
    },
    {
      id: 'technical-skills',
      title: 'Technical Skills',
      icon: '💻',
      color: '#17a2b8',
      position: { x: 45, y: 60 }
    },
    {
      id: 'development',
      title: 'Development',
      icon: '🚀',
      color: '#ff7e5f',
      position: { x: 25, y: 75 }
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: '🔮',
      color: '#9147ff',
      position: { x: 75, y: 70 }
    }
  ];

  return (
    <div className="world-map" ref={mapRef}>
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
        
        {/* Shooting stars */}
        {shootingStars.map((shootingStar) => (
          <div
            key={shootingStar.id}
            className="shooting-star"
            style={{
              left: shootingStar.left,
              top: shootingStar.top,
              transform: `rotate(${shootingStar.angle}deg)`,
              animationDelay: shootingStar.animationDelay
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
      
      {/* Section nodes - simplified for better positioning */}
      {displaySections.map((section) => (
        <div
          id={`section-${section.id}`}
          key={section.id}
          className={`map-node ${activeSection && activeSection.id === section.id ? 'active' : ''}`}
          style={{
            left: `${section.position.x}%`,
            top: `${section.position.y}%`,
            backgroundColor: section.color
          }}
          onClick={() => onSectionClick(section)}
        >
          <div className="node-icon">{section.icon}</div>
          <div className="node-tooltip">
            <span>{section.title}</span>
          </div>
        </div>
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