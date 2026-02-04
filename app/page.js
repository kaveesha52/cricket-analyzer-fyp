'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { Button } from '@/components/ui/button'
import { BarChart3, Target, Trophy, Menu } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      // Redirect to appropriate dashboard based on user role
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.user?.role === 'coach') {
            router.push('/coach/dashboard')
          } else {
            router.push('/player/dashboard')
          }
        })
        .catch(() => {})
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-poppins font-bold text-gray-900">Cricket Analyzer</span>
            </div>
            <div className="hidden md:block">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-blue-600 hover:text-blue-700">Login</Button>
              </Link>
            </div>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="w-full text-blue-600">Login</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
            🏏 AI-Powered Cricket Analytics
          </div>
          <h1 className="text-5xl md:text-7xl font-poppins font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-6 leading-tight">
            Track Your Cricket Performance with AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Log matches, analyze stats, get AI coaching advice, and improve your game
          </p>
          
          {/* Hero Image */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent z-10"></div>
              <img
                src="https://images.unsplash.com/photo-1644984785609-676ed703333e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxjcmlja2V0fGVufDB8fHxibHVlfDE3Njk5NjUzMzB8MA&ixlib=rb-4.1.0&q=85"
                alt="Cricket Action"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-poppins font-bold mb-3 text-gray-900">Advanced Analytics</h3>
              <p className="text-gray-600 leading-relaxed">Track your performance with detailed charts and insights across all formats</p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-poppins font-bold mb-3 text-gray-900">AI Coaching</h3>
              <p className="text-gray-600 leading-relaxed">Get personalized coaching advice powered by artificial intelligence</p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-orange-200 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-poppins font-bold mb-3 text-gray-900">Track Progress</h3>
              <p className="text-gray-600 leading-relaxed">Monitor your improvement over time with comprehensive match history</p>
            </div>
          </div>

          <Link href="/auth/register">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-7 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              Get Started - It's Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 Cricket Analyzer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}