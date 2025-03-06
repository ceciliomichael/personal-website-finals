import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get feedback
export async function getFeedback() {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching feedback:', error)
    throw error
  }
  
  return data
}

// Helper function to add feedback
export async function addFeedback(feedback) {
  const { data, error } = await supabase
    .from('feedback')
    .insert([feedback])
    .select()

  if (error) {
    console.error('Error adding feedback:', error)
    throw error
  }

  return data[0]
}

// Helper function to get chat messages
export async function getMessages() {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching chat messages:', error)
    throw error
  }
  
  // Transform the data to match the expected format in the Lobby component
  return data.map(msg => ({
    id: msg.id,
    user: msg.user_name,
    message: msg.message,
    udid: msg.udid,
    timestamp: msg.created_at
  }))
}

// Helper function to send a chat message
export async function sendMessage(messageData) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{
      user_name: messageData.user,
      message: messageData.message,
      udid: messageData.udid
    }])
    .select()

  if (error) {
    console.error('Error sending chat message:', error)
    throw error
  }

  // Transform the response to match the expected format
  return {
    id: data[0].id,
    user: data[0].user_name,
    message: data[0].message,
    udid: data[0].udid,
    timestamp: data[0].created_at
  }
}

// Helper function to get active users
export async function getActiveUsers() {
  const { data, error } = await supabase
    .from('active_users')
    .select('udid, name')
  
  if (error) {
    console.error('Error fetching active users:', error)
    throw error
  }
  
  return data
}

// Helper function to update active user status
export async function updateActiveUser(userData) {
  const { data, error } = await supabase
    .from('active_users')
    .upsert([{
      udid: userData.udid,
      name: userData.name,
      last_active: new Date().toISOString()
    }], {
      onConflict: 'udid',
      ignoreDuplicates: false
    })
    .select()

  if (error) {
    console.error('Error updating active user:', error)
    throw error
  }

  return data[0]
}

// Helper function to register or get a user
export async function registerUser(userName) {
  // Check if user already exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('name', userName)
    .maybeSingle()
  
  if (checkError) {
    console.error('Error checking for existing user:', checkError)
    throw checkError
  }
  
  // If user exists, return it
  if (existingUser) {
    return existingUser
  }
  
  // Otherwise, create a new user
  const { data, error } = await supabase
    .from('users')
    .insert([{ name: userName }])
    .select()
  
  if (error) {
    // Check if it's a unique constraint violation
    if (error.code === '23505') {
      throw new Error('Username already taken')
    }
    console.error('Error registering user:', error)
    throw error
  }
  
  return data[0]
}

// Helper function to get a user by UDID
export async function getUserByUdid(udid) {
  console.log(`Fetching user with UDID ${udid}`);
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('udid', String(udid))
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user by UDID:', error);
      throw error;
    }
    
    if (!data) {
      console.warn(`No user found with UDID ${udid}`);
    } else {
      console.log(`Found user ${data.name} with UDID ${udid}`);
    }
    
    return data;
  } catch (err) {
    console.error('Error in getUserByUdid:', err);
    return null;
  }
}

// Helper function to get user achievements
export async function getUserAchievements(udid) {
  console.log(`Fetching achievements for user ${udid}`);
  
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_udid', String(udid));
    
    if (error) {
      console.error('Error fetching user achievements:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} achievements for user ${udid}`);
    return data || [];
  } catch (err) {
    console.error('Error in getUserAchievements:', err);
    // Return empty array instead of throwing to prevent UI disruption
    return [];
  }
}

// Helper function to save a user achievement
export async function saveUserAchievement(udid, achievementId) {
  console.log(`Attempting to save achievement ${achievementId} for user ${udid}`);
  
  try {
    // First check if the achievement already exists
    const { data: existingAchievements, error: checkError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_udid', String(udid))
      .eq('achievement_id', String(achievementId));
    
    if (checkError) {
      console.error('Error checking for existing achievement:', checkError);
      throw checkError;
    }
    
    // If achievement already exists, return it
    if (existingAchievements && existingAchievements.length > 0) {
      console.log('Achievement already exists, returning existing record');
      return existingAchievements[0];
    }
    
    console.log('Achievement does not exist, creating new record');
    
    // Otherwise, insert the new achievement
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_udid: String(udid),
        achievement_id: String(achievementId)
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving user achievement:', error);
      
      // If it's a unique constraint violation, try to get the existing achievement again
      // (in case it was created between our check and insert)
      if (error.code === '23505') {
        console.log('Constraint violation, fetching existing achievement');
        const { data: conflictAchievement, error: fetchError } = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_udid', String(udid))
          .eq('achievement_id', String(achievementId))
          .single();
        
        if (fetchError) {
          console.error('Error fetching achievement after conflict:', fetchError);
          throw fetchError;
        }
        
        return conflictAchievement;
      }
      
      throw error;
    }
    
    console.log('Successfully saved achievement:', data);
    return data;
  } catch (err) {
    console.error('Error in saveUserAchievement:', err);
    // Return null instead of throwing to prevent UI disruption
    return null;
  }
} 