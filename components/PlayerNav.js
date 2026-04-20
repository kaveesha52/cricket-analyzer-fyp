'use client'

import { useAuth } from '@/lib/authContext'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Plus, BarChart3, Bot, Users, User, LogOut, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

export default function PlayerNav() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/player/dashboard' },
    { icon: Plus, label: 'Add Match', path: '/player/add-match' },
    { icon: BarChart3, label: 'Analytics', path: '/player/analytics' },
    { icon: Award, label: 'Find Coaches', path: '/player/find-coaches' },
    { icon: Bot, label: 'AI Coach', path: '/player/ai-coach' },
    { icon: Users, label: 'Community', path: '/player/community' },
    { icon: User, label: 'Profile', path: '/player/profile' }
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <>
      {/* Top Navigation */}
      <nav className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white h-16 flex items-center px-6 fixed top-0 w-full z-50 shadow-2xl backdrop-blur-md bg-opacity-95">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold text-xl">🏏</span>
          </div>
          <span className="text-2xl font-poppins font-bold hidden md:block drop-shadow-lg">Cricket Analyzer</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer group">
                <Avatar className="ring-2 ring-white/30 hover:ring-white/60 transition-all duration-300 hover:scale-110 shadow-xl">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-2 shadow-2xl border-0 bg-white/95 backdrop-blur-md">
              <DropdownMenuLabel className="flex items-center gap-3 py-4">
                <Avatar className="w-12 h-12 ring-2 ring-blue-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                    {user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-gray-800">My Account</div>
                  <div className="text-xs text-gray-500 font-normal">{user?.email}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/player/profile" className="cursor-pointer flex items-center gap-3 py-3 hover:bg-blue-50 transition-colors">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">Profile</div>
                    <div className="text-xs text-gray-500">View and edit profile</div>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/player/dashboard" className="cursor-pointer flex items-center gap-3 py-3 hover:bg-green-50 transition-colors">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Home className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">Dashboard</div>
                    <div className="text-xs text-gray-500">View your stats</div>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer flex items-center gap-3 py-3 hover:bg-red-50 transition-colors text-red-600 font-semibold">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>Logout</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Side Navigation */}
      <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto hidden md:block shadow-xl">
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center space-x-3 px-4 py-4 rounded-xl cursor-pointer transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:shadow-md'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-white/50'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">{item.label}</span>
                </div>
              </Link>
            )
          })}
          
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-4 py-4 rounded-xl cursor-pointer transition-all duration-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 w-full mt-6 hover:shadow-md group"
          >
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-all">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-semibold">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden z-50 shadow-2xl backdrop-blur-md bg-opacity-95">
        <div className="flex justify-around py-2">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex flex-col items-center p-2 transition-all duration-300 ${
                  isActive ? 'text-blue-600 scale-110' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs mt-1 font-medium">{item.label.split(' ')[0]}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}