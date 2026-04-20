'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { Bell, Play, Trophy } from 'lucide-react'
import { SidebarNav } from '@/components/SidebarNav'

export default function CareerHighlightsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [badges, setBadges] = useState([])
  const [records, setRecords] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch highlights data on mount
  useEffect(() => {
    if (!user?.uid) return
    fetchHighlights()
  }, [user])

  const fetchHighlights = async () => {
    try {
      const [badgesRes, statsRes] = await Promise.all([
        fetch(`/api/player/badges?studentUid=${user.uid}`),
        fetch(`/api/stats/player?uid=${user.uid}`)
      ])

      const badgesData = await badgesRes.json()
      const statsData = await statsRes.json()

      const unlockedBadges = (badgesData.badges || []).filter(b => b.unlocked || b.unlockedAt)
      setBadges(unlockedBadges)
      setStats(statsData)

      // Generate highlights/records from stats
      generateRecords(statsData, unlockedBadges)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching highlights:', error)
      setIsLoading(false)
    }
  }

  const generateRecords = (statsData, unlockedBadges) => {
    const newRecords = []

    if (!statsData || !statsData.stats) return

    const stats = statsData.stats
    const totalMatches = stats.totalMatches || 0
    const battingAvg = parseFloat(stats.battingAverage) || 0
    const strikeRate = parseFloat(stats.strikeRate) || 0
    const totalRuns = stats.totalRuns || 0

    // 1. MILESTONE ACHIEVEMENTS (GAMIFIED)
    const milestones = [
      { matches: 5, icon: '🎯', rarity: 'Common' },
      { matches: 10, icon: '⭐', rarity: 'Uncommon' },
      { matches: 20, icon: '🏆', rarity: 'Rare' },
      { matches: 50, icon: '👑', rarity: 'Epic' }
    ]

    milestones.forEach(milestone => {
      if (totalMatches >= milestone.matches) {
        newRecords.push({
          id: `milestone-${milestone.matches}`,
          type: 'milestone',
          title: `${milestone.matches} Matches Master`,
          description: `Played ${milestone.matches} matches - ${milestone.rarity} Achievement`,
          icon: milestone.icon,
          progress: totalMatches,
          progressMax: milestone.matches,
          rarity: milestone.rarity,
          unlocked: true,
          date: new Date().toISOString().split('T')[0]
        })
      }
    })

    // 2. BATTING ACHIEVEMENTS
    // Century Club
    if (totalRuns >= 100) {
      const centuryProgress = totalRuns
      newRecords.push({
        id: 'century-club',
        type: 'batting',
        title: '💯 Century Club',
        description: `Accumulated ${totalRuns} career runs`,
        icon: '💯',
        progress: totalRuns,
        progressMax: 1000,
        rarity: 'Rare',
        unlocked: true,
        nextMilestone: 500
      })
    }

    // Strike Rate Master
    if (strikeRate > 100) {
      newRecords.push({
        id: 'strike-master',
        type: 'batting',
        title: '⚡ Strike Rate Legend',
        description: `Maintained ${strikeRate.toFixed(2)} strike rate - Aggressive player!`,
        icon: '⚡',
        progress: strikeRate,
        progressMax: 150,
        rarity: 'Epic',
        unlocked: true
      })
    } else if (strikeRate > 80) {
      newRecords.push({
        id: 'strike-solid',
        type: 'batting',
        title: '⚽ Solid Strike Rate',
        description: `${strikeRate.toFixed(2)} SR - Balanced approach`,
        icon: '⚽',
        progress: strikeRate,
        progressMax: 100,
        rarity: 'Uncommon',
        unlocked: true
      })
    }

    // Consistency King
    if (battingAvg > 50) {
      newRecords.push({
        id: 'consistency-king',
        type: 'batting',
        title: '👑 Consistency King',
        description: `${battingAvg.toFixed(2)} batting average - Reliable performer`,
        icon: '👑',
        progress: battingAvg,
        progressMax: 100,
        rarity: 'Rare',
        unlocked: true
      })
    }

    // Run Machine
    if (totalMatches >= 3) {
      const avgPerMatch = (totalRuns / totalMatches).toFixed(2)
      newRecords.push({
        id: 'run-machine',
        type: 'batting',
        title: '🏃 Run Machine',
        description: `${avgPerMatch} runs per match average`,
        icon: '🏃',
        progress: totalRuns,
        progressMax: totalMatches * 50,
        rarity: 'Uncommon',
        unlocked: true
      })
    }

    // 3. BOWLING ACHIEVEMENTS
    if (stats.bowlingEconomy) {
      const economy = parseFloat(stats.bowlingEconomy)
      if (economy < 7) {
        newRecords.push({
          id: 'tight-bowler',
          type: 'bowling',
          title: '🛡️ Tight Bowler',
          description: `${economy.toFixed(2)} economy rate - Disciplined bowling`,
          icon: '🛡️',
          progress: economy,
          progressMax: 10,
          rarity: 'Rare',
          unlocked: true
        })
      }
    }

    if (stats.totalWickets && stats.totalWickets > 0) {
      newRecords.push({
        id: 'wicket-taker',
        type: 'bowling',
        title: '🎯 Wicket Taker',
        description: `${stats.totalWickets} wickets - Dangerous bowler`,
        icon: '🎯',
        progress: stats.totalWickets,
        progressMax: 20,
        rarity: stats.totalWickets >= 10 ? 'Rare' : 'Uncommon',
        unlocked: true
      })
    }

    // 4. FIELDING ACHIEVEMENTS
    if (stats.totalCatches && stats.totalCatches > 0) {
      newRecords.push({
        id: 'catch-master',
        type: 'fielding',
        title: '🧤 Safe Hands',
        description: `${stats.totalCatches} catches - Elite fielder`,
        icon: '🧤',
        progress: stats.totalCatches,
        progressMax: 15,
        rarity: stats.totalCatches >= 5 ? 'Rare' : 'Uncommon',
        unlocked: true
      })
    }

    // 5. UNLOCKED BADGES
    unlockedBadges.forEach((badge) => {
      if (badge.unlocked || badge.unlockedDate) {
        newRecords.push({
          id: `badge-${badge.id}`,
          type: 'badge',
          title: `⭐ ${badge.name}`,
          description: badge.description || 'Achievement unlocked',
          icon: badge.icon || '⭐',
          rarity: 'Special',
          unlocked: true,
          date: badge.unlockedDate || new Date().toISOString().split('T')[0]
        })
      }
    })

    // 6. PROGRESS/LOCKED ACHIEVEMENTS (Gamification)
    const lockedAchievements = [
      {
        id: 'double-century',
        title: '🔥 Double Century',
        description: 'Reach 200 career runs',
        icon: '🔥',
        progress: totalRuns,
        progressMax: 200,
        rarity: 'Epic',
        locked: totalRuns < 200
      },
      {
        id: 'average-50',
        title: '🎯 50+ Average',
        description: 'Achieve 50+ batting average',
        icon: '🎯',
        progress: battingAvg,
        progressMax: 50,
        rarity: 'Rare',
        locked: battingAvg < 50
      },
      {
        id: 'sr-130',
        title: '⚡ SR 130+',
        description: 'Maintain 130+ strike rate',
        icon: '⚡',
        progress: strikeRate,
        progressMax: 130,
        rarity: 'Epic',
        locked: strikeRate < 130
      },
      {
        id: 'match-veteran',
        title: '🏛️ Veteran',
        description: 'Play 25+ matches',
        icon: '🏛️',
        progress: totalMatches,
        progressMax: 25,
        rarity: 'Rare',
        locked: totalMatches < 25
      }
    ]

    // Add UNLOCKED achievements first
    lockedAchievements.forEach(achievement => {
      if (!achievement.locked) {
        newRecords.push({
          ...achievement,
          unlocked: true,
          progressPercent: 100,
          date: new Date().toISOString().split('T')[0]
        })
      }
    })

    // Add STILL-LOCKED achievements with progress bars
    lockedAchievements.forEach(achievement => {
      if (achievement.locked) {
        newRecords.push({
          ...achievement,
          unlocked: false,
          progressPercent: Math.min((achievement.progress / achievement.progressMax) * 100, 100)
        })
      }
    })

    setRecords(newRecords.sort((a, b) => {
      if (a.unlocked !== b.unlocked) return b.unlocked ? 1 : -1
      return new Date(b.date || 0) - new Date(a.date || 0)
    }))
  }

  const formatBadgeIcon = (badgeName) => {
    const iconMap = {
      'Century': '💯',
      'Half Century': '50️⃣',
      '5-Wicket Haul': '🎯',
      'Perfect Over': '🔟',
      'Fastest 50': '⚡',
      'Best Bowling': '🏏',
      'First Match': '🏏'
    }
    return iconMap[badgeName] || '⭐'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarNav activePage="Highlights" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading highlights...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <SidebarNav activePage="Highlights" />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Career Highlights</h1>
            <p className="text-sm text-gray-600">Your greatest moments and achievements</p>
          </div>
          <Bell className="w-5 h-5 text-gray-600" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {records.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {records.map((record) => (
                <div
                  key={record.id}
                  className={`rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer group ${
                    record.unlocked 
                      ? 'bg-white shadow-sm border border-gray-100' 
                      : 'bg-gray-800 shadow-sm border border-gray-700 opacity-75'
                  }`}
                >
                  {/* Background with gradient */}
                  <div className={`h-32 relative overflow-hidden ${
                    !record.unlocked ? 'bg-gradient-to-br from-gray-700 to-gray-800' :
                    record.rarity === 'Epic' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                    record.rarity === 'Rare' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                    record.rarity === 'Uncommon' ? 'bg-gradient-to-br from-green-500 to-emerald-500' :
                    'bg-gradient-to-br from-yellow-500 to-orange-500'
                  }`}>
                    {/* Big Icon */}
                    <div className="absolute top-2 right-2 text-5xl opacity-20 group-hover:opacity-30 transition-opacity">
                      {record.icon}
                    </div>
                    
                    {/* Locked Overlay */}
                    {!record.unlocked && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <span className="text-4xl">🔒</span>
                      </div>
                    )}
                  </div>

                  {/* Badge - Rarity or Status */}
                  <div className="absolute top-2 left-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                      !record.unlocked ? 'bg-gray-600 text-gray-200' :
                      record.rarity === 'Epic' ? 'bg-purple-600 text-white' :
                      record.rarity === 'Rare' ? 'bg-blue-600 text-white' :
                      record.rarity === 'Uncommon' ? 'bg-green-600 text-white' :
                      record.rarity === 'Special' ? 'bg-yellow-500 text-gray-900' :
                      'bg-gray-600 text-white'
                    }`}>
                      {!record.unlocked ? '🔜 LOCKED' : `${record.rarity || 'COMMON'}`}
                    </div>
                  </div>

                  {/* Info */}
                  <div className={`p-4 ${!record.unlocked ? 'text-gray-300' : 'text-gray-900'}`}>
                    <h3 className={`font-bold mb-1 line-clamp-2 ${!record.unlocked ? 'text-gray-400' : 'text-gray-900'}`}>
                      {record.title}
                    </h3>
                    <p className={`text-xs mb-3 line-clamp-2 ${!record.unlocked ? 'text-gray-500' : 'text-gray-600'}`}>
                      {record.description}
                    </p>

                    {/* Progress Bar */}
                    {record.progressMax && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold">{record.progress.toFixed(1)} / {record.progressMax}</span>
                          <span className="text-xs">{Math.min((record.progress / record.progressMax) * 100, 100).toFixed(0)}%</span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${!record.unlocked ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div
                            className={`h-2 rounded-full transition-all ${
                              record.unlocked 
                                ? 'bg-blue-600' 
                                : 'bg-gray-600'
                            }`}
                            style={{ width: `${Math.min((record.progress / record.progressMax) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className={`flex items-center justify-between text-xs pt-2 border-t ${
                      !record.unlocked ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-500'
                    }`}>
                      <span>{record.date ? formatDate(record.date) : 'In Progress'}</span>
                      <span>{!record.unlocked ? '🔒 Locked' : '✓ Unlocked'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-16 shadow-sm border border-gray-100 text-center max-w-2xl mx-auto">
              <Trophy className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Highlights Yet</h3>
              <p className="text-gray-600 mb-6">Start recording matches to unlock achievements and create highlights!</p>
              <button
                onClick={() => router.push('/player/add-match')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Your First Match
              </button>
            </div>
          )}
        </div>

        {/* Stats Summary Footer */}
        {stats && stats.stats && (
          <div className="bg-white border-t border-gray-200 px-8 py-4">
            <div className="grid grid-cols-4 gap-4 max-w-7xl mx-auto">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Total Matches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stats.totalMatches || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Batting Average</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stats.battingAverage || '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Strike Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stats.strikeRate || '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 text-sm">Economy</p>
                <p className="text-2xl font-bold text-gray-900">{stats.stats.bowlingEconomy || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const getGradientClass = (type) => {
  const gradients = {
    batting: 'from-purple-500 to-pink-500',
    bowling: 'from-blue-500 to-cyan-500',
    milestone: 'from-yellow-500 to-orange-500',
    badge: 'from-green-500 to-emerald-500',
    default: 'from-indigo-500 to-blue-500'
  }
  return gradients[type] || gradients.default
}
