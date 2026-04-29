'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import { Bell, Send, RotateCcw, Trash2 } from 'lucide-react'
import { SidebarNav } from '@/components/SidebarNav'
import { toast } from 'sonner'

export default function AICoachPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // Helper to generate unique message IDs
  const generateMessageId = () => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  const [messages, setMessages] = useState([
    {
      id: `msg-initial-${Math.random().toString(36).substr(2, 9)}`,
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
  const [currentChatId, setCurrentChatId] = useState(null)
  const [chatList, setChatList] = useState([])
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [renamingChatId, setRenamingChatId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  // Fetch player stats and chat history on mount
  useEffect(() => {
    if (!user?.uid) return
    const initializeData = async () => {
      await fetchPlayerData()
      await loadChatHistory()
      // After loading history, auto-load the latest chat if no current chat
      await autoLoadLatestChat()
    }
    initializeData()
  }, [user])

  // Refresh chat list when messages change (for sidebar updates)
  useEffect(() => {
    if (messages.length > 1 && user?.uid) { // Only refresh if there are actual messages (not just default greeting)
      loadChatHistory()
    }
  }, [user?.uid])

  const fetchPlayerData = async () => {
    try {
      const [statsRes, matchesRes] = await Promise.all([
        fetch(`/api/stats/player?uid=${user.uid}`),
        fetch(`/api/matches?uid=${user.uid}`)
      ])

      const statsData = await statsRes.json()
      const matchesData = await matchesRes.json()

      // Extract stats from response
      const playerStats = statsData.stats || statsData
      setStats(playerStats)
      setMatches(matchesData.matches || [])

      // Generate personalized topic suggestions
      const topics = generateTopics(playerStats, matchesData.matches || [])
      setSuggestedTopics(topics)

      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching player data:', error)
      setIsLoading(false)
    }
  }

  // Load all chats from Firestore (without auto-loading)
  const loadChatHistory = async () => {
    if (!user?.uid) return
    
    try {
      const response = await fetch('/api/chat', {
        headers: {
          'x-user-id': user.uid
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch chats')
      }

      const data = await response.json()
      setChatList(data.chats || [])
      console.log('✅ Loaded', data.chats?.length || 0, 'chats from history')
    } catch (error) {
      console.error('Error loading chat history:', error)
      // Don't show error toast for failed history load - not critical
    }
  }

  // Auto-load the latest chat on page load
  const autoLoadLatestChat = async () => {
    if (!user?.uid) return
    
    try {
      const response = await fetch('/api/chat', {
        headers: {
          'x-user-id': user.uid
        }
      })

      if (!response.ok) return

      const data = await response.json()
      const chats = data.chats || []
      
      if (chats.length > 0 && chats[0].messages && chats[0].messages.length > 0) {
        setCurrentChatId(chats[0].id)
        setMessages(chats[0].messages)
        console.log('✅ Auto-loaded latest chat on page load:', chats[0].id)
      }
    } catch (error) {
      console.error('Error auto-loading latest chat:', error)
    }
  }

  // Load a specific chat
  const loadChat = (chatId) => {
    const chat = chatList.find(c => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages || [])
      setShowChatHistory(false)
      toast.success('Chat loaded!')
    }
  }

  // Delete a chat
  const deleteChat = async (chatId) => {
    try {
      const response = await fetch(`/api/chat?chatId=${chatId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.uid
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete chat')
      }

      setChatList(chatList.filter(c => c.id !== chatId))
      if (currentChatId === chatId) {
        startNewChat()
      }
      toast.success('Chat deleted!')
    } catch (error) {
      console.error('Error deleting chat:', error)
      toast.error('Failed to delete chat')
    }
  }

  // Rename a chat
  const renameChat = async (chatId, newName) => {
    try {
      if (!newName || newName.trim().length === 0) {
        toast.error('Chat name cannot be empty')
        return
      }

      const response = await fetch('/api/chat', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid
        },
        body: JSON.stringify({
          chatId,
          name: newName.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to rename chat')
      }

      // Update the chat in the list
      setChatList(chatList.map(c => 
        c.id === chatId ? { ...c, name: newName.trim() } : c
      ))
      
      setRenamingChatId(null)
      setRenameValue('')
      toast.success('Chat renamed!')
    } catch (error) {
      console.error('Error renaming chat:', error)
      toast.error('Failed to rename chat')
    }
  }

  // Format timestamp for display
  const formatChatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp.seconds * 1000)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Save message to Firestore via API
  const saveMessageToFirestore = async (newMessages, chatId) => {
    try {
      if (!user?.uid) {
        console.error('❌ No user UID available')
        return null
      }

      if (!newMessages || newMessages.length === 0) {
        console.error('❌ No messages to save')
        return null
      }

      console.log('💾 Saving chat...', {
        uid: user.uid,
        chatId: chatId || 'NEW',
        messagesCount: newMessages.length,
        firstMessage: newMessages[0]?.text?.substring(0, 50)
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid
        },
        body: JSON.stringify({
          messages: newMessages,
          chatId: chatId || null
        })
      })

      console.log('📡 API Response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      const data = await response.json()
      console.log('📦 Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || `API Error: ${response.status}`)
      }

      if (!chatId) {
        console.log('✅ Created new chat:', data.chatId)
      } else {
        console.log('✅ Updated existing chat:', chatId)
      }
      console.log('💾 Chat saved successfully')
      return data.chatId
    } catch (error) {
      console.error('❌ Error saving message to Firestore:', error.message)
      toast.error('Failed to save: ' + error.message)
      return null
    }
  }

  // Start new chat
  const startNewChat = async () => {
    setMessages([
      {
        id: `msg-initial-${Math.random().toString(36).substr(2, 9)}`,
        type: 'coach',
        text: 'Hello! I\'m your AI Coach. I\'ll analyze your cricket performance and provide personalized coaching advice. How can I help you improve today?'
      }
    ])
    setCurrentChatId(null)
    setShowChatHistory(false)
    // Reload chat history to reflect the new chat
    await loadChatHistory()
    toast.success('New chat started!')
  }

  const generateTopics = (statsData, matchesData) => {
    const topics = []

    if (!statsData) return ['Improve Strike Rate', 'Batting Technique', 'Mental Strength', 'Fitness Training', 'Match Strategy']

    const avg = statsData.battingAverage || statsData.stats?.battingAverage || 0
    const strikeRate = statsData.strikeRate || statsData.stats?.strikeRate || 0
    const economy = statsData.bowlingEconomy || statsData.economy || statsData.stats?.bowlingEconomy || 0

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

  const handleSend = async () => {
    if (!input.trim()) return

    setIsSending(true)

    // Add user message with unique ID
    const userMessage = input
    const newUserMessage = { 
      id: generateMessageId(), 
      type: 'user', 
      text: userMessage 
    }
    const updatedMessages = [...messages, newUserMessage]
    setMessages(updatedMessages)
    setInput('')

    try {
      // Prepare chat history for API
      const chatHistory = updatedMessages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))

      // Call AI Coach API with complete match data
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.uid
        },
        body: JSON.stringify({
          message: userMessage,
          uid: user.uid,
          chatHistory: chatHistory,
          matches: matches,
          stats: stats
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      const coachResponse = data.response || 'Unable to generate response. Please try again.'
      
      // Update stats if returned
      if (data.stats) {
        setStats(data.stats)
      }

      const newCoachMessage = {
        id: generateMessageId(),
        type: 'coach',
        text: coachResponse
      }

      const finalMessages = [...updatedMessages, newCoachMessage]
      setMessages(finalMessages)

      // Save to backend API
      console.log('💬 About to save messages:', {
        totalMessages: finalMessages.length,
        currentChatId: currentChatId || 'NEW',
        messageIds: finalMessages.map(m => m.id)
      })
      
      const savedChatId = await saveMessageToFirestore(finalMessages, currentChatId)
      
      console.log('💾 Save result:', {
        savedChatId,
        wasNewChat: !currentChatId,
        success: !!savedChatId
      })
      
      if (savedChatId) {
        if (!currentChatId) {
          // If this was a new chat, update the currentChatId
          setCurrentChatId(savedChatId)
          console.log('✅ New chat created and saved:', savedChatId)
        }
        toast.success('Message saved!')
      } else {
        // Save failed
        console.error('❌ Failed to save message')
        // Remove the coach message if save failed
        setMessages([...updatedMessages])
        toast.error('Failed to save message. Try again.')
      }
    } catch (error) {
      console.error('Error calling AI coach:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          type: 'coach',
          text: 'I encountered an issue while processing your request. Please try again.'
        }
      ])
    } finally {
      setIsSending(false)
    }
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
          <div className="flex items-center gap-4">
            <button
              onClick={startNewChat}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-gray-600 hover:text-gray-900"
              title="Start new chat"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="text-sm">New Chat</span>
            </button>
            <button
              onClick={() => setShowChatHistory(!showChatHistory)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
              title="Chat history"
            >
              <span className="text-sm font-medium">History ({chatList.length})</span>
            </button>
            <Bell className="w-5 h-5 text-gray-600" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat History or Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col overflow-hidden">
            {showChatHistory ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Chat History</h3>
                  <button
                    onClick={() => setShowChatHistory(false)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {chatList.length === 0 ? (
                    <p className="text-gray-500 text-sm">No previous chats</p>
                  ) : (
                    chatList.map((chat) => (
                      <div
                        key={chat.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          currentChatId === chat.id ? 'bg-blue-100 border-l-4 border-blue-600' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {renamingChatId === chat.id ? (
                          // Rename mode
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              placeholder="Enter chat name"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  renameChat(chat.id, renameValue)
                                } else if (e.key === 'Escape') {
                                  setRenamingChatId(null)
                                  setRenameValue('')
                                }
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => renameChat(chat.id, renameValue)}
                                className="flex-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setRenamingChatId(null)
                                  setRenameValue('')
                                }}
                                className="flex-1 text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Normal display mode
                          <>
                            <button
                              onClick={() => loadChat(chat.id)}
                              className="w-full text-left"
                            >
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {chat.name || chat.messages?.[1]?.text?.substring(0, 40) || 'Chat'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatChatDate(chat.updatedAt)}
                              </p>
                            </button>
                            <div className="mt-2 flex gap-1">
                              <button
                                onClick={() => {
                                  setRenamingChatId(chat.id)
                                  setRenameValue(chat.name || chat.messages?.[1]?.text?.substring(0, 40) || 'Chat')
                                }}
                                className="flex-1 text-xs text-blue-500 hover:text-blue-700 flex items-center justify-center gap-1"
                              >
                                ✏️ Rename
                              </button>
                              <button
                                onClick={() => deleteChat(chat.id)}
                                className="flex-1 text-xs text-red-500 hover:text-red-700 flex items-center justify-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="font-bold mb-4 text-gray-900">Quick Topics</h3>
                <div className="space-y-2 flex-1 overflow-y-auto">
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
                        <p className="text-lg font-bold text-gray-900">{parseFloat(stats.battingAverage)?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Strike Rate</p>
                        <p className="text-lg font-bold text-gray-900">{parseFloat(stats.strikeRate)?.toFixed(2) || 'N/A'}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Economy Rate</p>
                        <p className="text-lg font-bold text-gray-900">
                          {(stats.totalOvers > 0 || stats.totalWickets > 0) ? (parseFloat(stats.economy) || parseFloat(stats.bowlingEconomy))?.toFixed(2) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Matches Played</p>
                        <p className="text-lg font-bold text-gray-900">{stats.totalMatches || matches.length}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No data available. Add some matches first!</p>
                  )}
                </div>
              </>
            )}
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
