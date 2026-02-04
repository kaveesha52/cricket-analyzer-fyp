'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { User, Calendar, Phone, MapPin } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'

export default function CompleteProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    age: '',
    birthday: '',
    gender: '',
    phone: '',
    city: '',
    state: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      })

      toast.success('Profile Completed!', {
        description: 'Welcome to Cricket Analyzer',
      })

      // Check user role and redirect
      const userDoc = await fetch(`/api/user/profile?uid=${user.uid}`)
      const userData = await userDoc.json()
      
      if (userData.user?.role === 'coach') {
        router.push('/coach/dashboard')
      } else {
        router.push('/player/dashboard')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to complete profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <User className="w-8 h-8" />
            <div>
              <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
              <p className="text-blue-100 text-sm">Help us know you better</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age" className="flex items-center gap-2 dark:text-gray-200">
                  <User className="w-4 h-4" />
                  Age
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your age"
                  required
                />
              </div>

              <div>
                <Label htmlFor="birthday" className="flex items-center gap-2 dark:text-gray-200">
                  <Calendar className="w-4 h-4" />
                  Birthday
                </Label>
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="dark:text-gray-200">Gender</Label>
              <RadioGroup 
                value={formData.gender} 
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                className="flex space-x-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="cursor-pointer dark:text-gray-200">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="cursor-pointer dark:text-gray-200">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="cursor-pointer dark:text-gray-200">Other</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 dark:text-gray-200">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="+1 234 567 8900"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="flex items-center gap-2 dark:text-gray-200">
                  <MapPin className="w-4 h-4" />
                  City
                </Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Your city"
                  required
                />
              </div>

              <div>
                <Label htmlFor="state" className="dark:text-gray-200">State/Province</Label>
                <Input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Your state"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-6 text-lg"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
