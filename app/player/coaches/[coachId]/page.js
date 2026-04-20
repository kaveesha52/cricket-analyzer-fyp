'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { SidebarNav } from '@/components/SidebarNav'
import { Bell, Award, Users, Mail, CheckCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function CoachDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const coachId = params.coachId

  const [coach, setCoach] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)

  useEffect(() => {
    if (!user?.uid || !coachId) return
    fetchCoachDetails()
    setupConnectionListener()
  }, [user, coachId])

  const setupConnectionListener = () => {
    try {
      const connectionsRef = collection(db, 'connections')
      const q = query(
        connectionsRef,
        where('studentUid', '==', user.uid),
        where('coachUid', '==', coachId)
      )
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.docs.length > 0) {
          const connection = snapshot.docs[0].data()
          setConnectionStatus(connection.status)
        } else {
          setConnectionStatus(null)
        }
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error setting up listener:', error)
    }
  }

  const fetchCoachDetails = async () => {
    try {
      const response = await fetch(`/api/coach/details?coachUid=${coachId}`)
      const data = await response.json()
      setCoach(data.coach)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching coach details:', error)
      toast.error('Failed to load coach details')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const response = await fetch('/api/coach/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentUid: user.uid,
          coachUid: coachId
        })
      })

      if (response.ok) {
        toast.success('Connection request sent!', {
          description: `Your request to connect with ${coach.name} has been sent.`
        })
        setConnectionStatus('pending')
      } else {
        toast.error('Failed to send connection request')
      }
    } catch (error) {
      console.error('Error sending connection request:', error)
      toast.error('Error sending connection request')
    } finally {
      setConnecting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarNav activePage="Community" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading coach details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarNav activePage="Community" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Coach not found</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
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
            <h1 className="text-2xl font-bold text-gray-900">Coach Profile</h1>
            <p className="text-sm text-gray-600">Explore this coach's experience and credentials</p>
          </div>
          <Bell className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-900" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Coach Header Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-white mb-6">
              <div className="flex items-start justify-between gap-8">
                <div className="flex items-center gap-6 flex-1">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-3xl font-bold text-blue-600">
                    {coach.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{coach.name}</h2>
                    <p className="text-blue-100 mb-2">{coach.email}</p>
                    <div className="flex items-center gap-4 text-sm">
                      {stats && (
                        <>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{stats.connectedStudents} Students</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>{stats.pendingRequests} Pending Requests</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {connectionStatus === 'pending' ? (
                  <button
                    disabled
                    className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium cursor-not-allowed"
                  >
                    ⏳ Request Pending
                  </button>
                ) : connectionStatus === 'accepted' ? (
                  <button
                    disabled
                    className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium cursor-not-allowed"
                  >
                    ✓ Connected
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="px-6 py-3 bg-white text-blue-600 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    {connecting ? 'Connecting...' : 'Connect with Coach'}
                  </button>
                )}
              </div>
            </div>

            {/* Bio Section */}
            {coach.bio && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
                <p className="text-gray-600 leading-relaxed">{coach.bio}</p>
              </div>
            )}

            {/* Specializations */}
            {coach.specializations && coach.specializations.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Specializations</h3>
                <div className="flex flex-wrap gap-3">
                  {coach.specializations.map((spec, idx) => (
                    <span key={idx} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {coach.certifications && coach.certifications.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-700" />
                  Certifications
                </h3>
                <div className="space-y-3">
                  {coach.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <Award className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">{cert.name || cert}</p>
                        {typeof cert === 'object' && cert.year && (
                          <p className="text-sm text-gray-600">Issued: {cert.year}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Session Types */}
            {coach.sessionTypes && coach.sessionTypes.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Session Types</h3>
                <div className="flex flex-wrap gap-3">
                  {coach.sessionTypes.map((type, idx) => (
                    <span key={idx} className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Max Students */}
            {coach.maxStudents > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Capacity</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Maximum Students</span>
                  <span className="text-2xl font-bold text-blue-600">{coach.maxStudents}</span>
                </div>
              </div>
            )}

            {/* Experience Section */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {coach.yearsCoaching !== undefined && (
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <h3 className="text-sm text-gray-600 font-medium mb-2">Years Coaching</h3>
                  <p className="text-3xl font-bold text-blue-600">{coach.yearsCoaching}+</p>
                </div>
              )}
              {coach.totalStudentsCoached !== undefined && (
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <h3 className="text-sm text-gray-600 font-medium mb-2">Students Coached</h3>
                  <p className="text-3xl font-bold text-green-600">{coach.totalStudentsCoached}+</p>
                </div>
              )}
            </div>

            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="w-full px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              ← Go Back to Coaches List
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
