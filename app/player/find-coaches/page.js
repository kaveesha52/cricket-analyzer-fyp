'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import PlayerNav from '@/components/PlayerNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function FindCoaches() {
  const { user } = useAuth();
  const router = useRouter();
  const [coaches, setCoaches] = useState([]);
  const [filteredCoaches, setFilteredCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestingCoaches, setRequestingCoaches] = useState({});
  const [connectionStates, setConnectionStates] = useState({});

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    fetchCoaches();
  }, [user]);

  // Set up real-time listener for connection status
  useEffect(() => {
    if (!user) return;

    const connectionsRef = collection(db, 'connections');
    const q = query(connectionsRef, where('studentUid', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const statuses = {};
      
      snapshot.forEach(doc => {
        const connection = doc.data();
        statuses[connection.coachUid] = connection.status;
      });
      
      setConnectionStates(statuses);
    }, (error) => {
      console.error('Error setting up listener:', error);
    });

    return () => unsubscribe();
  }, [user]);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coaches`);
      const data = await response.json();
      
      if (data.coaches) {
        setCoaches(data.coaches);
        setFilteredCoaches(data.coaches);
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (coachUid) => {
    if (!user) return;

    try {
      setRequestingCoaches(prev => ({ ...prev, [coachUid]: true }));

      const response = await fetch('/api/coach/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid
        },
        body: JSON.stringify({
          studentUid: user.uid,
          coachUid: coachUid,
          message: `I would like to connect with you as my coach.`
        })
      });

      if (response.ok) {
        // Update connection state
        setConnectionStates(prev => ({
          ...prev,
          [coachUid]: 'pending'
        }));
      }
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setRequestingCoaches(prev => ({ ...prev, [coachUid]: false }));
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredCoaches(coaches);
    } else {
      const filtered = coaches.filter(coach =>
        coach.name.toLowerCase().includes(term.toLowerCase()) ||
        coach.email.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredCoaches(filtered);
    }
  };

  const getButtonState = (coachUid) => {
    const status = connectionStates[coachUid];
    if (status === 'pending') return 'pending';
    if (status === 'accepted') return 'connected';
    return 'available';
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <PlayerNav />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8 md:ml-64 mt-16">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Find Your Coach</h1>
            <p className="text-gray-600">Browse and connect with experienced cricket coaches</p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <Input
              placeholder="Search coaches by name or email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Coaches Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCoaches.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  {searchTerm ? 'No coaches found matching your search.' : 'No coaches available.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCoaches.map(coach => {
                const buttonState = getButtonState(coach.uid);
                const isRequesting = requestingCoaches[coach.uid];

                return (
                  <Card key={coach.uid} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{coach.name}</span>
                        <span className="text-sm font-normal text-gray-500 bg-blue-50 px-2 py-1 rounded">
                          Coach
                        </span>
                      </CardTitle>
                      <CardDescription>{coach.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          {coach.profileCompleted
                            ? 'Profile verified ✓'
                            : 'Setting up profile'}
                        </p>

                        {buttonState === 'available' && (
                          <Button
                            onClick={() => handleSendRequest(coach.uid)}
                            disabled={isRequesting}
                            className="w-full"
                          >
                            {isRequesting ? 'Sending...' : 'Send Request'}
                          </Button>
                        )}

                        {buttonState === 'pending' && (
                          <Button disabled className="w-full bg-yellow-100 text-yellow-800">
                            Request Pending
                          </Button>
                        )}

                        {buttonState === 'connected' && (
                          <Button disabled className="w-full bg-green-100 text-green-800">
                            Connected
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
