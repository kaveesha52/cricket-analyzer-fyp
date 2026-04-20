'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import CoachNav from '@/components/CoachNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Bell, Calendar, Star, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CoachDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [todayMeetings, setTodayMeetings] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedStudentMeetings, setSelectedStudentMeetings] = useState([])
  const [meetingsLoading, setMeetingsLoading] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [meetingType, setMeetingType] = useState('batting')
  const [meetingNotes, setMeetingNotes] = useState('')
  const [schedulingMeeting, setSchedulingMeeting] = useState(false)
  const [selectedStudentForMeeting, setSelectedStudentForMeeting] = useState(null)

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
      const [studentsRes, meetingsRes, requestsRes] = await Promise.all([
        fetch(`/api/coach/students?coachUid=${user.uid}`),
        fetch(`/api/coach/meetings?coachUid=${user.uid}`),
        fetch(`/api/coach/requests?coachUid=${user.uid}`)
      ])

      const studentsData = await studentsRes.json()
      const meetingsData = await meetingsRes.json()
      const requestsData = await requestsRes.json()

      setStudents(studentsData.students || [])
      setPendingRequests(requestsData.requests || [])

      // Filter today's meetings
      const today = new Date().toISOString().split('T')[0]
      const todayMeetingsList = (meetingsData.meetings || []).filter(m => m.date === today)
      setTodayMeetings(todayMeetingsList)

      setStats({
        totalStudents: studentsData.students?.length || 0,
        pendingRequests: requestsData.requests?.length || 0,
        sessionsThisWeek: (meetingsData.meetings || []).length,
        averageRating: 4.8
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchStudentMeetings = async (studentUid) => {
    setMeetingsLoading(true)
    try {
      const response = await fetch(`/api/coach/meetings?coachUid=${user.uid}&studentUid=${studentUid}`)
      const data = await response.json()
      setSelectedStudentMeetings(data.meetings || [])
    } catch (error) {
      console.error('Error fetching student meetings:', error)
    } finally {
      setMeetingsLoading(false)
    }
  }

  const handleSelectStudent = (student) => {
    setSelectedStudent(student)
    fetchStudentMeetings(student.studentData.uid)
  }

  const handleScheduleMeeting = async () => {
    if (!meetingDate || !meetingTime || !selectedStudentForMeeting) {
      toast.error('Please fill in all required fields')
      return
    }

    setSchedulingMeeting(true)
    try {
      const response = await fetch('/api/coach/schedule-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coachUid: user.uid,
          studentUid: selectedStudentForMeeting.uid,
          date: meetingDate,
          time: meetingTime,
          type: meetingType,
          notes: meetingNotes
        })
      })

      if (response.ok) {
        toast.success('Session scheduled successfully!')
        setShowScheduleModal(false)
        setMeetingDate('')
        setMeetingTime('')
        setMeetingType('batting')
        setMeetingNotes('')
        setSelectedStudentForMeeting(null)
        // Refresh data
        await fetchData()
      } else {
        toast.error('Failed to schedule meeting')
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error)
      toast.error('Error scheduling meeting')
    } finally {
      setSchedulingMeeting(false)
    }
  }

  const openScheduleModal = () => {
    if (students.length === 0) {
      toast.error('No connected students to schedule with')
      return
    }
    setSelectedStudentForMeeting(students[0])
    setShowScheduleModal(true)
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
              {todayMeetings.length > 0 ? (
                todayMeetings.slice(0, 5).map((meeting, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {meeting.studentUid?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <p className="font-semibold">{meeting.studentName || 'Student'}</p>
                        <p className="text-sm text-gray-600">{meeting.time} - {meeting.type} session</p>
                        {meeting.notes && <p className="text-xs text-gray-500">{meeting.notes}</p>}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">View Profile</Button>
                      <Button size="sm" className="bg-blue-700 hover:bg-blue-800">Join Session</Button>
                    </div>
                  </div>
                ))
              ) : (
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
                Pending Student Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.length > 0 ? (
                  pendingRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium">{request.studentData?.name || 'Student'}</p>
                          <p className="text-xs text-gray-600">{request.studentData?.email || 'wants to connect'}</p>
                        </div>
                      </div>
                      <Link href="/coach/requests">
                        <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                          Review
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No pending requests</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Students & Their Scheduled Sessions */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-poppins">View Student Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student List */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-3">Select a Student:</p>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {students.length > 0 ? (
                    students.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          selectedStudent?.id === student.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold text-sm">{student.studentData?.name || 'Student'}</p>
                        <p className="text-xs text-gray-600">{student.studentData?.email}</p>
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No connected students</p>
                  )}
                </div>
              </div>

              {/* Selected Student's Sessions */}
              <div className="lg:col-span-2">
                {selectedStudent ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Selected Student:</p>
                        <p className="font-bold text-lg">{selectedStudent.studentData?.name}</p>
                      </div>
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    {meetingsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                      </div>
                    ) : selectedStudentMeetings.length > 0 ? (
                      <div className="space-y-3">
                        {selectedStudentMeetings.map((meeting, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <p className="font-semibold text-sm">{meeting.date} at {meeting.time}</p>
                              </div>
                              <p className="text-xs text-gray-600 capitalize">
                                {meeting.type} session
                                {meeting.notes && ` • ${meeting.notes.substring(0, 30)}...`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No sessions scheduled with this student</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-center">Select a student to view their scheduled sessions</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
              <Button className="w-full bg-green-600 hover:bg-green-700 py-6" onClick={openScheduleModal}>
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Session
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Meeting Modal */}
        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Select Student</label>
                <select
                  value={selectedStudentForMeeting?.uid || ''}
                  onChange={(e) => {
                    const student = students.find(s => s.studentData.uid === e.target.value)
                    setSelectedStudentForMeeting(student?.studentData)
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.studentData.uid}>
                      {s.studentData?.name || 'Student'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Date</label>
                <Input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Time</label>
                <Input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Session Type</label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                >
                  <option value="batting">Batting</option>
                  <option value="bowling">Bowling</option>
                  <option value="fielding">Fielding</option>
                  <option value="fitness">Fitness</option>
                  <option value="mental">Mental Training</option>
                  <option value="general">General Session</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Add any notes for this session..."
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm"
                  rows="3"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-blue-700 hover:bg-blue-800"
                  onClick={handleScheduleMeeting}
                  disabled={schedulingMeeting}
                >
                  {schedulingMeeting ? 'Scheduling...' : 'Schedule Session'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}