import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setHealth(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }

    checkHealth();
  }, []);

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '800px', 
      margin: '0 auto', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      <Head>
        <title>Personal Website Backend</title>
        <meta name="description" content="Next.js backend for personal website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '1rem',
          color: '#333'
        }}>
          Personal Website Backend
        </h1>
        
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
          This is the Next.js backend API for the personal website. The API endpoints are available at <code>/api/*</code>.
        </p>

        <div style={{ 
          background: '#f5f5f5', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginTop: 0 }}>API Health Status</h2>
          
          {loading && <p>Loading health status...</p>}
          
          {error && (
            <div style={{ color: 'red', marginBottom: '1rem' }}>
              <p>Error: {error}</p>
            </div>
          )}
          
          {health && (
            <div>
              <p><strong>Status:</strong> {health.status}</p>
              <p><strong>Environment:</strong> {health.environment}</p>
              <p><strong>Timestamp:</strong> {health.timestamp}</p>
              <p><strong>Database:</strong> {health.mongodb ? 'MongoDB' : 'In-Memory Database'}</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Available Endpoints</h2>
          <ul style={{ lineHeight: '1.6' }}>
            <li><code>/api/health</code> - Check API health status</li>
            <li><code>/api/test-db</code> - Test database connection</li>
            <li><code>/api/user</code> - Create a new user</li>
            <li><code>/api/user/:udid</code> - Get or delete a user by UDID</li>
            <li><code>/api/user/:udid/achievements</code> - Get or save user achievements</li>
            <li><code>/api/users/active</code> - Get or update active users</li>
            <li><code>/api/chat/messages</code> - Get or add chat messages</li>
            <li><code>/api/feedback</code> - Submit feedback</li>
          </ul>
        </div>
      </main>
    </div>
  );
} 