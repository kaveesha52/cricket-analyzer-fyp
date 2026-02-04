'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import PlayerNav from '@/components/PlayerNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Trophy, Target } from 'lucide-react'
import { toast } from 'sonner'

export default function AddMatchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [badges, setBadges] = useState([])
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    format: 'T20',
    location: '',
    batting: { runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: '' },
    bowling: { overs: 0, wickets: 0, runsConceded: 0, maidens: 0 },
    fielding: { catches: 0, runOuts: 0, stumpings: 0 }
  })

  const checkBadges = () => {
    const earnedBadges = []
    
    // Century badge
    if (formData.batting.runs >= 100) {
      earnedBadges.push({
        name: 'Century!',
        description: 'Scored 100+ runs',
        icon: '💯',
        color: 'gold'
      })
    }
    // Half Century badge
    else if (formData.batting.runs >= 50) {
      earnedBadges.push({
        name: 'Half Century!',
        description: 'Scored 50+ runs',
        icon: '⭐',
        color: 'silver'
      })
    }
    
    // 5 Wicket Haul badge
    if (formData.bowling.wickets >= 5) {
      earnedBadges.push({
        name: '5-Wicket Haul!',
        description: 'Took 5+ wickets',
        icon: '🎯',
        color: 'gold'
      })
    }
    
    return earnedBadges
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, uid: user.uid })
      })

      if (response.ok) {
        const earnedBadges = checkBadges()
        
        // Show success toast
        toast.success('Match Added Successfully!', {
          description: 'Your match has been recorded.',
          duration: 3000,
        })
        
        // Show badge notifications
        if (earnedBadges.length > 0) {
          earnedBadges.forEach((badge, index) => {
            setTimeout(() => {
              toast.success(`${badge.icon} ${badge.name}`, {
                description: badge.description,
                duration: 4000,
              })
            }, (index + 1) * 500)
          })
        }
        
        // Reset form after short delay
        setTimeout(() => {
          setFormData({
            date: new Date().toISOString().split('T')[0],
            format: 'T20',
            location: '',
            batting: { runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: '' },
            bowling: { overs: 0, wickets: 0, runsConceded: 0, maidens: 0 },
            fielding: { catches: 0, runOuts: 0, stumpings: 0 }
          })
        }, 1000)
      } else {
        toast.error('Failed to add match', {
          description: 'Please try again.',
        })
      }
    } catch (error) {
      console.error('Error adding match:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStrikeRate = () => {
    if (formData.batting.balls > 0) {
      return ((formData.batting.runs / formData.batting.balls) * 100).toFixed(2)
    }
    return '0.00'
  }

  const calculateEconomy = () => {
    if (formData.bowling.overs > 0) {
      return (formData.bowling.runsConceded / formData.bowling.overs).toFixed(2)
    }
    return '0.00'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <PlayerNav />
      
      <main className="md:ml-64 mt-16 p-6 pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Trophy className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-poppins font-bold text-gray-900">Add New Match</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="shadow-lg mb-6">
              <CardHeader className="bg-gray-50">
                <CardTitle>Match Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="format">Match Format</Label>
                    <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="T20"><span className="text-red-600 font-semibold">T20</span></SelectItem>
                        <SelectItem value="ODI"><span className="text-blue-600 font-semibold">ODI</span></SelectItem>
                        <SelectItem value="Test"><span className="text-green-600 font-semibold">Test</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="e.g., Local Cricket Ground"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg mb-6">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-700">Batting Performance</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="runs">Runs</Label>
                    <Input
                      id="runs"
                      type="number"
                      min="0"
                      value={formData.batting.runs}
                      onChange={(e) => setFormData({
                        ...formData,
                        batting: { ...formData.batting, runs: parseInt(e.target.value) || 0 }
                      })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="balls">Balls Faced</Label>
                    <Input
                      id="balls"
                      type="number"
                      min="0"
                      value={formData.batting.balls}
                      onChange={(e) => setFormData({
                        ...formData,
                        batting: { ...formData.batting, balls: parseInt(e.target.value) || 0 }
                      })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fours">4s</Label>
                    <Input
                      id="fours"
                      type="number"
                      min="0"
                      value={formData.batting.fours}
                      onChange={(e) => setFormData({
                        ...formData,
                        batting: { ...formData.batting, fours: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sixes">6s</Label>
                    <Input
                      id="sixes"
                      type="number"
                      min="0"
                      value={formData.batting.sixes}
                      onChange={(e) => setFormData({
                        ...formData,
                        batting: { ...formData.batting, sixes: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dismissal">How Out</Label>
                  <Select value={formData.batting.dismissal} onValueChange={(value) => setFormData({
                    ...formData,
                    batting: { ...formData.batting, dismissal: value }
                  })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dismissal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Out">Not Out</SelectItem>
                      <SelectItem value="Bowled">Bowled</SelectItem>
                      <SelectItem value="Caught">Caught</SelectItem>
                      <SelectItem value="LBW">LBW</SelectItem>
                      <SelectItem value="Run Out">Run Out</SelectItem>
                      <SelectItem value="Stumped">Stumped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                  <Trophy className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Strike Rate</p>
                    <p className="text-2xl font-bold text-green-600">{calculateStrikeRate()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg mb-6">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-orange-700">Bowling Performance</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="overs">Overs</Label>
                    <Input
                      id="overs"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.bowling.overs}
                      onChange={(e) => setFormData({
                        ...formData,
                        bowling: { ...formData.bowling, overs: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wickets">Wickets</Label>
                    <Input
                      id="wickets"
                      type="number"
                      min="0"
                      value={formData.bowling.wickets}
                      onChange={(e) => setFormData({
                        ...formData,
                        bowling: { ...formData.bowling, wickets: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="runsConceded">Runs Conceded</Label>
                    <Input
                      id="runsConceded"
                      type="number"
                      min="0"
                      value={formData.bowling.runsConceded}
                      onChange={(e) => setFormData({
                        ...formData,
                        bowling: { ...formData.bowling, runsConceded: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maidens">Maidens</Label>
                    <Input
                      id="maidens"
                      type="number"
                      min="0"
                      value={formData.bowling.maidens}
                      onChange={(e) => setFormData({
                        ...formData,
                        bowling: { ...formData.bowling, maidens: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
                  <Target className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Economy Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{calculateEconomy()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg mb-6">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-purple-700">Fielding Performance (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="catches">Catches</Label>
                    <Input
                      id="catches"
                      type="number"
                      min="0"
                      value={formData.fielding.catches}
                      onChange={(e) => setFormData({
                        ...formData,
                        fielding: { ...formData.fielding, catches: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="runOuts">Run Outs</Label>
                    <Input
                      id="runOuts"
                      type="number"
                      min="0"
                      value={formData.fielding.runOuts}
                      onChange={(e) => setFormData({
                        ...formData,
                        fielding: { ...formData.fielding, runOuts: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stumpings">Stumpings</Label>
                    <Input
                      id="stumpings"
                      type="number"
                      min="0"
                      value={formData.fielding.stumpings}
                      onChange={(e) => setFormData({
                        ...formData,
                        fielding: { ...formData.fielding, stumpings: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 py-6 text-lg"
              >
                {loading ? 'Saving...' : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Save Match
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="py-6 px-8"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}