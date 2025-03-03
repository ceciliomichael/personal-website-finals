import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToMongoDB, inMemoryDb } from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { client, usingInMemoryDb } = await connectToMongoDB();
    
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
    } else if (client) {
      // Test MongoDB connection
      const db = client.db(process.env.MONGO_DB_NAME);
      const result = await db.command({ ping: 1 });
      
      // Get collections stats
      const collections = {
        users: await db.collection("users").countDocuments({}),
        active_users: await db.collection("active_users").countDocuments({}),
        chat_messages: await db.collection("chat_messages").countDocuments({}),
        user_achievements: await db.collection("user_achievements").countDocuments({})
      };
      
      return res.status(200).json({
        status: "success",
        message: "MongoDB connection is working",
        ping_result: result,
        collections
      });
    } else {
      // This should not happen, but handle it just in case
      return res.status(500).json({
        status: "error",
        message: "Failed to connect to database and in-memory fallback not initialized"
      });
    }
  } catch (error) {
    console.error(`Database error: ${error}`);
    console.error(`Stack trace: ${error instanceof Error ? error.stack : ''}`);
    
    return res.status(500).json({
      status: "error",
      message: `Database error: ${error instanceof Error ? error.message : String(error)}`,
      traceback: error instanceof Error ? error.stack : ''
    });
  }
} 