import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToMongoDB, inMemoryFindOne, inMemoryDeleteOne, inMemoryFind, inMemoryDeleteMany } from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the user UDID from the URL
  const { udid } = req.query;
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Handle GET request
  if (req.method === 'GET') {
    try {
      const { client, usingInMemoryDb } = await connectToMongoDB();
      
      let user;
      if (usingInMemoryDb) {
        user = inMemoryFindOne("users", { udid });
      } else {
        const db = client!.db(process.env.MONGO_DB_NAME);
        const usersCollection = db.collection("users");
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
      return res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
  
  // Handle DELETE request
  if (req.method === 'DELETE') {
    try {
      const { client, usingInMemoryDb } = await connectToMongoDB();
      
      // Check if user exists
      let user;
      if (usingInMemoryDb) {
        user = inMemoryFindOne("users", { udid });
      } else {
        const db = client!.db(process.env.MONGO_DB_NAME);
        const usersCollection = db.collection("users");
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
        const db = client!.db(process.env.MONGO_DB_NAME);
        
        // Delete user
        await db.collection("users").deleteOne({ udid });
        
        // Delete user's achievements
        await db.collection("user_achievements").deleteMany({ user_udid: udid });
        
        // Delete user from active users
        await db.collection("active_users").deleteOne({ udid });
        
        // Note: We're not deleting chat messages as they should remain for other users
      }
      
      return res.status(200).json({ status: "success", message: "User account deleted successfully" });
    } catch (error) {
      console.error(`Error deleting user: ${error}`);
      return res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
  
  // If we get here, the method is not supported
  return res.status(405).json({ error: 'Method not allowed' });
} 