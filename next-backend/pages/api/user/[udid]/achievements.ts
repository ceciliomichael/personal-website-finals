import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToMongoDB, inMemoryFindOne, inMemoryInsertOne, inMemoryFind } from '@/lib/mongodb';
import { UserAchievement } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the user UDID from the URL
  const { udid } = req.query;
  
  // Handle GET request
  if (req.method === 'GET') {
    try {
      console.log(`GET /api/user/${udid}/achievements called`);
      const { client, usingInMemoryDb } = await connectToMongoDB();
      
      if (usingInMemoryDb) {
        // Check if user exists
        const user = inMemoryFindOne("users", { udid });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Filter achievements manually for this user
        const achievements = inMemoryFind("user_achievements", { query: { user_udid: udid } });
        
        console.log(`Found ${achievements.length} achievements for user ${udid}`);
        
        // If no achievements found, return empty array
        if (!achievements || achievements.length === 0) {
          return res.json([]);
        }
        
        // Convert ObjectId to string for JSON serialization if needed
        const serializedAchievements = achievements.map(achievement => {
          return {
            ...achievement,
            _id: achievement._id && typeof achievement._id !== 'string' 
              ? achievement._id.toString() 
              : achievement._id
          };
        });
        
        return res.json(serializedAchievements);
      } else {
        const db = client!.db(process.env.MONGO_DB_NAME);
        
        // Check if user exists
        const user = await db.collection("users").findOne({ udid });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Get user achievements
        const achievements = await db.collection("user_achievements").find({ user_udid: udid }).toArray();
        
        // Convert ObjectId to string for JSON serialization
        const serializedAchievements = achievements.map(achievement => {
          // Create a new object with the _id as string
          return {
            ...achievement,
            _id: achievement._id ? achievement._id.toString() : undefined
          };
        });
        
        return res.json(serializedAchievements);
      }
    } catch (error) {
      console.error(`Error getting user achievements: ${error instanceof Error ? error.stack : error}`);
      return res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
  
  // Handle POST request
  if (req.method === 'POST') {
    try {
      console.log(`POST /api/user/${udid}/achievements called`);
      const { achievement_id } = req.body;
      
      if (!achievement_id) {
        return res.status(400).json({ error: "Achievement ID is required" });
      }
      
      const { client, usingInMemoryDb } = await connectToMongoDB();
      
      if (usingInMemoryDb) {
        // Check if user exists
        const user = inMemoryFindOne("users", { udid });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Check if achievement already exists
        const existingAchievements = inMemoryFind("user_achievements", { 
          query: { user_udid: udid, achievement_id }
        });
        
        if (existingAchievements.length > 0) {
          // Achievement already unlocked, just return the first one
          const existingAchievement = existingAchievements[0];
          
          // If there are duplicates, clean them up
          if (existingAchievements.length > 1) {
            console.log(`Found ${existingAchievements.length} duplicate achievements for user ${udid}, achievement ${achievement_id}. Cleaning up...`);
            
            // Keep only the first one in the array
            const achievementsToKeep = inMemoryFind("user_achievements", {
              query: {
                $or: [
                  { _id: existingAchievement._id },
                  { 
                    $and: [
                      { user_udid: { $ne: udid } },
                      { achievement_id: { $ne: achievement_id } }
                    ]
                  }
                ]
              }
            });
            
            // Replace the achievements array with the filtered one
            inMemoryDb.user_achievements = achievementsToKeep;
          }
          
          return res.json(existingAchievement);
        }
        
        // Create new achievement record
        const newAchievement: Omit<UserAchievement, '_id'> = {
          user_udid: udid as string,
          achievement_id,
          unlocked_at: new Date().toISOString()
        };
        
        // Add to collection
        const result = inMemoryInsertOne("user_achievements", newAchievement);
        
        // Create response object with _id
        const responseAchievement: UserAchievement = {
          ...newAchievement,
          _id: result.insertedId
        };
        
        return res.status(201).json(responseAchievement);
      } else {
        const db = client!.db(process.env.MONGO_DB_NAME);
        
        // Check if user exists
        const user = await db.collection("users").findOne({ udid });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Check if achievement already exists
        const existingAchievement = await db.collection("user_achievements").findOne({ 
          user_udid: udid, 
          achievement_id 
        });
        
        if (existingAchievement) {
          // Achievement already unlocked
          // Create a new object with the _id as string
          const serializedAchievement = {
            ...existingAchievement,
            _id: existingAchievement._id ? existingAchievement._id.toString() : undefined
          };
          return res.json(serializedAchievement);
        }
        
        // Create new achievement record
        const newAchievement: Omit<UserAchievement, '_id'> = {
          user_udid: udid as string,
          achievement_id,
          unlocked_at: new Date().toISOString()
        };
        
        // Add to collection
        const result = await db.collection("user_achievements").insertOne(newAchievement);
        
        // Create response object with _id
        const responseAchievement: UserAchievement = {
          ...newAchievement,
          _id: result.insertedId.toString()
        };
        
        return res.status(201).json(responseAchievement);
      }
    } catch (error) {
      console.error(`Error saving achievement: ${error instanceof Error ? error.stack : error}`);
      return res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
  
  // If we get here, the method is not supported
  return res.status(405).json({ error: 'Method not allowed' });
} 