'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/authContext'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import PlayerNav from '@/components/PlayerNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Camera, Trophy, Star, Medal, LogOut } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileImage, setProfileImage] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedPhone, setEditedPhone] = useState('')
  const [editedCity, setEditedCity] = useState('')
  const [editedState, setEditedState] = useState('')
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false
  })

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result)
        toast.success('Profile photo updated!')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editedName,
        phone: editedPhone,
        city: editedCity,
        state: editedState,
        updatedAt: new Date().toISOString()
      })
      
      setProfile({ 
        ...profile, 
        name: editedName,
        phone: editedPhone,
        city: editedCity,
        state: editedState
      })
      setEditMode(false)
      
      toast.success('Profile Updated!', {
        description: 'Your profile has been successfully updated.',
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        fetch(`/api/user/profile?uid=${user.uid}`),
        fetch(`/api/stats/player?uid=${user.uid}`)
      ])

      const profileData = await profileRes.json()
      const statsData = await statsRes.json()

      setProfile(profileData.user)
      setEditedName(profileData.user?.name || '')
      setEditedPhone(profileData.user?.phone || '')
      setEditedCity(profileData.user?.city || '')
      setEditedState(profileData.user?.state || '')
      setStats(statsData.stats)
    } catch (error) {
      console.error('Error fetching data:', error)
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PlayerNav />
      
      <main className="md:ml-64 mt-16 p-6 pb-20 md:pb-6">
        <h1 className="text-3xl font-poppins font-bold text-gray-900 mb-6">Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg">
              <CardContent className="pt-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-32 h-32 mx-auto">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-blue-500 text-white text-4xl">
                        {profile?.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg cursor-pointer">
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile?.name || 'Player'}</h2>
                <p className="text-gray-600 mb-4">{profile?.email}</p>
                
                {editMode ? (
                  <div className="mb-4 space-y-4">
                    <div>
                      <Label className="text-sm dark:text-gray-300">Name</Label>
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter your name"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm dark:text-gray-300">Age (Cannot be changed)</Label>
                      <Input
                        value={profile?.age || 'Not set'}
                        disabled
                        className="bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm dark:text-gray-300">Birthday (Cannot be changed)</Label>
                      <Input
                        value={profile?.birthday || 'Not set'}
                        disabled
                        className="bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm dark:text-gray-300">Gender (Cannot be changed)</Label>
                      <Input
                        value={profile?.gender || 'Not set'}
                        disabled
                        className="bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 capitalize"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm dark:text-gray-300">Phone Number</Label>
                      <Input
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm dark:text-gray-300">City</Label>
                      <Input
                        value={editedCity}
                        onChange={(e) => setEditedCity(e.target.value)}
                        placeholder="Enter city"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm dark:text-gray-300">State/Province</Label>
                      <Input
                        value={editedState}
                        onChange={(e) => setEditedState(e.target.value)}
                        placeholder="Enter state"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSaveProfile} className="flex-1 bg-green-600 hover:bg-green-700">
                        Save Changes
                      </Button>
                      <Button onClick={() => setEditMode(false)} variant="outline" className="flex-1 dark:border-gray-600 dark:text-gray-300">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full mb-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </Button>
                )}

                <div className="mt-6 pt-6 border-t text-left space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Career Statistics</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Batting Average</p>
                      <p className="text-lg font-bold">{stats?.battingAverage || '0.00'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Strike Rate</p>
                      <p className="text-lg font-bold">{stats?.strikeRate || '0.00'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Medal className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Matches</p>
                      <p className="text-lg font-bold">{stats?.totalMatches || 0}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 pt-4 border-t">
                    Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Career Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
                    <Trophy className="w-12 h-12 text-white mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold">First Century</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg">
                    <Star className="w-12 h-12 text-white mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold">50 Matches</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg">
                    <Medal className="w-12 h-12 text-white mx-auto mb-2" />
                    <p className="text-white text-sm font-semibold">5-Wicket Haul</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Performance Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <div className="w-3 h-3 bg-blue-600 rounded-full mt-1"></div>
                      <div className="flex-1">
                        <p className="font-semibold">Month {i + 1}</p>
                        <p className="text-sm text-gray-600">Batting Avg: {(Math.random() * 50 + 20).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => {
                      setSettings({ ...settings, emailNotifications: checked })
                      toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled')
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <Switch
                    id="push-notifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => {
                      setSettings({ ...settings, pushNotifications: checked })
                      toast.success(checked ? 'Push notifications enabled' : 'Push notifications disabled')
                    }}
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