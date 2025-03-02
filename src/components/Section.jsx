import { useState } from 'react';
import { motion } from 'framer-motion';
import AIChat from './AIChat';
import FeedbackForm from './FeedbackForm';
import Feedback from './Feedback';
import Lobby from './Lobby';
import './Section.css';

const Section = ({ section, onClose, onAIChat, onFeedbackSubmit, userName = "Visitor" }) => {
  const [activeTab, setActiveTab] = useState('main');
  
  const renderContent = () => {
    const { content } = section;
    
    switch (section.id) {
      case 'about':
        return (
          <div className="about-content">
            <div className="about-image">
              <img src={content.image} alt="Michael Cecilio" />
            </div>
            <div className="about-text">
              <p className="section-description">{content.description}</p>
              <ul className="about-details">
                {content.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
          </div>
        );
        
      case 'ai-expertise':
        return (
          <div className="timeline-content">
            <p className="section-description">{content.description}</p>
            <div className="timeline">
              {content.timeline.map((item, index) => (
                <motion.div 
                  className="timeline-item"
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div className="timeline-marker" style={{ backgroundColor: section.color }}></div>
                  <div className="timeline-content">
                    <h3>{item.role}</h3>
                    <div className="timeline-details">
                      <span className="timeline-company">{item.company}</span>
                      <span className="timeline-year">{item.year}</span>
                    </div>
                    <p>{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
        
      case 'development':
        return (
          <div className="timeline-content">
            <p className="section-description">{content.description}</p>
            <div className="timeline">
              {content.qualifications.map((item, index) => (
                <motion.div 
                  className="timeline-item"
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div className="timeline-marker" style={{ backgroundColor: section.color }}></div>
                  <div className="timeline-content">
                    <h3>{item.degree}</h3>
                    <div className="timeline-details">
                      <span className="timeline-company">{item.institution}</span>
                      <span className="timeline-year">{item.year}</span>
                    </div>
                    <p>{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
        
      case 'technical-skills':
        return (
          <div className="skills-content">
            <p className="section-description">{content.description}</p>
            <div className="skill-categories">
              {content.skillCategories.map((category, index) => (
                <motion.div 
                  className="skill-category"
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <h3>{category.name}</h3>
                  <div className="skills-list">
                    {category.skills.map((skill, i) => (
                      <motion.div 
                        className="skill-item"
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: (index * 0.1) + (i * 0.05) }}
                        style={{ 
                          borderColor: section.color,
                          background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))` 
                        }}
                      >
                        <span>{skill.name}</span>
                        <div className="skill-level" 
                          style={{ 
                            width: `${Math.min(100, skill.level)}%`,
                            background: `linear-gradient(90deg, ${section.color}, rgba(255,255,255,0.3))`
                          }}
                        ></div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
        
      case 'projects':
        return (
          <div className="projects-content">
            <p className="section-description">{content.description}</p>
            <div className="projects-grid">
              {content.projects.map((project, index) => (
                <motion.div 
                  className="project-card"
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  style={{ 
                    borderColor: section.color,
                    background: `linear-gradient(135deg, rgba(25,25,35,0.8), rgba(30,30,50,0.8))`,
                    boxShadow: `0 5px 15px rgba(0,0,0,0.2), 0 0 10px rgba(${parseInt(section.color.slice(1, 3), 16)}, ${parseInt(section.color.slice(3, 5), 16)}, ${parseInt(section.color.slice(5, 7), 16)}, 0.1)`
                  }}
                >
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="project-technologies">
                    {project.technologies.map((tech, i) => (
                      <span 
                        className="technology-tag" 
                        key={i}
                        style={{ 
                          backgroundColor: `rgba(${parseInt(section.color.slice(1, 3), 16)}, ${parseInt(section.color.slice(3, 5), 16)}, ${parseInt(section.color.slice(5, 7), 16)}, 0.2)`,
                          borderColor: section.color
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <a href={project.link} className="project-link" target="_blank" rel="noopener noreferrer" style={{ color: section.color }}>
                    View Project <span>→</span>
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        );
        
      case 'hobbies':
        return (
          <div className="hobbies-content">
            <p className="section-description">{content.description}</p>
            <div className="hobbies-grid">
              {content.hobbies.map((hobby, index) => (
                <motion.div 
                  className="hobby-card"
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  style={{ borderColor: section.color }}
                >
                  <div className="hobby-icon" style={{ backgroundColor: section.color }}>
                    {hobby.icon}
                  </div>
                  <h3>{hobby.name}</h3>
                  <p>{hobby.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        );
        
      case 'goals':
        return (
          <div className="goals-content">
            <p className="section-description">{content.description}</p>
            <div className="goals-grid">
              {content.goals.map((goal, index) => (
                <motion.div 
                  className="goal-card"
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  style={{ borderColor: section.color }}
                >
                  <h3>{goal.title}</h3>
                  <p>{goal.description}</p>
                  <div className="goal-timeline" style={{ color: section.color }}>
                    {goal.timeline}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
        
      case 'gallery':
        return (
          <div className="gallery-content">
            <p className="section-description">{content.description}</p>
            <div className="gallery-grid">
              {content.images.map((image, index) => (
                <motion.div 
                  className="gallery-item"
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <img src={image.url} alt={image.caption} />
                  <div className="image-caption">{image.caption}</div>
                </motion.div>
              ))}
            </div>
          </div>
        );
        
      case 'feedback':
        return (
          <div className="feedback-content">
            <h2>{content.title}</h2>
            <p className="section-description">{content.description}</p>
            <FeedbackForm onSubmit={onFeedbackSubmit} />
          </div>
        );
        
      case 'quest':
        return (
          <div className="quest-content">
            <p className="section-description">{content.description}</p>
            <AIChat onSendMessage={onAIChat} accentColor={section.color} />
          </div>
        );
        
      case 'lobby':
        return (
          <div className="lobby-section">
            <h2>{content.title}</h2>
            <p>{content.description}</p>
            <Lobby userName={userName} />
          </div>
        );
        
      default:
        return (
          <div className="default-content">
            <p className="section-description">{content?.description || "Content coming soon!"}</p>
          </div>
        );
    }
  };

  return (
    <motion.div 
      className="section-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {section ? (
        <div className="section-content" style={{ borderColor: section.color }}>
          <div className="section-header" style={{ backgroundColor: section.color }}>
            <div className="section-title">
              <span className="section-icon">{section.icon}</span>
              <h2>{section.content.title}</h2>
            </div>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          
          <div className="section-body">
            {renderContent()}
          </div>
        </div>
      ) : (
        <div className="section-content" style={{ borderColor: "#6a11cb" }}>
          <div className="section-header" style={{ backgroundColor: "#6a11cb" }}>
            <div className="section-title">
              <span className="section-icon">❓</span>
              <h2>Section Not Found</h2>
            </div>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="section-body">
            <p>The requested section could not be loaded.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Section; 