'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/authContext'
import PlayerNav from '@/components/PlayerNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Star, Award, Users as UsersIcon } from 'lucide-react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'

export default function CommunityPage() {
  const { user } = useAuth()
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      fetchCoaches()
    }
  }, [user])

  const fetchCoaches = async () => {
    try {
      // Fetch real coaches from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'coach'));
      const snapshot = await getDocs(q);
      
      const coachList = [];
      snapshot.forEach(doc => {
        coachList.push({ id: doc.id, ...doc.data() });
      });
      
      setCoaches(coachList);
    } catch (error) {
      console.error('Error fetching coaches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (coachId, coachName) => {
    try {
      const res = await fetch('/api/coach/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentUid: user.uid,
          coachUid: coachId,
          message: 'I would like to connect with you as my coach.'
        })
      })
      
      if (res.ok) {
        toast.success('Connection Request Sent!', {
          description: `Your request has been sent to ${coachName}. They will review it soon.`,
          duration: 4000,
        })
      } else {
        toast.error('Failed to send request', {
          description: 'Please try again later.',
        })
      }
    } catch (error) {
      console.error('Error sending connection:', error)
      toast.error('Connection failed', {
        description: 'Something went wrong. Please try again.',
      })
    }
  }

  const filteredCoaches = coaches.filter(coach => 
    coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coach.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PlayerNav />
      
      <main className="md:ml-64 mt-16 p-6 pb-20 md:pb-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-poppins font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">Find Your Coach</h1>
            <p className="text-gray-600 text-lg">Connect with experienced cricket coaches to improve your game</p>
          </div>
          
          {/* Search Bar */}
          <Card className="shadow-xl border-0 mb-8 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search coaches by name or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Coach Cards Grid */}
          {filteredCoaches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoaches.map((coach) => (
                <Card key={coach.id} className="shadow-xl border-0 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <CardContent className="pt-6 -mt-12">
                    <div className="text-center mb-4">
                      <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-lg">
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-400 text-white text-2xl font-bold">
                          {coach.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{coach.name}</h3>
                      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-3">
                        {coach.specialization || 'Cricket Coach'}
                      </div>
                      
                      <div className="flex items-center justify-center space-x-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-2 font-medium">(4.8)</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center">
                          <Award className="w-4 h-4 mr-2 text-blue-500" />
                          Experience
                        </span>
                        <span className="font-semibold text-gray-900">8+ years</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center">
                          <UsersIcon className="w-4 h-4 mr-2 text-green-500" />
                          Students
                        </span>
                        <span className="font-semibold text-gray-900">25+ active</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105" 
                      onClick={() => handleConnect(coach.id, coach.name)}
                    >
                      Connect with Coach
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-lg">
              <CardContent className="py-16 text-center">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Coaches Found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
