'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { Bell, Trophy } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SidebarNav } from '@/components/SidebarNav'

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedFormat, setSelectedFormat] = useState('All')
  const [allMatches, setAllMatches] = useState([])
  const [battingTrendData, setBattingTrendData] = useState([])
  const [economyData, setEconomyData] = useState([])
  const [formatData, setFormatData] = useState([])
  const [fieldingStats, setFieldingStats] = useState({ catches: 0, runOuts: 0, stumpings: 0 })
  const [insights, setInsights] = useState([])

  useEffect(() => {
    if (!user?.uid) return
    fetchAnalyticsData()
  }, [user])

  useEffect(() => {
    if (allMatches.length > 0) {
      const filteredMatches = selectedFormat === 'All' 
        ? allMatches 
        : allMatches.filter(m => m.format === selectedFormat)
      
      processBattingTrends(filteredMatches)
      processEconomyTrends(filteredMatches)
      processFormatComparison(filteredMatches)
      calculateFieldingStats(filteredMatches)
      generateInsights(filteredMatches)
    }
  }, [selectedFormat, allMatches])

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/matches?uid=${user.uid}`)
      const data = await response.json()
      const matches = data.matches || []

      if (matches.length === 0) {
        setLoading(false)
        return
      }

      setAllMatches(matches)
      // Initial processing with 'All' format
      processBattingTrends(matches)
      processEconomyTrends(matches)
      processFormatComparison(matches)
      calculateFieldingStats(matches)
      generateInsights(matches)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setLoading(false)
    }
  }

  const processBattingTrends = (matches) => {
    // Show individual match data instead of monthly grouping
    const trendData = matches
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((match, idx) => {
        // Calculate running average
        const matchesUpToNow = matches.slice(0, idx + 1)
        const totalRuns = matchesUpToNow.reduce((sum, m) => sum + (m.batting?.runs || 0), 0)
        const runningAvg = (totalRuns / (idx + 1)).toFixed(2)
        
        return {
          name: `M${idx + 1}`,
          date: new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          runs: match.batting?.runs || 0,
          avg: runningAvg,
          wickets: match.bowling?.wickets || 0,
          economy: match.bowling?.economy || 0
        }
      })

    setBattingTrendData(trendData)
  }

  const processEconomyTrends = (matches) => {
    // Show individual match bowling data
    const bowlingTrend = matches
      .filter(m => m.bowling?.overs > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((match, idx) => ({
        name: `M${idx + 1}`,
        date: new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        wickets: match.bowling?.wickets || 0,
        economy: match.bowling?.economy || 0,
        overs: match.bowling?.overs || 0,
        runsConceded: match.bowling?.runsConceded || 0
      }))

    setEconomyData(bowlingTrend)
  }

  const processFormatComparison = (matches) => {
    // Group by format
    const formatStats = { T20: { runs: 0, count: 0 }, ODI: { runs: 0, count: 0 }, Test: { runs: 0, count: 0 } }

    matches.forEach((match) => {
      const format = match.format || 'T20'
      if (formatStats[format]) {
        formatStats[format].runs += match.batting?.runs || 0
        formatStats[format].count++
      }
    })

    const comparison = Object.entries(formatStats).map(([format, stats]) => ({
      format,
      runs: stats.runs,
      avg: stats.count > 0 ? (stats.runs / stats.count).toFixed(2) : 0
    }))

    setFormatData(comparison)
  }

  const calculateFieldingStats = (matches) => {
    let totalCatches = 0
    let totalRunOuts = 0
    let totalStumpings = 0

    matches.forEach((match) => {
      totalCatches += match.fielding?.catches || 0
      totalRunOuts += match.fielding?.runOuts || 0
      totalStumpings += match.fielding?.stumpings || 0
    })

    setFieldingStats({
      catches: totalCatches,
      runOuts: totalRunOuts,
      stumpings: totalStumpings
    })
  }

  const generateInsights = (matches) => {
    if (matches.length === 0) {
      setInsights([])
      return
    }

    const insights = []

    // 1. Total Matches
    insights.push({
      type: 'blue',
      title: `Total Matches: ${matches.length}`,
      description: `You have played ${matches.length} match${matches.length !== 1 ? 'es' : ''} so far`
    })

    // 2. Average Runs
    const totalRuns = matches.reduce((sum, m) => sum + (m.batting?.runs || 0), 0)
    const avgRuns = (totalRuns / matches.length).toFixed(2)
    insights.push({
      type: 'blue',
      title: `Average Runs: ${avgRuns}`,
      description: `Consistent performer with ${totalRuns} total runs`
    })

    // 3. Best Performance
    const bestMatch = matches.reduce((best, current) =>
      (current.batting?.runs || 0) > (best.batting?.runs || 0) ? current : best
    )
    insights.push({
      type: 'green',
      title: `Best Innings: ${bestMatch.batting?.runs || 0} runs`,
      description: `Scored against ${bestMatch.opponent || 'Unknown'} on ${new Date(bestMatch.date).toLocaleDateString()}`
    })

    // 4. Strike Rate Analysis
    const totalBalls = matches.reduce((sum, m) => sum + (m.batting?.balls || 0), 0)
    const overallSR = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : 0
    if (overallSR > 100) {
      insights.push({
        type: 'purple',
        title: `Aggressive Batter: ${overallSR} SR`,
        description: `Strike rate above 100 - playing aggressive cricket`
      })
    } else if (overallSR > 80) {
      insights.push({
        type: 'purple',
        title: `Good Strike Rate: ${overallSR} SR`,
        description: `Maintaining a balanced approach`
      })
    } else {
      insights.push({
        type: 'purple',
        title: `Strike Rate: ${overallSR}`,
        description: `Conservative approach, focus on stability`
      })
    }

    // 5. Bowling Performance
    const bowledMatches = matches.filter(m => m.bowling?.wickets > 0)
    if (bowledMatches.length > 0) {
      const totalWickets = bowledMatches.reduce((sum, m) => sum + (m.bowling?.wickets || 0), 0)
      const totalEconomy = bowledMatches.reduce((sum, m) => sum + parseFloat(m.bowling?.economy || 0), 0)
      const avgEconomy = (totalEconomy / bowledMatches.length).toFixed(2)
      
      insights.push({
        type: 'green',
        title: `Bowling: ${totalWickets} wickets`,
        description: `Economy rate: ${avgEconomy} across ${bowledMatches.length} matches`
      })
    }

    // 6. Fielding Contribution
    const totalCatches = matches.reduce((sum, m) => sum + (m.fielding?.catches || 0), 0)
    const totalRunOuts = matches.reduce((sum, m) => sum + (m.fielding?.runOuts || 0), 0)
    if (totalCatches > 0 || totalRunOuts > 0) {
      insights.push({
        type: 'green',
        title: `Fielding: ${totalCatches + totalRunOuts} dismissals`,
        description: `${totalCatches} catches and ${totalRunOuts} run-outs`
      })
    }

    // 7. Format breakdown
    const formats = {}
    matches.forEach(m => {
      if (!formats[m.format]) formats[m.format] = 0
      formats[m.format]++
    })
    const mostPlayedFormat = Object.entries(formats).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
   insights.push({
      type: 'purple',
      title: `Most Played: ${mostPlayedFormat}`,
      description: `${formats[mostPlayedFormat]} out of ${matches.length} matches`
    })

    setInsights(insights)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarNav activePage="Analytics" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <SidebarNav activePage="Analytics" />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <div className="flex gap-4 mt-2">
              {['All', 'T20', 'ODI', 'Test'].map(format => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`text-sm px-3 py-1 rounded transition-colors ${
                    selectedFormat === format
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
          <Bell className="w-5 h-5 text-gray-600" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 space-y-6">
          {allMatches.length === 0 ? (
            <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Yet</h3>
              <p className="text-gray-600 mb-6">Add some matches to see your analytics</p>
              <button
                onClick={() => router.push('/player/add-match')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Match
              </button>
            </div>
          ) : battingTrendData.length === 0 ? (
            <div className="bg-white rounded-lg p-12 shadow-sm border border-gray-100 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data for {selectedFormat}</h3>
              <p className="text-gray-600">Try selecting a different format or add matches</p>
            </div>
          ) : (
            <>
              {/* Batting Trends */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Batting Trends - Runs per Match</h2>
                {battingTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={battingTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis yAxisId="left" stroke="#9ca3af" />
                      <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                        formatter={(value, name) => {
                          if (name === 'Runs') return [value, 'Runs Scored']
                          if (name === 'Average') return [value, 'Running Average']
                          return [value, name]
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="runs"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Runs"
                        dot={{ fill: '#3b82f6', r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avg"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Average"
                        dot={{ fill: '#10b981', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-600 text-center py-8">No batting data available</p>
                )}
              </div>

              {/* Bowling Performance */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Bowling Performance - Wickets Taken</h2>
                {economyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={economyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis yAxisId="left" stroke="#9ca3af" />
                      <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                        formatter={(value, name) => {
                          if (name === 'Wickets') return [value, 'Wickets Taken']
                          if (name === 'Economy') return [value, 'Economy Rate']
                          return [value, name]
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="wickets"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="Wickets"
                        dot={{ fill: '#ef4444', r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="economy"
                        stroke="#f97316"
                        strokeWidth={2}
                        name="Economy"
                        dot={{ fill: '#f97316', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-600 text-center py-8">No bowling data available</p>
                )}
              </div>

              {/* Format Comparison */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Format Comparison</h2>
                {formatData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formatData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="format" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="runs" fill="#3b82f6" name="Total Runs" />
                      <Bar dataKey="avg" fill="#10b981" name="Average" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-600 text-center py-8">No format data available</p>
                )}
              </div>

              {/* Fielding Stats & Key Insights */}
              <div className="grid grid-cols-2 gap-6">
                {/* Fielding Stats */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold mb-4 text-gray-900">Fielding Statistics</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Catches</span>
                      <span className="text-2xl font-bold text-blue-600">{fieldingStats.catches}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-700">Run-outs</span>
                      <span className="text-2xl font-bold text-green-600">{fieldingStats.runOuts}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-gray-700">Stumpings</span>
                      <span className="text-2xl font-bold text-orange-600">{fieldingStats.stumpings}</span>
                    </div>
                  </div>
                </div>

                {/* Key Insights */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold mb-4 text-gray-900">Key Insights</h2>
                  <div className="space-y-3">
                    {insights.length > 0 ? (
                      insights.map((insight, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border-l-4 ${
                            insight.type === 'purple'
                              ? 'bg-purple-50 border-purple-600'
                              : insight.type === 'blue'
                                ? 'bg-blue-50 border-blue-600'
                                : 'bg-green-50 border-green-600'
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                          <p className="text-xs text-gray-600">{insight.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 text-sm">Add more matches to see insights</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================
// Now using unified SidebarNav component from @/components/SidebarNav