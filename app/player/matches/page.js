'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/authContext'
import PlayerNav from '@/components/PlayerNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, Filter } from 'lucide-react'

export default function MatchHistoryPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [filteredMatches, setFilteredMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      fetchMatches()
    }
  }, [user])

  useEffect(() => {
    filterMatches()
  }, [matches, filter, searchQuery])

  const fetchMatches = async () => {
    try {
      const response = await fetch(`/api/matches?uid=${user.uid}`)
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMatches = () => {
    let filtered = [...matches]

    if (filter !== 'all') {
      filtered = filtered.filter(m => m.format === filter)
    }

    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredMatches(filtered)
  }

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
      
      <main className="md:ml-64 mt-16 p-6 pb-20 md:pb-6">
        <h1 className="text-3xl font-poppins font-bold text-gray-900 mb-6">Match History</h1>
        
        {/* Filter Bar */}
        <Card className="shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search matches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="T20">T20</SelectItem>
                  <SelectItem value="ODI">ODI</SelectItem>
                  <SelectItem value="Test">Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Match Cards Grid */}
        {filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
              <Card key={match.id} className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      match.format === 'T20' ? 'bg-red-100 text-red-700' :
                      match.format === 'ODI' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {match.format}
                    </span>
                  </div>
                  <CardTitle className="text-gray-500 text-sm mt-2">
                    {new Date(match.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{match.location}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Runs/Balls</span>
                      <span className="text-lg font-bold text-blue-600">
                        {match.batting?.runs || 0}/{match.batting?.balls || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Strike Rate</span>
                      <span className="text-lg font-bold text-green-600">
                        {match.batting?.strikeRate || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Wickets</span>
                      <span className="text-lg font-bold text-orange-600">
                        {match.bowling?.wickets || 0}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-blue-600 group-hover:underline">View Details →</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <div className="text-gray-400 mb-4">
                <Filter className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Matches Found</h3>
              <p className="text-gray-600">Try adjusting your filters or add new matches</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}