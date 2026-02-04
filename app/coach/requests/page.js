'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/authContext'
import CoachNav from '@/components/CoachNav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'

export default function CoachRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user])

  const fetchRequests = async () => {
    try {
      const connectionsRef = collection(db, 'connections')
      const q = query(connectionsRef, where('coachUid', '==', user.uid), where('status', '==', 'pending'))
      const snapshot = await getDocs(q)
      
      const requestsList = []
      for (const docSnap of snapshot.docs) {
        const connection = docSnap.data()
        // Get student info
        const studentDoc = await getDoc(doc(db, 'users', connection.studentUid))
        if (studentDoc.exists()) {
          requestsList.push({
            id: docSnap.id,
            ...connection,
            studentData: { uid: connection.studentUid, ...studentDoc.data() }
          })
        }
      }
      
      setRequests(requestsList)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requestId) => {
    try {
      await updateDoc(doc(db, 'connections', requestId), {
        status: 'accepted',
        updatedAt: new Date().toISOString()
      })
      
      toast.success('Request Accepted!', {
        description: 'Student added to your roster.',
        duration: 3000,
      })
      
      fetchRequests()
    } catch (error) {
      console.error('Error accepting request:', error)
      toast.error('Failed to accept request')
    }
  }

  const handleReject = async (requestId) => {
    try {
      await updateDoc(doc(db, 'connections', requestId), {
        status: 'rejected',
        updatedAt: new Date().toISOString()
      })
      
      toast.success('Request Rejected', {
        description: 'The request has been declined.',
        duration: 3000,
      })
      
      fetchRequests()
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Failed to reject request')
    }
  }

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
        <h1 className="text-3xl font-poppins font-bold text-gray-900 mb-6">Connection Requests</h1>
        
        {requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-blue-600 text-white text-xl">
                          {request.studentData?.name?.[0] || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{request.studentData?.name || 'Student'}</h3>
                        <p className="text-sm text-gray-600">{request.studentData?.email}</p>
                        <p className="text-sm text-gray-500 mt-2">{request.message}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleAccept(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleReject(request.id)}
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Requests</h3>
              <p className="text-gray-600">You're all caught up! New requests will appear here.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
