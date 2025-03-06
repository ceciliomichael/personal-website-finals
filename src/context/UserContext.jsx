import { createContext, useState, useEffect, useContext } from 'react';
import { 
  getActiveUsers, 
  updateActiveUser, 
  registerUser as supabaseRegisterUser,
  getUserByUdid,
  getUserAchievements,
  saveUserAchievement
} from '../lib/supabase';

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
          // Use Supabase to get user by UDID
          const userData = await getUserByUdid(storedUdid);
          
          if (userData) {
            setUser(userData);
            
            // Update user's active status
            updateUserActivity(userData);
            
            // Load user achievements
            loadUserAchievements(userData.udid);
          } else {
            // If user not found, clear localStorage
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

  // Function to load user achievements from Supabase
  const loadUserAchievements = async (udid) => {
    if (!udid) {
      console.warn('Cannot load achievements: no user UDID provided');
      return;
    }
    
    try {
      setAchievementsLoading(true);
      console.log(`Loading achievements for user ${udid}`);
      const achievementsData = await getUserAchievements(udid);
      
      // Only update state if we got a valid array
      if (Array.isArray(achievementsData)) {
        console.log(`Loaded ${achievementsData.length} achievements for user ${udid}`);
        setAchievements(achievementsData);
      } else {
        console.warn(`Invalid achievements data received for user ${udid}:`, achievementsData);
        setAchievements([]);
      }
    } catch (err) {
      console.error('Error loading achievements:', err);
      setAchievements([]);
    } finally {
      setAchievementsLoading(false);
    }
  };

  // Function to save a user achievement to Supabase
  const saveAchievement = async (achievementId) => {
    if (!user || !user.udid) {
      console.warn('Cannot save achievement: no user is logged in');
      return null;
    }
    
    try {
      // Check if achievement already exists in local state before making API call
      const achievementExists = achievements.some(a => a.achievement_id === achievementId);
      if (achievementExists) {
        console.log(`Achievement ${achievementId} already exists in local state, skipping save`);
        return achievements.find(a => a.achievement_id === achievementId);
      }
      
      console.log(`Saving achievement ${achievementId} for user ${user.udid}`);
      const savedAchievement = await saveUserAchievement(user.udid, achievementId);
      
      if (!savedAchievement) {
        console.warn(`Failed to save achievement ${achievementId}`);
        return null;
      }
      
      // Update local achievements state
      setAchievements(prevAchievements => {
        // Check if achievement already exists in state (might have been added in another tab/window)
        const exists = prevAchievements.some(a => 
          a.achievement_id === savedAchievement.achievement_id
        );
        
        if (exists) {
          console.log(`Achievement ${achievementId} already in state, not adding again`);
          return prevAchievements;
        }
        
        console.log(`Adding achievement ${achievementId} to local state`);
        // Add new achievement to state
        return [...prevAchievements, savedAchievement];
      });
      
      return savedAchievement;
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
        // Use Supabase to fetch active users
        const users = await getActiveUsers();
        setOnlineUsers(users);
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
    if (!userData || !userData.udid || !userData.name) {
      console.warn('Cannot update user activity: missing user data');
      return;
    }
    
    try {
      // Use Supabase to update active user
      await updateActiveUser({
        udid: userData.udid,
        name: userData.name
      });
    } catch (err) {
      // Log the error but don't throw it to prevent disrupting the user experience
      console.error('Error updating user activity:', err);
    }
  };

  // Function to register or authenticate a user
  const registerUser = async (userName) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use Supabase to register user
      const userData = await supabaseRegisterUser(userName);
      
      // Save UDID to localStorage
      localStorage.setItem('userUdid', userData.udid);
      
      // Update state
      setUser(userData);
      
      // Update user's active status
      try {
        await updateUserActivity(userData);
      } catch (activityErr) {
        // Log but don't fail if updating activity fails
        console.warn('Error updating user activity during registration:', activityErr);
      }
      
      // Load user achievements
      try {
        await loadUserAchievements(userData.udid);
      } catch (achievementErr) {
        // Log but don't fail if loading achievements fails
        console.warn('Error loading achievements during registration:', achievementErr);
      }
      
      return userData;
    } catch (err) {
      console.error('Error registering user:', err);
      
      // Set appropriate error message
      if (err.message === 'Username already taken' || 
          (err.code === '23505' && err.message?.includes('users_name_key'))) {
        setError('Username already taken');
      } else {
        setError('Failed to register user: ' + (err.message || 'Unknown error'));
      }
      
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

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 