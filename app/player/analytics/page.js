'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/authContext'
import PlayerNav from '@/components/PlayerNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMatches()
    }
  }, [user])

  const fetchMatches = async () => {
    try {
      const response = await fetch(`/api/matches?uid=${user.uid}`)
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  const battingTrendData = {
    labels: matches.slice(-10).map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Runs',
        data: matches.slice(-10).map(m => m.batting?.runs || 0),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
        yAxisID: 'y'
      },
      {
        label: 'Strike Rate',
        data: matches.slice(-10).map(m => parseFloat(m.batting?.strikeRate || 0)),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        yAxisID: 'y1'
      }
    ]
  }

  const bowlingAnalysisData = {
    labels: matches.slice(-10).filter(m => m.bowling?.overs > 0).map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Economy Rate',
      data: matches.slice(-10).filter(m => m.bowling?.overs > 0).map(m => parseFloat(m.bowling?.economy || 0)),
      borderColor: 'rgb(249, 115, 22)',
      backgroundColor: 'rgba(249, 115, 22, 0.2)',
      fill: true,
      tension: 0.4
    }]
  }

  const formatComparisonData = {
    labels: ['T20', 'ODI', 'Test'],
    datasets: [
      {
        label: 'Batting Average',
        data: [
          matches.filter(m => m.format === 'T20').reduce((acc, m) => acc + (m.batting?.runs || 0), 0) / (matches.filter(m => m.format === 'T20').length || 1),
          matches.filter(m => m.format === 'ODI').reduce((acc, m) => acc + (m.batting?.runs || 0), 0) / (matches.filter(m => m.format === 'ODI').length || 1),
          matches.filter(m => m.format === 'Test').reduce((acc, m) => acc + (m.batting?.runs || 0), 0) / (matches.filter(m => m.format === 'Test').length || 1)
        ],
        backgroundColor: 'rgba(37, 99, 235, 0.7)'
      },
      {
        label: 'Strike Rate',
        data: [
          matches.filter(m => m.format === 'T20').reduce((acc, m) => acc + parseFloat(m.batting?.strikeRate || 0), 0) / (matches.filter(m => m.format === 'T20').length || 1),
          matches.filter(m => m.format === 'ODI').reduce((acc, m) => acc + parseFloat(m.batting?.strikeRate || 0), 0) / (matches.filter(m => m.format === 'ODI').length || 1),
          matches.filter(m => m.format === 'Test').reduce((acc, m) => acc + parseFloat(m.batting?.strikeRate || 0), 0) / (matches.filter(m => m.format === 'Test').length || 1)
        ],
        backgroundColor: 'rgba(34, 197, 94, 0.7)'
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700">
      <PlayerNav />
      
      <main className="md:ml-64 mt-16 p-6 pb-20 md:pb-6">
        <h1 className="text-3xl font-poppins font-bold text-white mb-6">Performance Analytics</h1>
        
        {matches.length > 0 ? (
          <>
            <Card className="shadow-2xl mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-poppins">Batting Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <Line 
                  data={battingTrendData} 
                  options={{
                    responsive: true,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                      y: { type: 'linear', display: true, position: 'left' },
                      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
                    }
                  }} 
                />
              </CardContent>
            </Card>

            <Card className="shadow-2xl mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-poppins">Bowling Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {matches.filter(m => m.bowling?.overs > 0).length > 0 ? (
                  <Line data={bowlingAnalysisData} options={{ responsive: true }} />
                ) : (
                  <p className="text-gray-500 text-center py-8">No bowling data available</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-2xl mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-poppins">Format Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar data={formatComparisonData} options={{ responsive: true }} />
              </CardContent>
            </Card>

            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-poppins">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded">
                  <p className="text-cyan-900">📈 Your strike rate improved in the last 5 matches!</p>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-blue-900">🎯 T20 format is your strongest - keep it up!</p>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                  <p className="text-purple-900">🏏 You've played {matches.length} matches this season</p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="shadow-2xl">
            <CardContent className="py-16 text-center">
              <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
              <p className="text-gray-600">Add matches to see your performance analytics</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}