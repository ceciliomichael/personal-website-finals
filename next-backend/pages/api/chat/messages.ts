import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToMongoDB, inMemoryInsertOne, inMemoryFind, inMemoryCountDocuments, inMemoryDeleteOne } from '@/lib/mongodb';
import { ChatMessage } from '@/types';
import { ObjectId } from 'mongodb';

// Maximum number of chat messages to keep
const MAX_CHAT_MESSAGES = 20;

// Define a type for the response message that includes _id
interface ChatMessageResponse {
  _id?: string;
  user: any;
  message: any;
  udid: any;
  timestamp: Date | string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle GET request
  if (req.method === 'GET') {
    try {
      console.log("GET /api/chat/messages called");
      const { client, usingInMemoryDb } = await connectToMongoDB();
      
      if (usingInMemoryDb) {
        // Initialize with sample data if empty
        if (inMemoryCountDocuments("chat_messages") === 0) {
          inMemoryInsertOne("chat_messages", {
            id: "sample-1",
            user_udid: "system",
            user: "System",
            message: "Welcome to the chat! This is using an in-memory database.",
            timestamp: new Date().getTime()
          });
        }
        
        // Get messages from in-memory DB
        console.log(`In-memory DB has ${inMemoryCountDocuments("chat_messages")} messages`);
        
        // Sort messages by timestamp (newest first)
        const sortedMessages = inMemoryFind("chat_messages", {
          sortKey: "timestamp",
          sortDir: -1,
          limit: 100
        });
        
        // Reverse to get chronological order (oldest first)
        sortedMessages.reverse();
        
        return res.json(sortedMessages);
      } else {
        const db = client!.db(process.env.MONGO_DB_NAME);
        
        // Get from MongoDB
        const messages = await db.collection("chat_messages")
          .find({}, { projection: { _id: 0 } })
          .sort({ timestamp: -1 })
          .limit(100)
          .toArray();
        
        // Reverse to get chronological order
        messages.reverse();
        return res.json(messages);
      }
    } catch (error) {
      console.error(`Error getting chat messages: ${error instanceof Error ? error.stack : error}`);
      return res.status(500).json({ error: "Failed to fetch messages", details: error instanceof Error ? error.message : String(error) });
    }
  }
  
  // Handle POST request
  if (req.method === 'POST') {
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
      
      // Create new message without _id field (MongoDB will generate it)
      let newMessage = {
        user: data.user,
        message: data.message,
        udid: data.udid || '',
        timestamp: currentTime
      };
      console.log(`Created new message object: ${JSON.stringify(newMessage)}`);
      
      let responseMessage: ChatMessageResponse;
      
      const { client, usingInMemoryDb } = await connectToMongoDB();
      
      if (usingInMemoryDb) {
        // Insert new message
        console.log("Inserting message into in-memory storage");
        const messageForStorage = {
          ...newMessage,
          timestamp: currentTime.toISOString()  // Convert to string for in-memory storage
        };
        const result = inMemoryInsertOne("chat_messages", messageForStorage);
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
        responseMessage = {
          ...messageForStorage,
          _id: result.insertedId
        };
      } else if (client) {
        const db = client.db(process.env.MONGO_DB_NAME);
        
        // Insert new message
        console.log("Inserting message into MongoDB");
        const result = await db.collection("chat_messages").insertOne(newMessage);
        console.log(`Insert result: ${result.insertedId}`);
        
        // Get total count of messages
        console.log("Counting messages");
        const count = await db.collection("chat_messages").countDocuments({});
        console.log(`Total message count: ${count}`);
        
        // If we exceed our limit, delete the oldest messages
        if (count > MAX_CHAT_MESSAGES) {
          console.log(`Message count ${count} exceeds limit ${MAX_CHAT_MESSAGES}, deleting oldest messages`);
          // Find the oldest messages to delete
          const oldestMessages = await db.collection("chat_messages").find()
            .sort({ timestamp: 1 })
            .limit(count - MAX_CHAT_MESSAGES)
            .toArray();
          
          // Delete them
          for (const msg of oldestMessages) {
            console.log(`Deleting old message: ${msg._id}`);
            await db.collection("chat_messages").deleteOne({ _id: msg._id });
          }
        }
        
        // Create a copy of the message for the response
        responseMessage = { ...newMessage };
        
        // Convert the ObjectId to string if it exists (MongoDB adds this)
        if (result.insertedId) {
          responseMessage._id = result.insertedId.toString();
        }
        
        // Convert the timestamp to ISO format for JSON serialization
        if (responseMessage.timestamp instanceof Date) {
          responseMessage.timestamp = responseMessage.timestamp.toISOString();
        }
      } else {
        return res.status(500).json({ error: "Failed to connect to database" });
      }
      
      console.log("Returning success response");
      return res.status(201).json(responseMessage);
    } catch (error) {
      console.error(`Error adding chat message: ${error}`);
      console.error(`Stack trace: ${error instanceof Error ? error.stack : ''}`);
      return res.status(500).json({ error: `Server error: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
  
  // If we get here, the method is not supported
  return res.status(405).json({ error: 'Method not allowed' });
} 