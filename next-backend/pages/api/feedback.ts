import { connectToMongoDB, inMemoryInsertOne } from '@/lib/mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Feedback } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { name, email, message, rating, udid } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    
    const currentTime = new Date();
    
    // Create feedback object without _id
    const feedback: Omit<Feedback, '_id'> = {
      name,
      email,
      message,
      rating: rating || 0,
      udid: udid || '',
      created_at: currentTime
    };
    
    const { client, usingInMemoryDb } = await connectToMongoDB();
    
    if (usingInMemoryDb) {
      // Convert datetime to string for in-memory storage
      const feedbackForStorage = {
        ...feedback,
        created_at: currentTime.toISOString()
      };
      inMemoryInsertOne("feedback", feedbackForStorage);
    } else if (client) {
      const db = client.db(process.env.MONGO_DB_NAME);
      await db.collection("feedback").insertOne(feedback);
    } else {
      return res.status(500).json({ error: "Failed to connect to database" });
    }
    
    return res.status(201).json({ status: "success" });
  } catch (error) {
    console.error(`Error submitting feedback: ${error}`);
    return res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
  }
} 