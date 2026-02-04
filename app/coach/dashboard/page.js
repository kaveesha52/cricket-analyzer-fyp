'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import CoachNav from '@/components/CoachNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Bell, Calendar, Star, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function CoachDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState(null)
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
      const response = await fetch(`/api/coach/students?coachUid=${user.uid}`)
      const data = await response.json()
      setStudents(data.students || [])
      
      setStats({
        totalStudents: data.students?.length || 0,
        pendingRequests: 0,
        sessionsThisWeek: 3,
        averageRating: 4.8
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav />
      
      <main className="md:ml-64 mt-16 p-6 pb-20 md:pb-6">
        <h1 className="text-3xl font-poppins font-bold text-gray-900 mb-6">Coach Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-blue-700">{stats?.totalStudents || 0}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +2 this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Requests</p>
                  <p className="text-3xl font-bold text-orange-600">{stats?.pendingRequests || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Review applications</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sessions This Week</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.sessionsThisWeek || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Scheduled</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats?.averageRating || 0}</p>
                  <div className="flex mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-poppins">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.slice(0, 3).map((student, index) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {student.studentData?.name?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="font-semibold">{student.studentData?.name || 'Student'}</p>
                      <p className="text-sm text-gray-600">{(index + 9)}:00 AM - {index === 0 ? 'Batting' : 'Bowling'} session</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">View Stats</Button>
                    <Button size="sm" className="bg-blue-700 hover:bg-blue-800">Join Session</Button>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <p className="text-gray-500 text-center py-8">No sessions scheduled for today</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Student Activity & Students Needing Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-poppins">Recent Student Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.slice(0, 5).map((student) => (
                  <div key={student.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {student.studentData?.name?.[0] || 'S'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{student.studentData?.name || 'Student'}</p>
                      <p className="text-xs text-gray-600">Added a new match</p>
                    </div>
                    <span className="text-xs text-gray-500">2h ago</span>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-poppins flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                Students Needing Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.slice(0, 3).map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium">{student.studentData?.name || 'Student'}</p>
                        <p className="text-xs text-gray-600">Performance dropped 15%</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                      Check In
                    </Button>
                  </div>
                ))}
                {students.length === 0 && (
                  <p className="text-gray-500 text-center py-8">All students performing well!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-lg mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-poppins">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/coach/students">
                <Button className="w-full bg-blue-700 hover:bg-blue-800 py-6">
                  <Users className="w-5 h-5 mr-2" />
                  View All Students
                </Button>
              </Link>
              <Button className="w-full bg-green-600 hover:bg-green-700 py-6" onClick={() => window.alert('Schedule Meeting feature coming soon!')}>
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}