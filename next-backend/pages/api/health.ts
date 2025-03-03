import type { NextApiRequest, NextApiResponse } from 'next';
import { getUsingInMemoryDb } from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check if we're using in-memory DB
    const usingInMemoryDb = await getUsingInMemoryDb();
    
    res.status(200).json({
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      inMemoryDb: usingInMemoryDb,
      mongodb: !usingInMemoryDb
    });
  } catch (error) {
    console.error(`Health check error: ${error}`);
    res.status(500).json({ 
      status: 'error',
      error: `Server error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
} 