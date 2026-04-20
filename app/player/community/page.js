'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { Bell, Send, Heart, MessageCircle, Share2, CheckCircle, MapPin, Briefcase, Star } from 'lucide-react'
import { SidebarNav } from '@/components/SidebarNav'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [coaches, setCoaches] = useState([])
  const [filteredCoaches, setFilteredCoaches] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showConnectedOnly, setShowConnectedOnly] = useState(false)
  const [connectedCoaches, setConnectedCoaches] = useState(new Set())

  // Fetch coaches on mount
  useEffect(() => {
    if (!user?.uid) return
    fetchCoaches()
    setupConnectionsListener()
  }, [user])

  // Set up real-time listener for connected coaches
  const setupConnectionsListener = () => {
    try {
      const connectionsRef = collection(db, 'connections')
      const q = query(connectionsRef, where('studentUid', '==', user.uid), where('status', '==', 'accepted'))
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const connected = new Set()
        snapshot.forEach(doc => {
          connected.add(doc.data().coachUid)
        })
        setConnectedCoaches(connected)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error setting up connections listener:', error)
    }
  }

  // Filter coaches when search query or filter changes
  useEffect(() => {
    let filtered = coaches

    // Apply connected filter
    if (showConnectedOnly) {
      filtered = filtered.filter(coach => connectedCoaches.has(coach.uid))
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(coach =>
        coach.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (coach.specializations && coach.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    }

    setFilteredCoaches(filtered)
  }, [searchQuery, coaches, showConnectedOnly, connectedCoaches])

  const fetchCoaches = async () => {
    try {
      const response = await fetch(`/api/coaches?uid=${user.uid}`)
      const data = await response.json()
      setCoaches(data.coaches || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching coaches:', error)
      setIsLoading(false)
    }
  }

  const handleConnect = async (coachUid, coachName) => {
    setConnecting(coachUid)
    try {
      const response = await fetch('/api/coach/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachUid,
          studentUid: user.uid
        })
      })

      if (response.ok) {
        alert(`Connection request sent to ${coachName}!`)
        // Refresh coaches list
        fetchCoaches()
      } else {
        alert('Failed to send connection request. Please try again.')
      }
    } catch (error) {
      console.error('Error connecting with coach:', error)
      alert('Error sending connection request.')
    } finally {
      setConnecting(null)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarNav activePage="Community" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading coaches...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <SidebarNav activePage="Community" />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Find a Coach</h1>
            <p className="text-sm text-gray-600">Connect with experienced cricket coaches</p>
          </div>
          <Bell className="w-5 h-5 text-gray-600" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {/* Search Bar and Filter */}
            <div className="mb-8 space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search coaches by name or specialization..."
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setShowConnectedOnly(!showConnectedOnly)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                    showConnectedOnly
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {showConnectedOnly ? 'Connected Only' : 'All Coaches'}
                </button>
              </div>
              {showConnectedOnly && connectedCoaches.size > 0 && (
                <p className="text-sm text-gray-600">
                  Showing {filteredCoaches.length} of {connectedCoaches.size} connected {connectedCoaches.size === 1 ? 'coach' : 'coaches'}
                </p>
              )}
            </div>

            {/* Coaches Grid */}
            {filteredCoaches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCoaches.map((coach) => (
                  <div
                    key={coach.uid}
                    onClick={() => router.push(`/player/coaches/${coach.uid}`)}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
                  >
                    {/* Coach Header Background */}
                    <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600"></div>

                    {/* Coach Info */}
                    <div className="p-6">
                      {/* Avatar */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white -mt-12">
                          {coach.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{coach.name || 'Coach'}</h3>
                          <p className="text-sm text-gray-600">{coach.email}</p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-yellow-400">★</span>
                        ))}
                        <span className="text-sm text-gray-600 ml-2">(4.8)</span>
                      </div>

                      {/* Bio */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{coach.bio || 'Experienced cricket coach'}</p>

                      {/* Specializations Preview */}
                      {coach.specializations && coach.specializations.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {coach.specializations.slice(0, 2).map((spec, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {spec}
                              </span>
                            ))}
                            {coach.specializations.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                +{coach.specializations.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CTA */}
                      <div className="px-4 py-2 bg-blue-50 rounded-lg text-center">
                        <p className="text-sm text-blue-700 font-medium">Click to view profile</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Coaches Found</h3>
                <p className="text-gray-600">{searchQuery ? 'Try adjusting your search criteria' : 'No coaches available yet'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
