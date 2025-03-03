import { createContext, useState, useEffect, useContext } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL + '/api';

// Create the context
export const UserContext = createContext(null);

// Create the provider
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);

  // Check for existing user from localStorage on mount
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const storedUdid = localStorage.getItem('userUdid');
        
        if (storedUdid) {
          const response = await fetch(`${API_BASE_URL}/user/${storedUdid}`);
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            
            // Update user's active status
            updateUserActivity(userData);
            
            // Load user achievements
            loadUserAchievements(userData.udid);
          } else {
            // If user not found or other error, clear localStorage
            localStorage.removeItem('userUdid');
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };
    
    checkExistingUser();
  }, []);

  // Function to load user achievements from the server
  const loadUserAchievements = async (udid) => {
    if (!udid) return;
    
    try {
      setAchievementsLoading(true);
      const response = await fetch(`${API_BASE_URL}/user/${udid}/achievements`);
      
      if (response.ok) {
        const achievementsData = await response.json();
        setAchievements(achievementsData);
      } else {
        console.error('Failed to load achievements');
      }
    } catch (err) {
      console.error('Error loading achievements:', err);
    } finally {
      setAchievementsLoading(false);
    }
  };

  // Function to save a user achievement to the server
  const saveAchievement = async (achievementId) => {
    if (!user || !user.udid) return null;
    
    try {
      const response = await fetch(`${API_BASE_URL}/user/${user.udid}/achievements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ achievement_id: achievementId }),
      });
      
      if (response.ok) {
        const savedAchievement = await response.json();
        
        // Update local achievements state
        setAchievements(prevAchievements => {
          // Check if achievement already exists in state
          const exists = prevAchievements.some(a => a.achievement_id === achievementId);
          if (exists) return prevAchievements;
          
          // Add new achievement to state
          return [...prevAchievements, savedAchievement];
        });
        
        return savedAchievement;
      } else {
        console.error('Failed to save achievement');
        return null;
      }
    } catch (err) {
      console.error('Error saving achievement:', err);
      return null;
    }
  };

  // Check if a specific achievement is unlocked
  const isAchievementUnlocked = (achievementId) => {
    return achievements.some(a => a.achievement_id === achievementId);
  };

  // Fetch online users every 30 seconds
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/active`);
        if (response.ok) {
          const users = await response.json();
          setOnlineUsers(users);
        }
      } catch (err) {
        console.error('Error fetching online users:', err);
      }
    };
    
    // Fetch immediately
    fetchOnlineUsers();
    
    // Then set up interval
    const interval = setInterval(fetchOnlineUsers, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Update user's active status every 2 minutes
  useEffect(() => {
    let interval;
    
    if (user) {
      // Update immediately
      updateUserActivity(user);
      
      // Then set up interval
      interval = setInterval(() => {
        updateUserActivity(user);
      }, 120000); // 2 minutes
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  // Function to update user's active status
  const updateUserActivity = async (userData) => {
    try {
      await fetch(`${API_BASE_URL}/users/active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          udid: userData.udid,
          name: userData.name
        }),
      });
    } catch (err) {
      console.error('Error updating user activity:', err);
    }
  };

  // Function to register or authenticate a user
  const registerUser = async (userName) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: userName }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          setError(responseData.error || 'Username already taken');
          throw new Error(responseData.error || 'Username already taken');
        } else {
          setError(responseData.error || 'Failed to register user');
          throw new Error(responseData.error || 'Failed to register user');
        }
      }
      
      // Save UDID to localStorage
      localStorage.setItem('userUdid', responseData.udid);
      
      // Update state
      setUser(responseData);
      
      // Update user's active status
      updateUserActivity(responseData);
      
      // Load user achievements
      loadUserAchievements(responseData.udid);
      
      return responseData;
    } catch (err) {
      console.error('Error registering user:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Function to log out
  const logoutUser = () => {
    localStorage.removeItem('userUdid');
    setUser(null);
    setAchievements([]);
  };

  // Create the context value
  const contextValue = {
    user,
    onlineUsers,
    loading,
    error,
    registerUser,
    logoutUser,
    achievements,
    achievementsLoading,
    saveAchievement,
    isAchievementUnlocked,
    loadUserAchievements
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 