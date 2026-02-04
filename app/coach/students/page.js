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
import { Search, TrendingUp, TrendingDown, Star, Calendar } from 'lucide-react'

export default function MyStudentsPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      fetchStudents()
    }
  }, [user])

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
                onClick={() => setSelectedStudent(student)}
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
                      <p className="text-2xl font-bold text-blue-700">35.2</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-600">Strike Rate</p>
                      <p className="text-2xl font-bold text-green-600">125.5</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm text-gray-600">Total Matches</p>
                      <p className="text-2xl font-bold text-orange-600">24</p>
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
                    <CardTitle className="text-lg">Session Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sm">Jan 20, 2025 - Batting Session</p>
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-700">Worked on footwork. Showed great improvement in playing spin bowling. Needs to focus on shot selection.</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sm">Jan 15, 2025 - Bowling Session</p>
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-700">Line and length practice. Good control with slower balls. Homework: rhythm drills.</p>
                    </div>
                  </CardContent>
                </Card>

                <Button className="w-full bg-blue-700 hover:bg-blue-800">
                  Schedule New Session
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}