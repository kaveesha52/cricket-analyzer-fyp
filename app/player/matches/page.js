'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/authContext'
import { SidebarNav } from '@/components/SidebarNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, Filter } from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function MatchHistoryPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [filteredMatches, setFilteredMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    format: 'all',
    ground: '',
    minRuns: '',
    maxRuns: '',
    dismissal: 'all',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    if (user) {
      fetchMatches()
      return
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    filterMatches()
  }, [matches, filters])

  const fetchMatches = async () => {
    try {
      const matchesQuery = query(
        collection(db, 'matches'),
        where('uid', '==', user.uid)
      )
      const snapshot = await getDocs(matchesQuery)
      const userMatches = []

      snapshot.forEach((docSnap) => {
        userMatches.push({ id: docSnap.id, ...docSnap.data() })
      })

      userMatches.sort((a, b) => new Date(b.date) - new Date(a.date))
      setMatches(userMatches)
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMatches = () => {
    let filtered = [...matches]

    // Format filter
    if (filters.format !== 'all') {
      filtered = filtered.filter(m => m.format === filters.format)
    }

    // Ground/Location filter
    if (filters.ground) {
      filtered = filtered.filter(m => 
        m.location.toLowerCase().includes(filters.ground.toLowerCase())
      )
    }

    // Runs filter
    if (filters.minRuns) {
      filtered = filtered.filter(m => (m.batting?.runs || 0) >= parseInt(filters.minRuns))
    }
    if (filters.maxRuns) {
      filtered = filtered.filter(m => (m.batting?.runs || 0) <= parseInt(filters.maxRuns))
    }

    // Dismissal type filter
    if (filters.dismissal !== 'all' && filters.dismissal) {
      filtered = filtered.filter(m => 
        m.batting?.dismissal?.toLowerCase() === filters.dismissal.toLowerCase()
      )
    }

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(m => new Date(m.date) >= new Date(filters.startDate))
    }
    if (filters.endDate) {
      filtered = filtered.filter(m => new Date(m.date) <= new Date(filters.endDate))
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
    <div className="flex h-screen bg-gray-50">
      <SidebarNav activePage="Matches" />
      
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Match History</h1>
          <p className="text-gray-600 text-sm">Review all your recorded matches and stats 🏏</p>
        </div>
        
        {/* Filter Bar */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
          <div>
            <div className="space-y-4">
              {/* Row 1: Format and Ground */}
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={filters.format} onValueChange={(value) => setFilters({...filters, format: value})}>
                  <SelectTrigger className="w-full md:w-48 h-12 border-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="All Formats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    <SelectItem value="T20">T20</SelectItem>
                    <SelectItem value="ODI">ODI</SelectItem>
                    <SelectItem value="Test">Test</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1">
                  <div className="relative">
                    <Input
                      placeholder="Search by ground..."
                      value={filters.ground}
                      onChange={(e) => setFilters({...filters, ground: e.target.value})}
                      className="pl-4 h-12 border-2 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Dismissal Type */}
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={filters.dismissal} onValueChange={(value) => setFilters({...filters, dismissal: value})}>
                  <SelectTrigger className="w-full md:w-48 h-12 border-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="All Dismissals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dismissals</SelectItem>
                    <SelectItem value="Bowled">Bowled</SelectItem>
                    <SelectItem value="LBW">LBW</SelectItem>
                    <SelectItem value="Caught">Caught</SelectItem>
                    <SelectItem value="Stumped">Stumped</SelectItem>
                    <SelectItem value="Run Out">Run Out</SelectItem>
                    <SelectItem value="Not Out">Not Out</SelectItem>
                    <SelectItem value="Retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 3: Runs Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Min runs"
                    value={filters.minRuns}
                    onChange={(e) => setFilters({...filters, minRuns: e.target.value})}
                    className="h-12 border-2 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Max runs"
                    value={filters.maxRuns}
                    onChange={(e) => setFilters({...filters, maxRuns: e.target.value})}
                    className="h-12 border-2 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Row 4: Date Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="h-12 border-2 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="h-12 border-2 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Button 
                  onClick={() => setFilters({format: 'all', ground: '', minRuns: '', maxRuns: '', dismissal: 'all', startDate: '', endDate: ''})}
                  variant="outline"
                  className="h-12 border-2"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Match Cards Grid */}
        {filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
              <div key={match.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full text-white ${
                        match.format === 'T20' ? 'bg-red-500' :
                        match.format === 'ODI' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}>
                        {match.format}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">vs {match.opponent || 'Unknown Team'}</p>
                    <p className="text-xs text-gray-500">{match.location}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-xs text-gray-500 mb-3">{new Date(match.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Runs</span>
                      <span className="text-lg font-bold text-gray-900">{match.batting?.runs || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Strike Rate</span>
                      <span className="text-lg font-bold text-gray-900">{match.batting?.strikeRate || '0.00'}</span>
                    </div>
                    {match.batting?.dismissal && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Dismissal</span>
                        <span className="text-sm font-semibold text-gray-900">{match.batting.dismissal}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-blue-600 text-sm font-medium hover:underline">
                  View Details →
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Matches Found</h3>
            <p className="text-gray-600 text-sm">Try adjusting your filters or add new matches</p>
          </div>
        )}
      </main>
    </div>
  )
}