import { MongoClient, ServerApiVersion } from 'mongodb';

// Connection URI
const uri = process.env.MONGO_URI || '';
const dbName = process.env.MONGO_DB_NAME || 'portfolio_db';

// Connection options
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 5000, // 5 seconds timeout
  connectTimeoutMS: 5000
};

// In-memory database fallback (will be used if MongoDB connection fails)
export const inMemoryDb: {
  users: any[];
  active_users: any[];
  chat_messages: any[];
  user_achievements: any[];
  feedback: any[];
} = {
  users: [],
  active_users: [],
  chat_messages: [],
  user_achievements: [],
  feedback: []
};

// Flag to track if we're using in-memory DB
let usingInMemoryDb = false;

// Client variable to reuse connection
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient | null>;

// Function to connect to MongoDB
async function connectToMongoDB(): Promise<{ client: MongoClient | null; usingInMemoryDb: boolean }> {
  try {
    console.log(`Attempting to connect to MongoDB at ${uri}...`);
    
    if (!client) {
      client = new MongoClient(uri, options);
      await client.connect();
      // Ping to confirm connection
      await client.db("admin").command({ ping: 1 });
      console.log(`Successfully connected to MongoDB at ${uri}!`);
    }
    
    return { client, usingInMemoryDb: false };
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error}`);
    console.log("USING IN-MEMORY DATABASE FALLBACK");
    return { client: null, usingInMemoryDb: true };
  }
}

// Create a cached connection promise if not in test environment
if (process.env.NODE_ENV !== 'test') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectToMongoDB().then(({ client }) => client);
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In test environment, create a new client for each test
  clientPromise = connectToMongoDB().then(({ client }) => client);
}

// Export the client promise and in-memory DB flag
export { clientPromise, connectToMongoDB };
export const getUsingInMemoryDb = async (): Promise<boolean> => {
  const { usingInMemoryDb } = await connectToMongoDB();
  return usingInMemoryDb;
};

// Helper functions for in-memory DB operations
export const inMemoryFindOne = (collection: string, query: any = {}): any => {
  if (!inMemoryDb[collection as keyof typeof inMemoryDb]) {
    console.error(`Collection ${collection} not found in in-memory DB`);
    return null;
  }
  
  const items = inMemoryDb[collection as keyof typeof inMemoryDb];
  
  // Simple query matching
  for (const item of items) {
    let match = true;
    for (const key in query) {
      if (item[key] !== query[key]) {
        match = false;
        break;
      }
    }
    if (match) {
      return { ...item }; // Return a copy
    }
  }
  
  return null;
};

export const inMemoryInsertOne = (collection: string, document: any): { insertedId: string } => {
  if (!inMemoryDb[collection as keyof typeof inMemoryDb]) {
    console.error(`Collection ${collection} not found in in-memory DB`);
    return { insertedId: '' };
  }
  
  // Generate a random ID if not provided
  if (!document._id) {
    document._id = Math.random().toString(36).substring(2, 15);
  }
  
  // Add to collection
  inMemoryDb[collection as keyof typeof inMemoryDb].push({ ...document });
  
  return { insertedId: document._id };
};

export const inMemoryFind = (collection: string, options: any = {}): any[] => {
  if (!inMemoryDb[collection as keyof typeof inMemoryDb]) {
    console.error(`Collection ${collection} not found in in-memory DB`);
    return [];
  }
  
  let results = [...inMemoryDb[collection as keyof typeof inMemoryDb]];
  
  // Apply query filter if provided
  if (options.query) {
    results = results.filter(item => {
      for (const key in options.query) {
        if (item[key] !== options.query[key]) {
          return false;
        }
      }
      return true;
    });
  }
  
  // Apply sorting if provided
  if (options.sortKey) {
    results.sort((a, b) => {
      const aValue = a[options.sortKey];
      const bValue = b[options.sortKey];
      
      if (aValue < bValue) return options.sortDir === 1 ? -1 : 1;
      if (aValue > bValue) return options.sortDir === 1 ? 1 : -1;
      return 0;
    });
  }
  
  // Apply limit if provided
  if (options.limit && options.limit > 0) {
    results = results.slice(0, options.limit);
  }
  
  return results;
};

export const inMemoryUpdateOne = (
  collection: string, 
  query: any, 
  update: any, 
  options: { upsert: boolean } = { upsert: false }
): { matchedCount: number; modifiedCount: number; upsertedId: string | null } => {
  if (!inMemoryDb[collection as keyof typeof inMemoryDb]) {
    console.error(`Collection ${collection} not found in in-memory DB`);
    return { matchedCount: 0, modifiedCount: 0, upsertedId: null };
  }
  
  const items = inMemoryDb[collection as keyof typeof inMemoryDb];
  let matchIndex = -1;
  
  // Find matching item
  for (let i = 0; i < items.length; i++) {
    let match = true;
    for (const key in query) {
      if (items[i][key] !== query[key]) {
        match = false;
        break;
      }
    }
    if (match) {
      matchIndex = i;
      break;
    }
  }
  
  // If no match found and upsert is true, insert new document
  if (matchIndex === -1 && options.upsert) {
    const newDoc = { ...query };
    
    // Apply $set updates
    if (update.$set) {
      Object.assign(newDoc, update.$set);
    }
    
    // Generate ID if not present
    if (!newDoc._id) {
      newDoc._id = Math.random().toString(36).substring(2, 15);
    }
    
    items.push(newDoc);
    return { matchedCount: 0, modifiedCount: 0, upsertedId: newDoc._id };
  }
  
  // If no match found and upsert is false, return no match
  if (matchIndex === -1) {
    return { matchedCount: 0, modifiedCount: 0, upsertedId: null };
  }
  
  // Apply updates to matched document
  if (update.$set) {
    for (const key in update.$set) {
      items[matchIndex][key] = update.$set[key];
    }
  }
  
  return { matchedCount: 1, modifiedCount: 1, upsertedId: null };
};

export const inMemoryCountDocuments = (collection: string, query: any = {}): number => {
  return inMemoryFind(collection, { query }).length;
};

export const inMemoryDeleteOne = (collection: string, query: any = {}): { deletedCount: number } => {
  if (!inMemoryDb[collection as keyof typeof inMemoryDb]) {
    console.error(`Collection ${collection} not found in in-memory DB`);
    return { deletedCount: 0 };
  }
  
  const items = inMemoryDb[collection as keyof typeof inMemoryDb];
  let matchIndex = -1;
  
  // Find matching item
  for (let i = 0; i < items.length; i++) {
    let match = true;
    for (const key in query) {
      if (items[i][key] !== query[key]) {
        match = false;
        break;
      }
    }
    if (match) {
      matchIndex = i;
      break;
    }
  }
  
  // If no match found, return no deletion
  if (matchIndex === -1) {
    return { deletedCount: 0 };
  }
  
  // Remove the matched item
  items.splice(matchIndex, 1);
  return { deletedCount: 1 };
};

export const inMemoryDeleteMany = (collection: string, query: any = {}): { deletedCount: number } => {
  if (!inMemoryDb[collection as keyof typeof inMemoryDb]) {
    console.error(`Collection ${collection} not found in in-memory DB`);
    return { deletedCount: 0 };
  }
  
  const items = inMemoryDb[collection as keyof typeof inMemoryDb];
  const initialCount = items.length;
  
  // Filter out matching items
  const newItems = items.filter(item => {
    for (const key in query) {
      if (item[key] !== query[key]) {
        return true; // Keep items that don't match
      }
    }
    return false; // Remove items that match
  });
  
  // Update the collection with filtered items
  inMemoryDb[collection as keyof typeof inMemoryDb] = newItems;
  
  return { deletedCount: initialCount - newItems.length };
};

export const inMemoryCreateIndex = (collection: string, field: string, options: any = {}): void => {
  // This is a no-op for in-memory DB, just for API compatibility
  console.log(`Creating index on ${collection}.${field} (in-memory, no actual indexing)`);
}; 