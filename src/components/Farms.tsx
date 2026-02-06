"use client";

import { useState, useEffect } from 'react';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Farm {
  id: number;
  name: string;
}

function Farms() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const data = await apiService.getFarms(user?.role);
        setFarms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [user?.role]);

  if (loading) return <div>Loading farms...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Farms</h1>
      <ul>
        {farms.map(farm => (
          <li key={farm.id}>{farm.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Farms;