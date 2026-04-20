'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/authContext'
import CoachNav from '@/components/CoachNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Search, TrendingUp, TrendingDown, Star, Calendar, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function MyStudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentStats, setStudentStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [meetingType, setMeetingType] = useState('batting')
  const [meetingNotes, setMeetingNotes] = useState('')
  const [schedulingMeeting, setSchedulingMeeting] = useState(false)
  const [scheduledMeetings, setScheduledMeetings] = useState([])
  const [meetingsLoading, setMeetingsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchStudents()
    }
  }, [user])

  const handleSelectStudent = (student) => {
    setSelectedStudent(student)
    fetchStudentStats(student.studentData.uid)
    fetchScheduledMeetings(student.studentData.uid)
  }

  const fetchScheduledMeetings = async (studentUid) => {
    setMeetingsLoading(true)
    try {
      const response = await fetch(`/api/coach/meetings?coachUid=${user.uid}&studentUid=${studentUid}`)
      const data = await response.json()
      setScheduledMeetings(data.meetings || [])
    } catch (error) {
      console.error('Error fetching scheduled meetings:', error)
    } finally {
      setMeetingsLoading(false)
    }
  }

  const fetchStudentStats = async (studentUid) => {
    setStatsLoading(true)
    try {
      const response = await fetch(`/api/stats/player?uid=${studentUid}`)
      const data = await response.json()
      setStudentStats(data.stats)
    } catch (error) {
      console.error('Error fetching student stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleScheduleMeeting = async () => {
    if (!meetingDate || !meetingTime) {
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
          studentUid: selectedStudent.studentData.uid,
          date: meetingDate,
          time: meetingTime,
          type: meetingType,
          notes: meetingNotes
        })
      })

      if (response.ok) {
        toast.success(`Session scheduled successfully! Your student has been notified.`)
        setShowScheduleModal(false)
        setMeetingDate('')
        setMeetingTime('')
        setMeetingType('batting')
        setMeetingNotes('')
        // Refresh meetings
        await fetchScheduledMeetings(selectedStudent.studentData.uid)
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

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/coach/students?coachUid=${user.uid}`)
      const data = await response.json()
      setStudents(data.students || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.studentData?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
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
        <h1 className="text-3xl font-poppins font-bold text-gray-900 mb-6">My Students</h1>
        
        {/* Search Bar */}
        <Card className="shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search students by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Student Cards */}
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredStudents.map((student) => (
              <Card 
                key={student.id} 
                className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => handleSelectStudent(student)}
              >
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-2xl">
                      {student.studentData?.name?.[0] || 'S'}
                    </div>
                    <h3 className="font-semibold text-lg">{student.studentData?.name || 'Student'}</h3>
                    <p className="text-sm text-gray-600">Student since {new Date(student.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Batting Avg</span>
                      <span className="font-semibold">35.2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Strike Rate</span>
                      <span className="font-semibold">125.5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Match</span>
                      <span className="font-semibold">2 days ago</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-1 mb-3">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">+15%</span>
                  </div>

                  <Button className="w-full bg-blue-700 hover:bg-blue-800" size="sm">
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Students Found</h3>
              <p className="text-gray-600">Start building your coaching roster</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Student Profile</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-20 h-20 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {selectedStudent.studentData?.name?.[0] || 'S'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedStudent.studentData?.name || 'Student'}</h3>
                    <p className="text-gray-600">{selectedStudent.studentData?.email}</p>
                    <p className="text-sm text-gray-500">Member since {new Date(selectedStudent.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-600">Batting Average</p>
                      <p className="text-2xl font-bold text-blue-700">{statsLoading ? '...' : (studentStats?.battingAverage || '0')}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-600">Strike Rate</p>
                      <p className="text-2xl font-bold text-green-600">{statsLoading ? '...' : (studentStats?.strikeRate || '0')}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-600">Total Matches</p>
                      <p className="text-2xl font-bold text-orange-600">{statsLoading ? '...' : (studentStats?.totalMatches || '0')}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Goals</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Increase batting avg to 40</span>
                        <span className="text-sm font-semibold">75%</span>
                      </div>
                      <Progress value={75} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Improve strike rate to 135</span>
                        <span className="text-sm font-semibold">60%</span>
                      </div>
                      <Progress value={60} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-semibold">Batting Average</p>
                          <p className="text-sm text-gray-600">Before: 25.5 → Current: 35.2</p>
                        </div>
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="w-5 h-5 mr-1" />
                          <span className="font-bold">+35%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-semibold">Strike Rate</p>
                          <p className="text-sm text-gray-600">Before: 110.2 → Current: 125.5</p>
                        </div>
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="w-5 h-5 mr-1" />
                          <span className="font-bold">+18%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-semibold">First Century Under Coaching</p>
                          <p className="text-sm text-gray-600">Achieved on Jan 15, 2025</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-semibold">Economy Improved 50%</p>
                          <p className="text-sm text-gray-600">Achieved on Jan 10, 2025</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="communication" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Scheduled Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {meetingsLoading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
                      </div>
                    ) : scheduledMeetings.length > 0 ? (
                      scheduledMeetings.map((meeting, idx) => (
                        <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-sm capitalize">{meeting.date} at {meeting.time}</p>
                              <p className="text-xs text-gray-600 capitalize mt-1">{meeting.type} Session</p>
                            </div>
                            <Clock className="w-4 h-4 text-blue-600" />
                          </div>
                          {meeting.notes && (
                            <p className="text-sm text-gray-700 mt-2">{meeting.notes}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center">
                        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No sessions scheduled yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button 
                  className="w-full bg-blue-700 hover:bg-blue-800"
                  onClick={() => setShowScheduleModal(true)}
                >
                  Schedule New Session
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Session with {selectedStudent?.studentData?.name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Date</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Time</label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Session Type</label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="batting">Batting</option>
                  <option value="bowling">Bowling</option>
                  <option value="fielding">Fielding</option>
                  <option value="fitness">Fitness</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Notes (Optional)</label>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Add any notes for the session..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-gray-200 text-gray-900 hover:bg-gray-300"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={schedulingMeeting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-700 hover:bg-blue-800"
                  onClick={handleScheduleMeeting}
                  disabled={schedulingMeeting}
                >
                  {schedulingMeeting ? 'Scheduling...' : 'Schedule Session'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}