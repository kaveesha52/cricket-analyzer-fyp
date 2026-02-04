'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/authContext'
import { useRouter } from 'next/navigation'
import CoachNav from '@/components/CoachNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Camera, Award, Star, LogOut, Upload } from 'lucide-react'

export default function CoachProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileImage, setProfileImage] = useState(null)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    visible: true
  })
  const [editMode, setEditMode] = useState(false)

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user/profile?uid=${user.uid}`)
      const data = await response.json()
      setProfile(data.user)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav />
      
      <main className="md:ml-64 mt-16 p-6 pb-20 md:pb-6">
        <h1 className="text-3xl font-poppins font-bold text-gray-900 mb-6">Coach Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-32 h-32 mx-auto">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-blue-700 text-white text-4xl">
                        {profile?.name?.[0]?.toUpperCase() || 'C'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label htmlFor="coach-profile-upload" className="absolute bottom-0 right-0 bg-blue-700 hover:bg-blue-800 text-white p-2 rounded-full shadow-lg cursor-pointer">
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="coach-profile-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile?.name || 'Coach'}</h2>
                <p className="text-gray-600 mb-2">{profile?.email}</p>
                <div className="flex justify-center items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">(4.8)</span>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mb-2"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </Button>

                <div className="mt-6 pt-6 border-t text-left space-y-3">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-blue-700" />
                    <div>
                      <p className="text-sm text-gray-600">Years Coaching</p>
                      <p className="font-semibold">5 years</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Students Coached</p>
                      <p className="font-semibold">50+</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 pt-3 border-t">
                    Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    defaultValue={profile?.name || ''} 
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    defaultValue={profile?.email || ''} 
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio / Coaching Philosophy</Label>
                  <Textarea 
                    id="bio" 
                    rows={4}
                    placeholder="Share your coaching philosophy and experience..." 
                    disabled={!editMode}
                    defaultValue="Experienced cricket coach specializing in batting techniques and mental coaching. Passionate about developing young talent and helping players reach their full potential."
                  />
                </div>
                {editMode && (
                  <Button className="bg-blue-700 hover:bg-blue-800">
                    Save Changes
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Specializations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['Batting', 'Bowling', 'Fielding', 'Mental Coaching', 'Fitness'].map((spec) => (
                    <span key={spec} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {spec}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Award className="w-8 h-8 text-blue-700" />
                    <div>
                      <p className="font-semibold">ICC Level 2 Coaching</p>
                      <p className="text-sm text-gray-600">Issued: 2020</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Certification
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Maximum Students</Label>
                  <Input type="number" defaultValue="20" disabled={!editMode} />
                </div>
                <div>
                  <Label>Session Types Offered</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['1-on-1', 'Group', 'Video', 'In-person'].map((type) => (
                      <span key={type} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notif">Email Notifications</Label>
                  <Switch
                    id="email-notif"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notif">Push Notifications</Label>
                  <Switch
                    id="push-notif"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="visible">Profile Visibility (Public)</Label>
                  <Switch
                    id="visible"
                    checked={settings.visible}
                    onCheckedChange={(checked) => setSettings({ ...settings, visible: checked })}
                  />
                </div>
                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full mb-2">
                    Change Password
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}