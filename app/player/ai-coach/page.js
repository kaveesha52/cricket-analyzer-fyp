'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { Bell, Send } from 'lucide-react'
import { SidebarNav } from '@/components/SidebarNav'

export default function AICoachPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'coach',
      text: 'Hello! I\'m your AI Coach. I\'ll analyze your cricket performance and provide personalized coaching advice. How can I help you improve today?'
    }
  ])
  const [input, setInput] = useState('')
  const [stats, setStats] = useState(null)
  const [matches, setMatches] = useState([])
  const [suggestedTopics, setSuggestedTopics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  // Fetch player stats on mount
  useEffect(() => {
    if (!user?.uid) return
    fetchPlayerData()
  }, [user])

  const fetchPlayerData = async () => {
    try {
      const [statsRes, matchesRes] = await Promise.all([
        fetch(`/api/stats/player?uid=${user.uid}`),
        fetch(`/api/matches?uid=${user.uid}`)
      ])

      const statsData = await statsRes.json()
      const matchesData = await matchesRes.json()

      setStats(statsData)
      setMatches(matchesData.matches || [])

      // Generate personalized topic suggestions
      const topics = generateTopics(statsData, matchesData.matches || [])
      setSuggestedTopics(topics)

      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching player data:', error)
      setIsLoading(false)
    }
  }

  const generateTopics = (statsData, matchesData) => {
    const topics = []

    if (!statsData) return ['Improve Strike Rate', 'Batting Technique', 'Mental Strength', 'Fitness Training', 'Match Strategy']

    const avg = statsData.battingAverage || 0
    const strikeRate = statsData.strikeRate || 0
    const economy = statsData.economy || 0

    // Identify weak areas
    if (strikeRate < 130) topics.push('Improve Strike Rate')
    if (avg < 40) topics.push('Consistency in Batting')
    if (economy && economy > 7) topics.push('Bowling Control')
    if (matchesData.length < 5) topics.push('Build Match Experience')
    if (!topics.length) topics.push('Advanced Techniques')

    // Add general topics
    if (!topics.includes('Mental Strength')) topics.push('Mental Strength')
    if (!topics.includes('Fitness Training')) topics.push('Fitness Training')

    return topics.slice(0, 5)
  }

  const generateCoachResponse = (userMessage) => {
    if (!stats) return 'Let me analyze your data first. Please wait a moment.'

    const messageLower = userMessage.toLowerCase()
    let response = ''

    // Context-aware responses
    if (
      messageLower.includes('strike rate') ||
      messageLower.includes('aggression') ||
      messageLower.includes('aggressive')
    ) {
      const strikeRate = stats.strikeRate || 0
      if (strikeRate < 120) {
        response = `Your current strike rate is ${strikeRate.toFixed(2)}. To improve, focus on:
        • Playing aggressive shots against loose balls
        • Reducing dot balls in powerplay overs
        • Building momentum with quick singles
        • Practice against fast bowling to build confidence
        
        Work on these areas and you'll see improvement! 💪`
      } else if (strikeRate < 140) {
        response = `Good strike rate at ${strikeRate.toFixed(2)}! Keep improving by:
        • Batting in powerplay overs to maximize boundaries
        • Rotating strike effectively with singles
        • Targeting weaker bowlers strategically
        
        You're on the right track! 🏏`
      } else {
        response = `Excellent strike rate of ${strikeRate.toFixed(2)}! You're performing well. Now focus on:
        • Maintaining consistency in high-pressure matches
        • Converting good starts into big scores
        • Being mentally strong in tough situations
        
        Keep up the great work! 🌟`
      }
    } else if (messageLower.includes('average') || messageLower.includes('consistency')) {
      const avg = stats.battingAverage || 0
      if (avg < 35) {
        response = `Your batting average is ${avg.toFixed(2)}. To improve consistency:
        • Work on technique against different bowling styles
        • Practice leaving deliveries outside off stump
        • Build partnerships and play longer innings
        • Review past dismissals to identify patterns
        
        Consistency comes with practice! 📊`
      } else if (avg < 45) {
        response = `Your batting average of ${avg.toFixed(2)} is decent! Improve further by:
        • Playing more matchful innings
        • Reducing risky shots early in innings
        • Studying opponent bowlers
        • Building mental toughness
        
        You're making progress! 📈`
      } else {
        response = `Great batting average of ${avg.toFixed(2)}! Maintain this by:
        • Staying focused in tough situations
        • Playing according to match situation
        • Keeping fitness levels high
        • Mentoring junior players
        
        You're an excellent performer! 🏆`
      }
    } else if (messageLower.includes('bowling') || messageLower.includes('economy')) {
      const econ = stats.economy || 0
      if (econ > 7.5) {
        response = `Your economy rate is ${econ.toFixed(2)}. To improve:
        • Focus on line and length consistency
        • Use variations like slower balls
        • Study batsman weaknesses before bowling
        • Practice yorkers and slower balls
        
        Tighter bowling = better economy! 🎯`
      } else if (econ > 6) {
        response = `Your economy rate of ${econ.toFixed(2)} is good! Keep improving:
        • Develop more bowling variations
        • Improve yorker accuracy
        • Read match situations better
        • Build game awareness
        
        Keep bowling tight! 💨`
      } else {
        response = `Excellent economy rate of ${econ.toFixed(2)}! Maintain by:
        • Staying disciplined with line and length
        • Keeping variations fresh
        • Analyzing batsman patterns
        • Staying fit and sharp
        
        Outstanding bowling performance! ⚡`
      }
    } else if (messageLower.includes('fitness') || messageLower.includes('training')) {
      response = `Great question about fitness! Here's my recommendation:
      • Do 30 mins cardio 4-5 days a week (running, cycling)
      • Strength training 2-3 days focusing on legs and core
      • Cricket-specific drills: agility, acceleration, reaction
      • Flexibility work: yoga or stretching 15 mins daily
      • Proper warm-up before every session
      
      Fitness is the foundation of performance! 💪`
    } else if (messageLower.includes('mental') || messageLower.includes('pressure') || messageLower.includes('confidence')) {
      response = `Mental strength is crucial in cricket! Here's my advice:
      • Visualization: Imagine successful batting/bowling before the match
      • Breathing exercises: Deep breathing calms nerves
      • Stay in the present: Focus on the current ball, not past mistakes
      • Self-talk: Develop positive mental cues
      • Learn from failures: Each dismissal is a learning opportunity
      
      A strong mind makes a strong cricketer! 🧠`
    } else if (messageLower.includes('strategy') || messageLower.includes('technique')) {
      response = `Match strategy and technique tips:
      • Assess pitch, weather, and opponent before batting
      • Build innings based on match situation
      • Against fast bowlers: Play close to body, use feet
      • Against spinners: Read length, use sweep carefully
      • Rotate strike to keep scoreboard moving
      • Adapt technique based on field placement
      
      Smart cricket beats raw talent! 🎯`
    } else if (messageLower.includes('improve') || messageLower.includes('help')) {
      const avg = stats?.battingAverage || 0
      const strikeRate = stats?.strikeRate || 0

      const weakAreas = []
      if (strikeRate < 130) weakAreas.push('Strike Rate')
      if (avg < 40) weakAreas.push('Consistency')
      if ((stats?.economy || 0) > 7) weakAreas.push('Bowling Economy')

      if (weakAreas.length > 0) {
        response = `Based on your stats, I recommend focusing on: ${weakAreas.join(', ')}\n\n`
      }

      response +=
        `Your current stats:\n` +
        `• Batting Average: ${avg.toFixed(2)}\n` +
        `• Strike Rate: ${strikeRate.toFixed(2)}\n` +
        `• Matches Played: ${matches.length}\n\n` +
        `Focus on consistent practice and smart cricket! 🏏`
    } else {
      // Generic response if no keyword matches
      response =
        `Great question! Here's what I recommend based on your current performance:\n` +
        `• Batting Average: ${stats.battingAverage?.toFixed(2) || 'N/A'}\n` +
        `• Strike Rate: ${stats.strikeRate?.toFixed(2) || 'N/A'}\n` +
        `• Matches: ${matches.length}\n\n` +
        `Keep working hard on your game and ask me anything specific! 💪`
    }

    return response
  }

  const handleSend = async () => {
    if (!input.trim()) return

    setIsSending(true)

    // Add user message
    const userMessage = input
    setMessages((prev) => [...prev, { id: prev.length + 1, type: 'user', text: userMessage }])
    setInput('')

    // Simulate AI response delay
    setTimeout(() => {
      const coachResponse = generateCoachResponse(userMessage)
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          type: 'coach',
          text: coachResponse
        }
      ])
      setIsSending(false)
    }, 800)
  }

  if (loading || isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SidebarNav activePage="AI Coach" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading AI Coach...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <SidebarNav activePage="AI Coach" />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Coach</h1>
            <p className="text-sm text-gray-600">Personalized coaching based on your performance</p>
          </div>
          <Bell className="w-5 h-5 text-gray-600" />
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Suggested Topics Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
            <h3 className="font-bold mb-4 text-gray-900">Quick Topics</h3>
            <div className="space-y-2 flex-1">
              {suggestedTopics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(topic)}
                  className="w-full text-left px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors font-medium"
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="border-t pt-4 space-y-4 mt-4">
              <h3 className="font-bold text-gray-900">Your Stats</h3>
              {stats ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs">Batting Average</p>
                    <p className="text-lg font-bold text-gray-900">{stats.battingAverage?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Strike Rate</p>
                    <p className="text-lg font-bold text-gray-900">{stats.strikeRate?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Economy Rate</p>
                    <p className="text-lg font-bold text-gray-900">{stats.economy?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Matches Played</p>
                    <p className="text-lg font-bold text-gray-900">{matches.length}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No data available. Add some matches first!</p>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-auto p-8 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-lg whitespace-pre-wrap ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg rounded-bl-none">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSend()}
                  placeholder="Ask your AI Coach..."
                  disabled={isSending}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
