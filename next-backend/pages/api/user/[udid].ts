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
      
      // Create a new object with the _id as string for JSON serialization
      const serializedUser = {
        ...user,
        _id: user._id ? user._id.toString() : undefined
      };
      
      return res.json(serializedUser);
    } catch (error) {
      console.error(`Error getting user: ${error}`);
      return res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
  
  // ... existing code ...
}