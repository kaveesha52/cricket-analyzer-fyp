'use client'

import { useAuth } from '@/lib/authContext'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Plus, BarChart3, Bot, Users, User, LogOut } from 'lucide-react'
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
      <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white h-16 flex items-center px-6 fixed top-0 w-full z-50 shadow-lg backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-blue-700 font-bold text-lg">CA</span>
          </div>
          <span className="text-xl font-poppins font-bold hidden md:block">Cricket Analyzer</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarFallback className="bg-blue-500">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/player/profile" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/player/dashboard" className="cursor-pointer">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Side Navigation */}
      <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-gray-100 border-r border-gray-200 overflow-y-auto hidden md:block">
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white border-l-4 border-blue-800'
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
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex justify-around py-2">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex flex-col items-center p-2 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
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