import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToMongoDB, inMemoryUpdateOne, inMemoryFind } from '@/lib/mongodb';
import { ActiveUser } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle GET request
  if (req.method === 'GET') {
    try {
      const { client, usingInMemoryDb } = await connectToMongoDB();
      
      if (usingInMemoryDb) {
        // In memory, manually filter expired users (older than 5 minutes)
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeUsers: { udid: string; name: string }[] = [];
        
        const users = inMemoryFind("active_users");
        
        for (const user of users) {
          if (user.last_active) {
            const lastActive = new Date(user.last_active);
            if (lastActive > fiveMinAgo) {
              activeUsers.push({ udid: user.udid, name: user.name });
            }
          }
        }
        
        return res.json(activeUsers);
      } else {
        const db = client!.db(process.env.MONGO_DB_NAME);
        
        // Get all active users
        const activeUsers = await db.collection("active_users")
          .find({}, { projection: { _id: 0, udid: 1, name: 1 } })
          .toArray();
          
        return res.json(activeUsers);
      }
    } catch (error) {
      console.error(`Error getting active users: ${error}`);
      return res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
  
  // Handle POST request
  if (req.method === 'POST') {
    try {
      const { udid, name } = req.body;
      
      if (!udid || !name) {
        return res.status(400).json({ error: "UDID and name are required" });
      }
      
      const currentTime = new Date();
      
      const { client, usingInMemoryDb } = await connectToMongoDB();
      
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
        const db = client!.db(process.env.MONGO_DB_NAME);
        
        // Update or insert active user
        await db.collection("active_users").updateOne(
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
      return res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
  
  // If we get here, the method is not supported
  return res.status(405).json({ error: 'Method not allowed' });
} 