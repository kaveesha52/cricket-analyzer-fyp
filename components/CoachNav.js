'use client'

import { useAuth } from '@/lib/authContext'
import { useRouter, usePathname } from 'next/navigation'
import { Users, User, LogOut, Award, Home, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CoachNav() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/coach/dashboard' },
    { icon: Users, label: 'My Students', path: '/coach/students' },
    { icon: Mail, label: 'Requests', path: '/coach/requests' },
    { icon: User, label: 'Profile', path: '/coach/profile' }
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <>
      {/* Top Navigation */}
      <nav className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white h-16 flex items-center px-6 fixed top-0 w-full z-50 shadow-lg backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center space-x-3 flex-1">
          <Award className="w-8 h-8" />
          <span className="text-xl font-poppins font-bold">Coach Portal</span>
        </div>
      </nav>

      {/* Side Navigation */}
      <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-gray-100 border-r border-gray-200 overflow-y-auto hidden md:flex md:flex-col">
        <nav className="p-4 space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-700 text-white border-l-4 border-blue-900'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            )
          })}
          
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all text-red-600 hover:bg-red-50 w-full mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>

        {/* Avatar at Bottom */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {user?.name ? user.name.split(' ')[0][0].toUpperCase() : (user?.email?.[0].toUpperCase() || 'C')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name?.split(' ')[0]}</p>
              <p className="text-xs text-gray-500 truncate">Cricket Coach</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex justify-around py-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex flex-col items-center p-2 ${
                  isActive ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  <Icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.label.split(' ')[0]}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}