'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { Bell, Settings, LogOut, Edit2, Check, X, Upload } from 'lucide-react'
import { SidebarNav } from '@/components/SidebarNav'
import { toast } from 'sonner'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedPhone, setEditedPhone] = useState('')
  const [editedCity, setEditedCity] = useState('')
  const [editedState, setEditedState] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (!user?.uid) return
    fetchProfileData()
  }, [user])

  const fetchProfileData = async () => {
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
      
      // Load saved profile image from Firestore if it exists
      if (profileData.user?.profileImage) {
        setProfileImage(profileData.user.profileImage)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching profile data:', error)
      toast.error('Failed to load profile')
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setIsSaving(true)
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
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      setUploadingImage(true)
      try {
        const storage = getStorage()
        const storageRef = ref(storage, `profile-images/${user.uid}/${file.name}`)
        
        // Upload file to Firebase Storage
        await uploadBytes(storageRef, file)
        
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef)
        
        // Save URL to Firestore
        await updateDoc(doc(db, 'users', user.uid), {
          profileImage: downloadURL,
          updatedAt: new Date().toISOString()
        })
        
        // Update local state with preview
        const reader = new FileReader()
        reader.onloadend = () => {
          setProfileImage(reader.result)
        }
        reader.readAsDataURL(file)
        
        toast.success('Profile photo updated successfully!')
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error('Failed to upload profile photo')
      } finally {
        setUploadingImage(false)
      }
    }
  }

  const getUserInitials = () => {
    // Get from profile name if available
    if (profile?.name) {
      const firstName = profile.name.trim().split(' ')[0]
      if (firstName) return firstName[0].toUpperCase()
    }
    // Fallback to user email first letter
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarNav activePage="Profile" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <SidebarNav activePage="Profile" />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-600">Manage your personal information and preferences</p>
          </div>
          <Bell className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-900" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Profile Header Card with Photo Upload */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-white relative">
              <div className="flex items-start justify-between gap-8">
                <div className="flex items-center gap-6 flex-1">
                  {/* Avatar with Photo Upload */}
                  <div className="relative group flex-shrink-0">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-white flex items-center justify-center text-2xl font-bold text-blue-600 overflow-hidden">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        getUserInitials()
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload className="w-6 h-6 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{profile?.name || 'Player'}</h2>
                    <p className="text-lg text-blue-100">{profile?.email}</p>
                    <p className="text-sm mt-2">{profile?.roleDescription || 'Cricket Player'}</p>
                    {profile?.city && profile?.state && (
                      <p className="text-sm mt-2">{profile.city}, {profile.state}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => (isEditing ? setIsEditing(false) : setIsEditing(true))}
                  className="px-4 py-2 bg-white text-blue-600 hover:bg-gray-100 rounded-lg transition-colors font-medium flex items-center gap-2 flex-shrink-0"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <p className="text-gray-600 text-sm mb-2">Total Matches</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalMatches || 0}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-6 shadow-sm border border-blue-200 hover:shadow-md transition-shadow">
                <p className="text-gray-600 text-sm mb-2">Batting Average</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.battingAverage || '0.00'}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-6 shadow-sm border border-green-200 hover:shadow-md transition-shadow">
                <p className="text-gray-600 text-sm mb-2">Strike Rate</p>
                <p className="text-3xl font-bold text-green-600">{stats?.strikeRate || '0.00'}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-6 shadow-sm border border-orange-200 hover:shadow-md transition-shadow">
                <p className="text-gray-600 text-sm mb-2">Economy Rate</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.bowlingEconomy || '0.00'}</p>
              </div>
            </div>

            {/* Edit Profile Form */}
            {isEditing && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 text-gray-900">Edit Profile Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={editedPhone}
                      onChange={(e) => setEditedPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={editedCity}
                      onChange={(e) => setEditedCity(e.target.value)}
                      placeholder="Enter your city"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                    <input
                      type="text"
                      value={editedState}
                      onChange={(e) => setEditedState(e.target.value)}
                      placeholder="Enter state or province"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditedName(profile?.name || '')
                      setEditedPhone(profile?.phone || '')
                      setEditedCity(profile?.city || '')
                      setEditedState(profile?.state || '')
                    }}
                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Settings Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">Settings & Preferences</h3>
              </div>

              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <label className="text-gray-700 font-medium">Email Notifications</label>
                    <p className="text-sm text-gray-600">Receive match updates and alerts via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => {
                      setEmailNotifications(e.target.checked)
                      toast.success(e.target.checked ? 'Email notifications enabled' : 'Email notifications disabled')
                    }}
                    className="w-5 h-5 rounded cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Change Password Button */}
                <button
                  onClick={() => router.push('/player/settings/change-password')}
                  className="w-full px-4 py-3 text-left font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  🔐 Change Password
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 text-left font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>

            {/* Account Info Footer */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center text-sm text-gray-600">
              <p>
                Account joined on{' '}
                <span className="font-semibold text-gray-900">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Recently'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}