'use client'

import { useAuth } from '@/lib/authContext'
import { useRouter } from 'next/navigation'
import { Trophy, BarChart3, Plus, BarChart2, Users, Award, User, LogOut } from 'lucide-react'
import Link from 'next/link'

export function SidebarNav({ activePage = 'Dashboard' }) {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-gray-900">Cricket Analyzer</span>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 flex-1">
        <NavItem
          icon={<BarChart3 className="w-5 h-5" />}
          label="Dashboard"
          active={activePage === 'Dashboard'}
          href="/player/dashboard"
        />
        <NavItem
          icon={<Plus className="w-5 h-5" />}
          label="Add Match"
          active={activePage === 'Add Match'}
          href="/player/add-match"
        />
        <NavItem
          icon={<BarChart2 className="w-5 h-5" />}
          label="Analytics"
          active={activePage === 'Analytics'}
          href="/player/analytics"
        />
        <NavItem
          icon={<Users className="w-5 h-5" />}
          label="AI Coach"
          active={activePage === 'AI Coach'}
          href="/player/ai-coach"
        />
        <NavItem
          icon={<Users className="w-5 h-5" />}
          label="Community"
          active={activePage === 'Community'}
          href="/player/community"
        />
        <NavItem
          icon={<Award className="w-5 h-5" />}
          label="Highlights"
          active={activePage === 'Highlights'}
          href="/player/career-highlights"
        />
        <NavItem
          icon={<User className="w-5 h-5" />}
          label="Profile"
          active={activePage === 'Profile'}
          href="/player/profile"
        />
      </nav>

      {/* Logout */}
      <div className="border-t pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>

      {/* Avatar Section at Bottom */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
            {user?.name ? user.name.split(' ')[0][0].toUpperCase() : (user?.email?.[0].toUpperCase() || 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name?.split(' ')[0]}</p>
            <p className="text-xs text-gray-500 truncate">Cricket Player</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active = false, href = '#' }) {
  return (
    <Link href={href}>
      <button
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        {icon}
        <span className="text-sm">{label}</span>
      </button>
    </Link>
  )
}
