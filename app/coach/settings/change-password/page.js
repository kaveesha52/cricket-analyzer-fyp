'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/authContext'
import CoachNav from '@/components/CoachNav'
import { Lock, Eye, EyeOff, CheckCircle, Bell } from 'lucide-react'
import { toast } from 'sonner'

export default function ChangePasswordPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [isLoadingPage, setIsLoadingPage] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState('weak')

  useEffect(() => {
    if (!user?.uid) return
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/user/profile?uid=${user.uid}`)
      const data = await res.json()
      setProfile(data.user)
      setIsLoadingPage(false)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setIsLoadingPage(false)
    }
  }

  const calculatePasswordStrength = (password) => {
    let strength = 'weak'
    if (password.length >= 8) {
      if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
        strength = 'strong'
      } else if (/[A-Z]/.test(password) || /[0-9]/.test(password)) {
        strength = 'medium'
      }
    }
    setPasswordStrength(strength)
  }

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(uppercase|[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    if (!/[!@#$%^&*()]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)'
    }
    return null
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (!currentPassword) {
      toast.error('Current password is required')
      return
    }
    
    if (!newPassword) {
      toast.error('New password is required')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password')
      return
    }
    
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    setSubmitting(true)

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)

      toast.success('Password Changed Successfully!', {
        description: 'Your password has been updated securely.',
        duration: 4000,
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStrength('weak')

      setTimeout(() => {
        router.push('/coach/profile')
      }, 2000)
    } catch (error) {
      console.error('Error changing password:', error)
      
      if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect Current Password', {
          description: 'The current password you entered is incorrect.',
        })
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password Too Weak', {
          description: 'Please use a stronger password.',
        })
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Please Log In Again', {
          description: 'For security, please sign out and sign in again before changing your password.',
        })
      } else {
        toast.error('Failed to Change Password', {
          description: error.message,
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      default:
        return 'text-red-600'
    }
  }

  const getStrengthBar = () => {
    switch (passwordStrength) {
      case 'strong':
        return 'bg-green-600'
      case 'medium':
        return 'bg-yellow-600'
      default:
        return 'bg-red-600'
    }
  }

  if (authLoading || isLoadingPage) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <CoachNav />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600">Manage your account security and profile</p>
          </div>
          <Bell className="w-5 h-5 text-gray-600 cursor-pointer hover:text-gray-900" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Change Password Section */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">We need your current password to verify your identity</p>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        calculatePasswordStrength(e.target.value)
                      }}
                      placeholder="Enter your new password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">Password Strength:</span>
                        <span className={`text-xs font-bold ${getStrengthColor()}`}>
                          {passwordStrength.toUpperCase()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getStrengthBar()} transition-all duration-300`}
                          style={{
                            width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%'
                          }}
                        ></div>
                      </div>
                      <div className="mt-3 text-xs text-gray-700 space-y-1">
                        <p className={newPassword.length >= 8 ? 'text-green-700 font-semibold' : ''}>
                          {newPassword.length >= 8 ? '✓' : '✗'} At least 8 characters
                        </p>
                        <p className={/[A-Z]/.test(newPassword) ? 'text-green-700 font-semibold' : ''}>
                          {/[A-Z]/.test(newPassword) ? '✓' : '✗'} One uppercase letter
                        </p>
                        <p className={/[0-9]/.test(newPassword) ? 'text-green-700 font-semibold' : ''}>
                          {/[0-9]/.test(newPassword) ? '✓' : '✗'} One number
                        </p>
                        <p className={/[!@#$%^&*()]/.test(newPassword) ? 'text-green-700 font-semibold' : ''}>
                          {/[!@#$%^&*()]/.test(newPassword) ? '✓' : '✗'} One special character
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && confirmPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      {newPassword === confirmPassword ? (
                        <div className="flex items-center text-green-700 text-sm font-semibold">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Passwords match
                        </div>
                      ) : (
                        <div className="text-red-600 text-sm font-semibold">
                          ✗ Passwords do not match
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
                    className="flex-1 px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Updating Password...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/coach/profile')}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Security Tips */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔒</span> Security Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Use a unique password that you don't use on other websites</li>
                <li>• Include a mix of uppercase and lowercase letters</li>
                <li>• Add numbers and special characters for extra security</li>
                <li>• Avoid using personal information like names or dates</li>
                <li>• Change your password every 3-6 months for better security</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
