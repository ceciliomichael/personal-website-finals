import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToMongoDB, inMemoryInsertOne } from '@/lib/mongodb';
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
    const data = req.body;
    
    if (!data.name || !data.email || !data.message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }
    
    const currentTime = new Date();
    
    const feedback: Feedback = {
      name: data.name,
      email: data.email,
      message: data.message,
      rating: data.rating || 0,
      udid: data.udid,
      created_at: currentTime
    };
    
    const { client, usingInMemoryDb } = await connectToMongoDB();
    
    if (usingInMemoryDb) {
      // Convert datetime to string for in-memory storage
      feedback.created_at = currentTime.toISOString();
      inMemoryInsertOne("feedback", feedback);
    } else {
      const db = client!.db(process.env.MONGO_DB_NAME);
      await db.collection("feedback").insertOne(feedback);
    }
    
    return res.status(201).json({ status: "success" });
  } catch (error) {
    console.error(`Error submitting feedback: ${error}`);
    return res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
  }
} 