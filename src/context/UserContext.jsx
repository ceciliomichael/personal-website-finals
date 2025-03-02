import { createContext, useState, useEffect, useContext } from 'react';

const API_BASE_URL = 'https://026vn2g1-5000.asse.devtunnels.ms//api';

// Create the context
export const UserContext = createContext(null);

// Create the provider
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  };

  // Create the context value
  const contextValue = {
    user,
    onlineUsers,
    loading,
    error,
    registerUser,
    logoutUser,
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