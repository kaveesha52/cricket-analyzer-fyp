'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { Bell } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { SidebarNav } from '@/components/SidebarNav'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [matches, setMatches] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [battingTrendData, setBattingTrendData] = useState([])
  const [formatComparisonData, setFormatComparisonData] = useState([])
  const [dismissalData, setDismissalData] = useState([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    // Update chart data when filter changes
    const filteredMatches = selectedFilter === 'All' 
      ? matches 
      : matches.filter(m => m.format === selectedFilter)
    processChartData(filteredMatches)
  }, [selectedFilter, matches])

  const fetchData = async () => {
    try {
      const [statsRes, matchesRes] = await Promise.all([
        fetch(`/api/stats/player?uid=${user.uid}`),
        fetch(`/api/matches?uid=${user.uid}`)
      ])

      const statsData = await statsRes.json()
      const matchesData = await matchesRes.json()

      setStats(statsData.stats)
      setMatches(matchesData.matches || [])

      // Process data for charts
      processChartData(matchesData.matches || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const processChartData = (allMatches) => {
    // Batting Trend Data
    const trendData = allMatches.slice(-10).map((match, idx) => ({
      match: `M${idx + 1}`,
      runs: match.batting?.runs || 0,
      avg: calculateRunningAverage(allMatches.slice(0, idx + 1))
    }))
    setBattingTrendData(trendData)

    // Format Comparison Data
    const formats = {}
    allMatches.forEach(match => {
      if (!formats[match.format]) {
        formats[match.format] = { format: match.format, total: 0, count: 0, strikeRate: 0, balls: 0 }
      }
      formats[match.format].total += match.batting?.runs || 0
      formats[match.format].count++
      formats[match.format].balls += match.batting?.balls || 0
    })

    const formatData = Object.values(formats).map(f => ({
      format: f.format,
      average: (f.total / f.count).toFixed(2),
      strikeRate: f.balls > 0 ? ((f.total / f.balls) * 100).toFixed(2) : 0
    }))
    setFormatComparisonData(formatData)

    // Dismissal Analysis
    const dismissals = {}
    allMatches.forEach(match => {
      const dismissal = match.batting?.dismissal || 'Not Out'
      dismissals[dismissal] = (dismissals[dismissal] || 0) + 1
    })

    const dismissalArray = Object.entries(dismissals).map(([name, value]) => ({ name, value }))
    setDismissalData(dismissalArray)
  }

  const calculateRunningAverage = (matchesList) => {
    const totalRuns = matchesList.reduce((sum, m) => sum + (m.batting?.runs || 0), 0)
    return (totalRuns / matchesList.length).toFixed(2)
  }

  const getFilteredStats = () => {
    let filteredMatches = matches
    if (selectedFilter !== 'All') {
      filteredMatches = matches.filter(m => m.format === selectedFilter)
    }

    if (filteredMatches.length === 0) {
      return {
        totalMatches: 0,
        battingAverage: '-',
        strikeRate: '-',
        bowlingEconomy: '-',
        totalRuns: '-'
      }
    }

    let totalRuns = 0
    let totalBalls = 0
    let totalOvers = 0
    let totalRunsConceded = 0

    filteredMatches.forEach(match => {
      totalRuns += match.batting?.runs || 0
      totalBalls += match.batting?.balls || 0
      totalOvers += match.bowling?.overs || 0
      totalRunsConceded += match.bowling?.runsConceded || 0
    })

    const battingAverage = filteredMatches.length > 0 ? (totalRuns / filteredMatches.length).toFixed(2) : 0
    const strikeRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : 0
    const bowlingEconomy = totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : 0

    return {
      totalMatches: filteredMatches.length,
      battingAverage,
      strikeRate,
      bowlingEconomy,
      totalRuns
    }
  }

  const filterMatches = () => {
    if (selectedFilter === 'All') return matches.slice(0, 3)
    return matches.filter(m => m.format === selectedFilter).slice(0, 3)
  }

  const formatMatchDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const recentMatches = filterMatches()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <SidebarNav activePage="Dashboard" />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Overview</h1>
            <div className="flex gap-4 mt-2">
              {['All', 'T20', 'ODI', 'Test'].map(format => (
                <button
                  key={format}
                  onClick={() => setSelectedFilter(format)}
                  className={`text-sm px-3 py-1 rounded transition-colors ${
                    selectedFilter === format
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search matches..."
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <Bell className="w-5 h-5 text-gray-600 cursor-pointer" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-6">
            {(() => {
              const filteredStats = getFilteredStats()
              return (
                <>
                  <MetricCard
                    title="Batting Average"
                    value={filteredStats.totalMatches > 0 ? filteredStats.battingAverage : '-'}
                    change={filteredStats.totalMatches > 0 ? "+2.1% vs last month" : "Add matches to see data"}
                    icon="📊"
                  />
                  <MetricCard
                    title="Strike Rate (T20)"
                    value={filteredStats.totalMatches > 0 ? filteredStats.strikeRate : '-'}
                    change={filteredStats.totalMatches > 0 ? "+3.6 vs last month" : "Add matches to see data"}
                    icon="⚡"
                  />
                  <MetricCard
                    title="Economy Rate"
                    value={filteredStats.totalMatches > 0 ? filteredStats.bowlingEconomy : '-'}
                    change={filteredStats.totalMatches > 0 ? "-0.2 vs last month" : "Add matches to see data"}
                    icon="🎯"
                  />
                  <MetricCard
                    title="Total Runs (YTD)"
                    value={filteredStats.totalMatches > 0 ? filteredStats.totalRuns || 0 : '-'}
                    change={`${filteredStats.totalMatches} ${filteredStats.totalMatches === 1 ? 'Match' : 'Matches'}`}
                    icon="🏆"
                  />
                </>
              )
            })()}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Batting Performance Trend */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Batting Performance Trend</h2>
              {battingTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={battingTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="match" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="runs" stroke="#8b5cf6" strokeWidth={2} name="Runs" />
                    <Line type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={2} name="Avg (Last 10)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>

            {/* Format Comparison */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Format Comparison</h2>
              {formatComparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="format" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="average" fill="#8b5cf6" name="Average" />
                    <Bar dataKey="strikeRate" fill="#10b981" name="Strike Rate" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>
          </div>

          {/* Dismissal Analysis & Recent Matches */}
          <div className="grid grid-cols-2 gap-6">
            {/* Dismissal Analysis */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Dismissal Analysis</h2>
              {dismissalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dismissalData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-8">No data available</p>
              )}
            </div>

            {/* Recent Matches */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Recent Matches</h2>
                <Link href="/player/matches" className="text-blue-600 text-sm font-medium hover:underline">View All</Link>
              </div>
              {recentMatches.length > 0 ? (
                <div className="space-y-4">
                  {recentMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded">
                            {match.format}
                          </span>
                          <p className="text-sm font-bold text-gray-900">vs {match.opponent || 'Unknown Team'}</p>
                        </div>
                        <p className="text-xs text-gray-500">{match.location || 'Unknown Location'}</p>
                        <p className="text-xs text-gray-500">{formatMatchDate(match.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{match.batting?.runs || 0}</p>
                        <p className="text-xs text-gray-600">@ {match.batting?.strikeRate || '0.00'} SR</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No matches found</p>
              )}
            </div>
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

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

function MetricCard({ title, value, change, icon }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <p className="text-gray-600 text-sm">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
      <p className="text-xs text-green-600">{change}</p>
    </div>
  )
}
