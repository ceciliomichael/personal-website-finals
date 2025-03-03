// MongoDB related types
export interface MongoDBDocument {
  _id?: string;
}

// User related types
export interface User extends MongoDBDocument {
  name: string;
  udid: string;
  created_at: Date | string;
}

export interface ActiveUser extends MongoDBDocument {
  udid: string;
  name: string;
  last_active: Date | string;
}

// Chat related types
export interface ChatMessage extends MongoDBDocument {
  user: string;
  message: string;
  udid?: string;
  timestamp: Date | string;
}

// Achievement related types
export interface UserAchievement extends MongoDBDocument {
  user_udid: string;
  achievement_id: string;
  unlocked_at: Date | string;
}

// Feedback related types
export interface Feedback extends MongoDBDocument {
  name: string;
  email: string;
  message: string;
  rating?: number;
  udid?: string;
  created_at: Date | string;
}

// API response types
export interface ApiResponse<T> {
  status?: string;
  message?: string;
  error?: string;
  data?: T;
}

// Global augmentation for MongoDB client
declare global {
  var _mongoClientPromise: Promise<any>;
} 