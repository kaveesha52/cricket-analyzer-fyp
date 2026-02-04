'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/authContext'
import PlayerNav from '@/components/PlayerNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, Loader2, BarChart3 } from 'lucide-react'

export default function AICoachPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/stats/player?uid=${user.uid}`)
      const data = await res.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          uid: user.uid,
          chatHistory: updatedMessages.slice(-10) // Send last 10 messages for context
        })
      })

      const data = await response.json()
      const aiMessage = { role: 'ai', content: data.response }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const suggestedPrompts = [
    "Analyze my batting performance",
    "How can I improve my bowling?",
    "Compare my T20 and ODI stats",
    "What training should I focus on?"
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <PlayerNav />
      
      <main className="md:ml-64 mt-16 p-6 pb-20 md:pb-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center mb-6">
            <Bot className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-poppins font-bold text-gray-900">AI Cricket Coach</h1>
              <p className="text-gray-600">Get personalized coaching advice powered by AI</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-3">
              <Card className="shadow-lg h-[600px] flex flex-col">
                <CardHeader className="bg-blue-600 text-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-white">AI Cricket Coach</CardTitle>
                      <p className="text-sm text-blue-100 flex items-center">
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                        Online
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <Bot className="w-20 h-20 text-blue-600 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Start Your Coaching Session!</h3>
                      <p className="text-gray-600 mb-6">Ask me anything about your cricket performance</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {suggestedPrompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => setInput(prompt)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {message.role === 'ai' && (
                            <div className="flex items-center space-x-2 mb-2">
                              <Bot className="w-4 h-4" />
                              <span className="text-xs font-semibold">AI Coach</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">AI Coach is analyzing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>

                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask your AI coach anything about cricket..."
                      className="flex-1"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={loading || !input.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">AI-generated cricket coaching advice - consult professional coach for personalized training</p>
                </div>
              </Card>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Batting Average</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.battingAverage}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Strike Rate</p>
                        <p className="text-2xl font-bold text-green-600">{stats.strikeRate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bowling Economy</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.bowlingEconomy}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Matches</p>
                        <p className="text-2xl font-bold text-purple-600">{stats.totalMatches}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">Loading stats...</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Suggested Topics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(prompt)}
                      className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
