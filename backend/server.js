import express from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://personal-website6.vercel.app', 'https://www.ultrawavelet.me', 'https://ultrawavelet.me', 'https://webprog-cecilio.vercel.app'] 
    : '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// CORS preflight handling
app.options('*', cors());

// Add CORS headers to all responses
app.use((req, res, next) => {
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://personal-website6.vercel.app', 'https://www.ultrawavelet.me', 'https://ultrawavelet.me', 'https://webprog-cecilio.vercel.app']
    : '*';
    
  const origin = req.headers.origin;
  if (allowedOrigins === '*' || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.header('Access-Control-Allow-Origin', 'https://webprog-cecilio.vercel.app');
  }
  
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Add simple CORS handler as a fallback
app.use((req, res, next) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', 'https://webprog-cecilio.vercel.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(204).send();
  }
  next();
});

// Body parser middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    inMemoryDb: usingInMemoryDb,
    mongodb: !usingInMemoryDb
  });
});

// In-memory database fallback (will be used if MongoDB connection fails)
const inMemoryDb = {
  users: [],
  active_users: [],
  chat_messages: [],
  user_achievements: [] // Add user_achievements to in-memory DB
};

// MongoDB connection settings
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'portfolio_db';
const MONGO_CONNECT_TIMEOUT = 5000; // 5 seconds timeout

// Flag to track if we're using in-memory DB
let usingInMemoryDb = false;
let db, usersCollection, activeUsersCollection, chatMessagesCollection, userAchievementsCollection;

// Maximum number of chat messages to keep
const MAX_CHAT_MESSAGES = 20;

// Helper functions for in-memory DB operations
const inMemoryFindOne = (collection, query = {}) => {
  if (!inMemoryDb[collection]) {
    console.error(`Collection ${collection} not found in in-memory DB`);
    return null;
  }
  
  for (const item of inMemoryDb[collection]) {
    let match = true;
    for (const [key, value] of Object.entries(query)) {
      if (!(key in item) || item[key] !== value) {
        match = false;
        break;
      }
    }
    if (match) {
      return item;
    }
  }
  return null;
};

const inMemoryInsertOne = (collection, document) => {
  if (!inMemoryDb[collection]) {
    console.error(`Collection ${collection} not found in in-memory DB`);
    inMemoryDb[collection] = [];
  }
  
  // Generate a fake ObjectId (just a string)
  const fakeId = Math.random().toString(36).substring(2, 15);
  document._id = fakeId;
  
  // Add to collection
  inMemoryDb[collection].push(document);
  
  // Return result similar to MongoDB
  return {
    acknowledged: true,
    insertedId: fakeId
  };
};

const inMemoryFind = (collection, options = {}) => {
  if (!inMemoryDb[collection]) {
    console.error(`Collection ${collection} not found in in-memory DB`);
    return [];
  }
  
  let results = [...inMemoryDb[collection]];
  
  // Apply sorting if specified
  if (options.sortKey) {
    results.sort((a, b) => {
      if (options.sortDir === -1) {
        return b[options.sortKey] - a[options.sortKey];
      }
      return a[options.sortKey] - b[options.sortKey];
    });
  }
  
  // Apply limit if specified
  if (options.limit && options.limit > 0) {
    results = results.slice(0, options.limit);
  }
  
  return results;
};

const inMemoryUpdateOne = (collection, query, update, options = { upsert: false }) => {
  if (!inMemoryDb[collection]) {
    console.error(`Collection ${collection} not found in in-memory DB`);
    inMemoryDb[collection] = [];
  }
  
  // Find the item index
  let itemIndex = -1;
  for (let i = 0; i < inMemoryDb[collection].length; i++) {
    const item = inMemoryDb[collection][i];
    let match = true;
    for (const [key, value] of Object.entries(query)) {
      if (!(key in item) || item[key] !== value) {
        match = false;
        break;
      }
    }
    if (match) {
      itemIndex = i;
      break;
    }
  }
  
  if (itemIndex >= 0) {
    // Item found, update it
    if (update.$set) {
      for (const [key, value] of Object.entries(update.$set)) {
        inMemoryDb[collection][itemIndex][key] = value;
      }
    }
    
    return {
      modifiedCount: 1,
      upsertedId: null
    };
  } else if (options.upsert) {
    // Create new document
    const newDoc = { ...query };
    
    if (update.$set) {
      for (const [key, value] of Object.entries(update.$set)) {
        newDoc[key] = value;
      }
    }
    
    // Generate a fake ObjectId
    const fakeId = Math.random().toString(36).substring(2, 15);
    newDoc._id = fakeId;
    
    // Add to collection
    inMemoryDb[collection].push(newDoc);
    
    return {
      modifiedCount: 0,
      upsertedId: fakeId
    };
  }
  
  return {
    modifiedCount: 0,
    upsertedId: null
  };
};

const inMemoryCountDocuments = (collection, query = {}) => {
  return inMemoryFind(collection, { query }).length;
};

const inMemoryDeleteOne = (collection, query = {}) => {
  if (!inMemoryDb[collection]) {
    console.error(`Collection ${collection} not found in in-memory DB`);
    return { deletedCount: 0 };
  }
  
  const initialLength = inMemoryDb[collection].length;
  
  // Find first matching document
  let indexToDelete = -1;
  for (let i = 0; i < inMemoryDb[collection].length; i++) {
    const item = inMemoryDb[collection][i];
    let match = true;
    for (const [key, value] of Object.entries(query)) {
      if (!(key in item) || item[key] !== value) {
        match = false;
        break;
      }
    }
    if (match) {
      indexToDelete = i;
      break;
    }
  }
  
  // Delete if found
  if (indexToDelete >= 0) {
    inMemoryDb[collection].splice(indexToDelete, 1);
    return { deletedCount: 1 };
  }
  
  return { deletedCount: 0 };
};

const inMemoryCreateIndex = (collection, field, options = {}) => {
  // Just a no-op for the in-memory DB
  return;
};

// Connect to MongoDB with better error handling
(async function connectToMongoDB() {
  try {
    console.log(`Attempting to connect to MongoDB at ${MONGO_URI}...`);
    
    const client = new MongoClient(MONGO_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: MONGO_CONNECT_TIMEOUT,
      connectTimeoutMS: MONGO_CONNECT_TIMEOUT
    });
    
    await client.connect();
    // Ping to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log(`Successfully connected to MongoDB at ${MONGO_URI}!`);
    
    db = client.db(MONGO_DB_NAME);
    usersCollection = db.collection("users");
    activeUsersCollection = db.collection("active_users");
    chatMessagesCollection = db.collection("chat_messages");
    userAchievementsCollection = db.collection("user_achievements");
    
    // Create TTL index for active users (automatically remove after 5 minutes of inactivity)
    await activeUsersCollection.createIndex("last_active", { expireAfterSeconds: 300 });
    
    // Create index for chat messages by timestamp for efficient sorting
    await chatMessagesCollection.createIndex("timestamp");
    
    // Create index for user achievements by user_udid for efficient lookups
    await userAchievementsCollection.createIndex("user_udid");
  } catch (error) {
    usingInMemoryDb = true;
    console.error(`Failed to connect to MongoDB: ${error}`);
    console.log("USING IN-MEMORY DATABASE FALLBACK");
  }
})();

// API Routes
// Create or find user
app.post('/api/user', async (req, res) => {
  try {
    const { name: userName } = req.body;
    
    if (!userName) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    if (usingInMemoryDb) {
      // Check if user already exists
      const existingUser = inMemoryFindOne("users", { name: userName });
      
      if (existingUser) {
        // Return error if name already exists
        return res.status(409).json({ error: "Username already taken. Please choose a different name." });
      }
      
      // Create new user with UDID
      const newUser = {
        name: userName,
        udid: uuidv4(),
        created_at: new Date().toISOString()
      };
      
      const result = inMemoryInsertOne("users", newUser);
      newUser._id = result.insertedId;
      
      return res.status(201).json(newUser);
    } else {
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ name: userName });
      
      if (existingUser) {
        // Return error if name already exists
        return res.status(409).json({ error: "Username already taken. Please choose a different name." });
      }
      
      // Create new user with UDID
      const newUser = {
        name: userName,
        udid: uuidv4(),
        created_at: new Date()
      };
      
      const result = await usersCollection.insertOne(newUser);
      newUser._id = result.insertedId.toString();
      
      return res.status(201).json(newUser);
    }
  } catch (error) {
    console.error(`Error creating user: ${error}`);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Get user by UDID
app.get('/api/user/:udid', async (req, res) => {
  try {
    const { udid } = req.params;
    
    let user;
    if (usingInMemoryDb) {
      user = inMemoryFindOne("users", { udid });
    } else {
      user = await usersCollection.findOne({ udid });
    }
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Convert ObjectId to string for JSON serialization if needed
    if (user._id instanceof ObjectId) {
      user._id = user._id.toString();
    }
    
    return res.json(user);
  } catch (error) {
    console.error(`Error getting user: ${error}`);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Add a specific OPTIONS handler for the user endpoint
app.options('/api/user/:udid', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204); // No content needed for preflight response
});

// Delete user account
app.delete('/api/user/:udid', async (req, res) => {
  try {
    const { udid } = req.params;
    
    // Check if user exists
    let user;
    if (usingInMemoryDb) {
      user = inMemoryFindOne("users", { udid });
    } else {
      user = await usersCollection.findOne({ udid });
    }
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Delete user and all related data
    if (usingInMemoryDb) {
      // Delete user
      inMemoryDeleteOne("users", { udid });
      
      // Delete user's achievements
      const achievements = inMemoryFind("user_achievements", { query: { user_udid: udid } });
      for (const achievement of achievements) {
        inMemoryDeleteOne("user_achievements", { _id: achievement._id });
      }
      
      // Delete user from active users
      inMemoryDeleteOne("active_users", { udid });
      
      // Note: We're not deleting chat messages as they should remain for other users
    } else {
      // Delete user
      await usersCollection.deleteOne({ udid });
      
      // Delete user's achievements
      await userAchievementsCollection.deleteMany({ user_udid: udid });
      
      // Delete user from active users
      await activeUsersCollection.deleteOne({ udid });
      
      // Note: We're not deleting chat messages as they should remain for other users
    }
    
    return res.status(200).json({ status: "success", message: "User account deleted successfully" });
  } catch (error) {
    console.error(`Error deleting user: ${error}`);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Get user achievements
app.get('/api/user/:udid/achievements', async (req, res) => {
  try {
    console.log(`GET /api/user/${req.params.udid}/achievements called, using in-memory DB:`, usingInMemoryDb);
    const { udid } = req.params;
    
    if (usingInMemoryDb) {
      // Check if user exists
      const user = inMemoryFindOne("users", { udid });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Filter achievements manually for this user
      const achievements = inMemoryDb.user_achievements.filter(a => a.user_udid === udid);
      
      console.log(`Found ${achievements.length} achievements for user ${udid}`);
      
      // If no achievements found, return empty array
      if (!achievements || achievements.length === 0) {
        return res.json([]);
      }
      
      // Convert ObjectId to string for JSON serialization if needed
      achievements.forEach(achievement => {
        if (achievement._id && typeof achievement._id !== 'string') {
          achievement._id = achievement._id.toString();
        }
      });
      
      return res.json(achievements);
    } else {
      // Check if user exists
      const user = await usersCollection.findOne({ udid });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get user achievements
      const achievements = await userAchievementsCollection.find({ user_udid: udid }).toArray();
      
      // Convert ObjectId to string for JSON serialization
      achievements.forEach(achievement => {
        if (achievement._id) {
          achievement._id = achievement._id.toString();
        }
      });
      
      return res.json(achievements);
    }
  } catch (error) {
    console.error(`Error getting user achievements: ${error.stack || error}`);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Save user achievement
app.post('/api/user/:udid/achievements', async (req, res) => {
  try {
    console.log(`POST /api/user/${req.params.udid}/achievements called, using in-memory DB:`, usingInMemoryDb);
    const { udid } = req.params;
    const { achievement_id } = req.body;
    
    if (!achievement_id) {
      return res.status(400).json({ error: "Achievement ID is required" });
    }
    
    if (usingInMemoryDb) {
      // Check if user exists
      const user = inMemoryFindOne("users", { udid });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if achievement already exists
      const existingAchievements = inMemoryDb.user_achievements.filter(
        a => a.user_udid === udid && a.achievement_id === achievement_id
      );
      
      if (existingAchievements.length > 0) {
        // Achievement already unlocked, just return the first one
        const existingAchievement = existingAchievements[0];
        
        // If there are duplicates, clean them up
        if (existingAchievements.length > 1) {
          console.log(`Found ${existingAchievements.length} duplicate achievements for user ${udid}, achievement ${achievement_id}. Cleaning up...`);
          
          // Keep only the first one in the array
          inMemoryDb.user_achievements = inMemoryDb.user_achievements.filter(
            a => a !== existingAchievements[0] && 
            !(a.user_udid === udid && a.achievement_id === achievement_id)
          );
          
          // Add back the first one
          inMemoryDb.user_achievements.push(existingAchievements[0]);
        }
        
        return res.json(existingAchievement);
      }
      
      // Create new achievement record
      const newAchievement = {
        _id: Math.random().toString(36).substring(2, 15),
        user_udid: udid,
        achievement_id,
        unlocked_at: new Date().toISOString()
      };
      
      // Add to collection
      inMemoryDb.user_achievements.push(newAchievement);
      
      return res.status(201).json(newAchievement);
    } else {
      // Check if user exists
      const user = await usersCollection.findOne({ udid });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if achievement already exists
      const existingAchievement = await userAchievementsCollection.findOne({ 
        user_udid: udid, 
        achievement_id 
      });
      
      if (existingAchievement) {
        // Achievement already unlocked
        existingAchievement._id = existingAchievement._id.toString();
        return res.json(existingAchievement);
      }
      
      // Create new achievement record
      const newAchievement = {
        user_udid: udid,
        achievement_id,
        unlocked_at: new Date()
      };
      
      // Add to collection
      const result = await userAchievementsCollection.insertOne(newAchievement);
      newAchievement._id = result.insertedId.toString();
      
      return res.status(201).json(newAchievement);
    }
  } catch (error) {
    console.error(`Error saving achievement: ${error.stack || error}`);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Update active user
app.post('/api/users/active', async (req, res) => {
  try {
    const { udid, name } = req.body;
    
    if (!udid || !name) {
      return res.status(400).json({ error: "UDID and name are required" });
    }
    
    const currentTime = new Date();
    
    if (usingInMemoryDb) {
      // Update or insert active user
      inMemoryUpdateOne(
        "active_users",
        { udid },
        {
          $set: {
            name,
            last_active: currentTime.toISOString()
          }
        },
        { upsert: true }
      );
    } else {
      // Update or insert active user
      await activeUsersCollection.updateOne(
        { udid },
        {
          $set: {
            name,
            last_active: currentTime
          }
        },
        { upsert: true }
      );
    }
    
    return res.status(200).json({ status: "success" });
  } catch (error) {
    console.error(`Error updating active user: ${error}`);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Get active users
app.get('/api/users/active', async (req, res) => {
  try {
    if (usingInMemoryDb) {
      // In memory, manually filter expired users (older than 5 minutes)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const activeUsers = [];
      
      for (const user of inMemoryDb.active_users) {
        if (user.last_active) {
          const lastActive = new Date(user.last_active);
          if (lastActive > fiveMinAgo) {
            activeUsers.push({ udid: user.udid, name: user.name });
          }
        }
      }
      
      return res.json(activeUsers);
    } else {
      // Get all active users
      const activeUsers = await activeUsersCollection.find({}, { projection: { _id: 0, udid: 1, name: 1 } }).toArray();
      return res.json(activeUsers);
    }
  } catch (error) {
    console.error(`Error getting active users: ${error}`);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Get chat messages
app.get('/api/chat/messages', async (req, res) => {
  try {
    console.log("GET /api/chat/messages called, using in-memory DB:", usingInMemoryDb);
    
    if (usingInMemoryDb) {
      // Initialize with sample data if empty
      if (!inMemoryDb.chat_messages || inMemoryDb.chat_messages.length === 0) {
        inMemoryDb.chat_messages = [
          {
            id: "sample-1",
            user_udid: "system",
            username: "System",
            message: "Welcome to the chat! This is using an in-memory database.",
            timestamp: new Date().getTime()
          }
        ];
      }
      
      // Get messages from in-memory DB
      console.log(`In-memory DB has ${inMemoryDb.chat_messages.length} messages`);
      
      // Sort messages by timestamp (newest first)
      const sortedMessages = [...inMemoryDb.chat_messages].sort((a, b) => {
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
      
      // Limit to 100 messages
      const limitedMessages = sortedMessages.slice(0, 100);
      
      // Reverse to get chronological order (oldest first)
      limitedMessages.reverse();
      
      return res.json(limitedMessages);
    } else {
      // Get from MongoDB
      const messages = await chatMessagesCollection.find({}, { projection: { _id: 0 } })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();
      
      // Reverse to get chronological order
      messages.reverse();
      return res.json(messages);
    }
  } catch (error) {
    console.error(`Error getting chat messages: ${error.stack || error}`);
    return res.status(500).json({ error: "Failed to fetch messages", details: error.message });
  }
});

// Add chat message
app.post('/api/chat/messages', async (req, res) => {
  try {
    console.log("Received message POST request");
    const data = req.body;
    console.log(`Request data: ${JSON.stringify(data)}`);
    
    if (!data) {
      console.log("No JSON data provided");
      return res.status(400).json({ error: "No JSON data provided" });
    }
    
    if (!data.user || !data.message) {
      console.log(`Missing required fields. User: ${data.user}, Message: ${data.message}`);
      return res.status(400).json({ error: "User and message are required" });
    }
    
    const currentTime = new Date();
    
    // Create new message
    let newMessage = {
      user: data.user,
      message: data.message,
      udid: data.udid || '',
      timestamp: currentTime
    };
    console.log(`Created new message object: ${JSON.stringify(newMessage)}`);
    
    let responseMessage;
    
    if (usingInMemoryDb) {
      // Insert new message
      console.log("Inserting message into in-memory storage");
      newMessage.timestamp = currentTime.toISOString();  // Convert to string for in-memory storage
      const result = inMemoryInsertOne("chat_messages", newMessage);
      console.log(`Insert result: ${result.insertedId}`);
      
      // Get total count of messages
      console.log("Counting messages");
      const count = inMemoryCountDocuments("chat_messages");
      console.log(`Total message count: ${count}`);
      
      // If we exceed our limit, delete the oldest messages
      if (count > MAX_CHAT_MESSAGES) {
        console.log(`Message count ${count} exceeds limit ${MAX_CHAT_MESSAGES}, deleting oldest messages`);
        // Find the oldest messages to delete
        const oldestMessages = inMemoryFind("chat_messages", {
          sortKey: "timestamp",
          sortDir: 1,
          limit: count - MAX_CHAT_MESSAGES
        });
        
        // Delete them
        for (const msg of oldestMessages) {
          console.log(`Deleting old message: ${msg._id}`);
          inMemoryDeleteOne("chat_messages", { _id: msg._id });
        }
      }
      
      // Prepare response object - already handled in memory version
      responseMessage = newMessage;
    } else {
      // Insert new message
      console.log("Inserting message into MongoDB");
      const result = await chatMessagesCollection.insertOne(newMessage);
      console.log(`Insert result: ${result.insertedId}`);
      
      // Get total count of messages
      console.log("Counting messages");
      const count = await chatMessagesCollection.countDocuments({});
      console.log(`Total message count: ${count}`);
      
      // If we exceed our limit, delete the oldest messages
      if (count > MAX_CHAT_MESSAGES) {
        console.log(`Message count ${count} exceeds limit ${MAX_CHAT_MESSAGES}, deleting oldest messages`);
        // Find the oldest messages to delete
        const oldestMessages = await chatMessagesCollection.find()
          .sort({ timestamp: 1 })
          .limit(count - MAX_CHAT_MESSAGES)
          .toArray();
        
        // Delete them
        for (const msg of oldestMessages) {
          console.log(`Deleting old message: ${msg._id}`);
          await chatMessagesCollection.deleteOne({ _id: msg._id });
        }
      }
      
      // Create a copy of the message for the response
      responseMessage = { ...newMessage };
      
      // Convert the ObjectId to string if it exists (MongoDB adds this)
      if (responseMessage._id) {
        responseMessage._id = responseMessage._id.toString();
      }
      
      // Convert the timestamp to ISO format for JSON serialization
      responseMessage.timestamp = responseMessage.timestamp.toISOString();
    }
    
    console.log("Returning success response");
    return res.status(201).json(responseMessage);
  } catch (error) {
    console.error(`Error adding chat message: ${error}`);
    console.error(`Stack trace: ${error.stack}`);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Submit feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const data = req.body;
    
    if (!data.name || !data.email || !data.message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }
    
    const currentTime = new Date();
    
    const feedback = {
      name: data.name,
      email: data.email,
      message: data.message,
      rating: data.rating || 0,
      udid: data.udid,
      created_at: currentTime
    };
    
    if (usingInMemoryDb) {
      // Convert datetime to string for in-memory storage
      feedback.created_at = currentTime.toISOString();
      inMemoryInsertOne("feedback", feedback);
    } else {
      await db.collection("feedback").insertOne(feedback);
    }
    
    return res.status(201).json({ status: "success" });
  } catch (error) {
    console.error(`Error submitting feedback: ${error}`);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    if (usingInMemoryDb) {
      // Test in-memory DB
      const collections = {
        users: inMemoryDb.users.length,
        active_users: inMemoryDb.active_users.length,
        chat_messages: inMemoryDb.chat_messages.length,
        user_achievements: inMemoryDb.user_achievements.length
      };
      
      return res.status(200).json({
        status: "success",
        message: "Using in-memory database fallback",
        collections
      });
    } else {
      // Test MongoDB connection
      const result = await db.command({ ping: 1 });
      
      // Get collections stats
      const collections = {
        users: await usersCollection.countDocuments({}),
        active_users: await activeUsersCollection.countDocuments({}),
        chat_messages: await chatMessagesCollection.countDocuments({}),
        user_achievements: await userAchievementsCollection.countDocuments({})
      };
      
      return res.status(200).json({
        status: "success",
        message: "MongoDB connection is working",
        ping_result: result,
        collections
      });
    }
  } catch (error) {
    console.error(`Database error: ${error}`);
    console.error(`Stack trace: ${error.stack}`);
    
    return res.status(500).json({
      status: "error",
      message: `Database error: ${error.message}`,
      traceback: error.stack
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});