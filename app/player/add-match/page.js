'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { SidebarNav } from '@/components/SidebarNav'

export default function AddMatchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [matchData, setMatchData] = useState({
    date: new Date().toISOString().split('T')[0],
    format: 'T20',
    location: '',
    opponent: '',
    runs: '',
    balls: '',
    fours: '',
    sixes: '',
    dismissal: 'Not Out',
    overs: '',
    wickets: '',
    runsGiven: '',
    maidens: '',
    catches: '',
    runOuts: '',
    stumpings: '',
  })

  const handleChange = (e) => {
    setMatchData({ ...matchData, [e.target.name]: e.target.value })
  }

  const checkBadges = () => {
    const earnedBadges = []
    const runs = parseInt(matchData.runs) || 0
    const wickets = parseInt(matchData.wickets) || 0

    if (runs >= 100) {
      earnedBadges.push({
        name: 'Century!',
        description: 'Scored 100+ runs',
        icon: '💯'
      })
    } else if (runs >= 50) {
      earnedBadges.push({
        name: 'Half Century!',
        description: 'Scored 50+ runs',
        icon: '⭐'
      })
    }

    if (wickets >= 5) {
      earnedBadges.push({
        name: '5-Wicket Haul!',
        description: 'Took 5+ wickets',
        icon: '🎯'
      })
    }

    return earnedBadges
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!matchData.date || !matchData.location) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          date: matchData.date,
          format: matchData.format,
          location: matchData.location,
          opponent: matchData.opponent,
          batting: {
            runs: parseInt(matchData.runs) || 0,
            balls: parseInt(matchData.balls) || 0,
            fours: parseInt(matchData.fours) || 0,
            sixes: parseInt(matchData.sixes) || 0,
            dismissal: matchData.dismissal
          },
          bowling: {
            overs: parseFloat(matchData.overs) || 0,
            wickets: parseInt(matchData.wickets) || 0,
            runsConceded: parseInt(matchData.runsGiven) || 0,
            maidens: parseInt(matchData.maidens) || 0
          },
          fielding: {
            catches: parseInt(matchData.catches) || 0,
            runOuts: parseInt(matchData.runOuts) || 0,
            stumpings: parseInt(matchData.stumpings) || 0
          }
        })
      })

      if (response.ok) {
        const earnedBadges = checkBadges()

        toast.success('Match Added Successfully!', {
          description: 'Your match has been recorded.',
          duration: 3000
        })

        if (earnedBadges.length > 0) {
          earnedBadges.forEach((badge, index) => {
            setTimeout(() => {
              toast.success(`${badge.icon} ${badge.name}`, {
                description: badge.description,
                duration: 4000
              })
            }, (index + 1) * 500)
          })
        }

        setTimeout(() => {
          router.push('/player/dashboard')
        }, 2000)
      } else {
        toast.error('Failed to add match', {
          description: 'Please try again.'
        })
      }
    } catch (error) {
      console.error('Error adding match:', error)
      toast.error('Error', {
        description: 'An error occurred while adding the match.'
      })
    } finally {
      setLoading(false)
    }
  }

  const strikeRate = matchData.balls ? ((parseInt(matchData.runs || '0') / parseInt(matchData.balls)) * 100).toFixed(2) : '0'
  const economy = matchData.overs ? (parseInt(matchData.runsGiven || '0') / parseInt(matchData.overs)).toFixed(2) : '0'

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <SidebarNav activePage="Add Match" />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Add Match</h1>
          <Bell className="w-5 h-5 text-gray-600" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg p-8 shadow-sm border border-gray-100 space-y-6">
            <form onSubmit={handleSubmit}>
              {/* Match Details */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-900">Match Details</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={matchData.date}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <select
                      name="format"
                      value={matchData.format}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>T20</option>
                      <option>ODI</option>
                      <option>Test</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={matchData.location}
                      onChange={handleChange}
                      placeholder="Stadium name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opponent</label>
                    <input
                      type="text"
                      name="opponent"
                      value={matchData.opponent}
                      onChange={handleChange}
                      placeholder="Team name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Batting Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Batting</h3>
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Runs</label>
                    <input
                      type="number"
                      name="runs"
                      value={matchData.runs}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Balls</label>
                    <input
                      type="number"
                      name="balls"
                      value={matchData.balls}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fours</label>
                    <input
                      type="number"
                      name="fours"
                      value={matchData.fours}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sixes</label>
                    <input
                      type="number"
                      name="sixes"
                      value={matchData.sixes}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dismissal</label>
                    <select
                      name="dismissal"
                      value={matchData.dismissal}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Not Out</option>
                      <option>Bowled</option>
                      <option>Caught</option>
                      <option>LBW</option>
                      <option>Run Out</option>
                      <option>Stumped</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600">
                    Strike Rate: <span className="font-bold">{strikeRate}</span>
                  </p>
                </div>
              </div>

              {/* Bowling Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Bowling</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overs</label>
                    <input
                      type="number"
                      name="overs"
                      value={matchData.overs}
                      onChange={handleChange}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wickets</label>
                    <input
                      type="number"
                      name="wickets"
                      value={matchData.wickets}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Runs Given</label>
                    <input
                      type="number"
                      name="runsGiven"
                      value={matchData.runsGiven}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maidens</label>
                    <input
                      type="number"
                      name="maidens"
                      value={matchData.maidens}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600">
                    Economy Rate: <span className="font-bold">{economy}</span>
                  </p>
                </div>
              </div>

              {/* Fielding Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900">Fielding</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catches</label>
                    <input
                      type="number"
                      name="catches"
                      value={matchData.catches}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Run-outs</label>
                    <input
                      type="number"
                      name="runOuts"
                      value={matchData.runOuts}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stumpings</label>
                    <input
                      type="number"
                      name="stumpings"
                      value={matchData.stumpings}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="border-t pt-6 flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'Adding Match...' : 'Add Match'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================
// Now using unified SidebarNav component from @/components/SidebarNav