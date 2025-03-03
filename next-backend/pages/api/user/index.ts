import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { connectToMongoDB, inMemoryFindOne, inMemoryInsertOne } from '@/lib/mongodb';
import { User } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { name: userName } = req.body;
    
    if (!userName) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    const { client, usingInMemoryDb } = await connectToMongoDB();
    
    if (usingInMemoryDb) {
      // Check if user already exists
      const existingUser = inMemoryFindOne("users", { name: userName });
      
      if (existingUser) {
        // Return error if name already exists
        return res.status(409).json({ error: "Username already taken. Please choose a different name." });
      }
      
      // Create new user with UDID
      const newUser: User = {
        name: userName,
        udid: uuidv4(),
        created_at: new Date().toISOString()
      };
      
      const result = inMemoryInsertOne("users", newUser);
      newUser._id = result.insertedId;
      
      return res.status(201).json(newUser);
    } else {
      const db = client!.db(process.env.MONGO_DB_NAME);
      const usersCollection = db.collection("users");
      
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ name: userName });
      
      if (existingUser) {
        // Return error if name already exists
        return res.status(409).json({ error: "Username already taken. Please choose a different name." });
      }
      
      // Create new user with UDID
      const newUser: User = {
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
    return res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
  }
} 