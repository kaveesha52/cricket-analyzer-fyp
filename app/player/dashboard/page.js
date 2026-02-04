'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import PlayerNav from '@/components/PlayerNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Target, DollarSign, Activity, Plus } from 'lucide-react'
import Link from 'next/link'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function PlayerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [matches, setMatches] = useState([])
  const [loadingData, setLoadingData] = useState(true)

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

  const fetchData = async () => {
    try {
      const [statsRes, matchesRes] = await Promise.all([
        fetch(`/api/stats/player?uid=${user.uid}`),
        fetch(`/api/matches?uid=${user.uid}`)
      ])

      const statsData = await statsRes.json()
      const matchesData = await matchesRes.json()

      setStats(statsData.stats)
      setMatches(matchesData.matches?.slice(0, 5) || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const lineChartData = {
    labels: matches.slice().reverse().map(m => new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Runs',
        data: matches.slice().reverse().map(m => m.batting?.runs || 0),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const barChartData = {
    labels: ['T20', 'ODI', 'Test'],
    datasets: [
      {
        label: 'Batting Average',
        data: [
          matches.filter(m => m.format === 'T20').reduce((acc, m) => acc + (m.batting?.runs || 0), 0) / (matches.filter(m => m.format === 'T20').length || 1),
          matches.filter(m => m.format === 'ODI').reduce((acc, m) => acc + (m.batting?.runs || 0), 0) / (matches.filter(m => m.format === 'ODI').length || 1),
          matches.filter(m => m.format === 'Test').reduce((acc, m) => acc + (m.batting?.runs || 0), 0) / (matches.filter(m => m.format === 'Test').length || 1)
        ],
        backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(37, 99, 235, 0.8)', 'rgba(34, 197, 94, 0.8)']
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PlayerNav />
      
      <main className="md:ml-64 mt-16 p-6 pb-20 md:pb-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="mb-8">
          <h1 className="text-4xl font-poppins font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Welcome back! Here's your performance overview</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Batting Average</p>
                  <p className="text-4xl font-bold">{stats?.battingAverage || '0.00'}</p>
                  <p className="text-blue-100 text-xs mt-2">Per match average</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-105 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-1">Strike Rate</p>
                  <p className="text-4xl font-bold">{stats?.strikeRate || '0.00'}</p>
                  <p className="text-green-100 text-xs mt-2">Runs per 100 balls</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Activity className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:scale-105 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Bowling Economy</p>
                  <p className="text-4xl font-bold">{stats?.bowlingEconomy || '0.00'}</p>
                  <p className="text-orange-100 text-xs mt-2">Runs per over</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Target className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:scale-105 transition-transform duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Total Matches</p>
                  <p className="text-4xl font-bold">{stats?.totalMatches || 0}</p>
                  <p className="text-purple-100 text-xs mt-2">Recorded games</p>
                </div>
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-7 h-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-xl border-0 hover:shadow-2xl transition-shadow">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-transparent">
              <CardTitle className="text-lg font-poppins flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  📈
                </div>
                Runs Per Match Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {matches.length > 0 ? (
                <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: true }} />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    📊
                  </div>
                  <p className="text-gray-500">No data yet. Add matches to see trends!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 hover:shadow-2xl transition-shadow">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-transparent">
              <CardTitle className="text-lg font-poppins flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  📊
                </div>
                Performance by Format
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {matches.length > 0 ? (
                <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: true }} />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    📊
                  </div>
                  <p className="text-gray-500">No data yet. Add matches to see analysis!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Matches */}
        <Card className="shadow-xl border-0">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-purple-50 to-transparent">
            <CardTitle className="text-lg font-poppins flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                🏏
              </div>
              Recent Matches
            </CardTitle>
            <Link href="/player/matches">
              <Button variant="ghost" size="sm" className="hover:bg-purple-100">View All →</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {matches.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Format</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Runs</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Wickets</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match, index) => (
                      <tr key={match.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="py-3 px-4">{new Date(match.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            match.format === 'T20' ? 'bg-red-100 text-red-700' :
                            match.format === 'ODI' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {match.format}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-blue-600">{match.batting?.runs || 0}</td>
                        <td className="py-3 px-4 font-semibold text-green-600">{match.bowling?.wickets || 0}</td>
                        <td className="py-3 px-4">{match.batting?.strikeRate || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No matches yet! Add your first match to start tracking.</p>
                <Link href="/player/add-match">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Match
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Floating Add Button */}
        <Link href="/player/add-match">
          <Button
            className="fixed bottom-20 md:bottom-8 right-8 w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </main>
    </div>
  )
}