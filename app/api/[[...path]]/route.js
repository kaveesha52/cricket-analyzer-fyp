import { NextResponse } from 'next/server';
import { collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebaseAdmin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to get current user from headers
async function getCurrentUser(request) {
  const uid = request.headers.get('x-user-id');
  if (!uid) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid, ...userDoc.data() };
    }
  } catch (error) {
    console.error('Error getting user:', error);
  }
  return null;
}

// GET Handler
export async function GET(request, { params }) {
  const path = params?.path?.join('/') || '';
  const { searchParams } = new URL(request.url);

  try {
    // Root endpoint
    if (!path || path === '') {
      return NextResponse.json({ message: 'Cricket Analyzer API' });
    }

    // User Profile
    if (path === 'user/profile') {
      const uid = searchParams.get('uid');
      if (!uid) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (userDoc.exists) {
          return NextResponse.json({ user: { uid, ...userDoc.data() } });
        }
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Get Matches
    if (path === 'matches') {
      const uid = searchParams.get('uid');
      const format = searchParams.get('format');
      
      if (!uid) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      try {
        let query = adminDb.collection('matches').where('uid', '==', uid);
        
        if (format && format !== 'all') {
          query = query.where('format', '==', format);
        }

        const snapshot = await query.get();
        const matches = [];
        snapshot.forEach(doc => {
          matches.push({ id: doc.id, ...doc.data() });
        });

        // Sort by date
        matches.sort((a, b) => new Date(b.date) - new Date(a.date));

        return NextResponse.json({ matches });
      } catch (error) {
        console.error('Error fetching matches:', error);
        return NextResponse.json({ matches: [] });
      }
    }

    // Get Match by ID
    if (path.startsWith('matches/')) {
      const matchId = path.split('/')[1];
      const matchDoc = await getDoc(doc(db, 'matches', matchId));
      
      if (matchDoc.exists()) {
        return NextResponse.json({ match: { id: matchDoc.id, ...matchDoc.data() } });
      }
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get Posts (Community)
    if (path === 'posts') {
      const uid = searchParams.get('uid');
      const filter = searchParams.get('filter') || 'all';

      try {
        const postsRef = collection(db, 'posts');
        let q;

        if (filter === 'my' && uid) {
          q = query(postsRef, where('uid', '==', uid));
        } else {
          q = query(postsRef, limit(50));
        }

        const snapshot = await getDocs(q);
        const posts = [];
        snapshot.forEach(doc => {
          posts.push({ id: doc.id, ...doc.data() });
        });

        // Sort by date on the client side
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return NextResponse.json({ posts });
      } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ posts: [] });
      }
    }

    // Get Coach Students
    if (path === 'coach/students') {
      const coachUid = searchParams.get('coachUid');
      if (!coachUid) {
        return NextResponse.json({ error: 'Coach ID required' }, { status: 400 });
      }

      try {
        const snapshot = await adminDb.collection('connections')
          .where('coachUid', '==', coachUid)
          .where('status', '==', 'accepted')
          .get();
          
        const students = [];
        const uniqueStudents = new Map(); // Map to track unique students by UID
        
        for (const docSnap of snapshot.docs) {
          const connection = docSnap.data();
          // Skip if we've already added this student
          if (uniqueStudents.has(connection.studentUid)) {
            continue;
          }
          
          const studentDoc = await adminDb.collection('users').doc(connection.studentUid).get();
          if (studentDoc.exists) {
            const studentRecord = {
              id: docSnap.id,
              ...connection,
              studentData: { uid: connection.studentUid, ...studentDoc.data() }
            };
            students.push(studentRecord);
            uniqueStudents.set(connection.studentUid, true);
          }
        }

        return NextResponse.json({ students });
      } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Get Coach Details & Stats
    if (path === 'coach/details') {
      const coachUid = searchParams.get('coachUid');
      if (!coachUid) {
        return NextResponse.json({ error: 'Coach ID required' }, { status: 400 });
      }

      try {
        // Get coach profile
        const coachDoc = await adminDb.collection('users').doc(coachUid).get();
        if (!coachDoc.exists) {
          return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
        }

        const coachData = coachDoc.data();

        // Get number of connected students
        const connectionsSnap = await adminDb.collection('connections')
          .where('coachUid', '==', coachUid)
          .where('status', '==', 'accepted')
          .get();
        
        const studentCount = connectionsSnap.size;

        // Get pending requests count
        const pendingSnap = await adminDb.collection('connections')
          .where('coachUid', '==', coachUid)
          .where('status', '==', 'pending')
          .get();
        
        const pendingCount = pendingSnap.size;

        return NextResponse.json({
          coach: {
            uid: coachUid,
            name: coachData.name,
            email: coachData.email,
            bio: coachData.bio || '',
            specializations: coachData.specializations || [],
            certifications: coachData.certifications || [],
            sessionTypes: coachData.sessionTypes || [],
            maxStudents: coachData.maxStudents || 0,
            createdAt: coachData.createdAt
          },
          stats: {
            connectedStudents: studentCount,
            pendingRequests: pendingCount
          }
        });
      } catch (error) {
        console.error('Error fetching coach details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Get All Coaches (for player discovery)
    if (path === 'coaches') {
      try {
        const snapshot = await adminDb.collection('users')
          .where('role', '==', 'coach')
          .get();
        
        const coaches = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          coaches.push({
            uid: doc.id,
            name: data.name || 'Coach',
            email: data.email,
            bio: data.bio || '',
            specializations: data.specializations || [],
            certifications: data.certifications || [],
            maxStudents: data.maxStudents || 0,
            sessionTypes: data.sessionTypes || [],
            profileCompleted: data.profileCompleted || false,
            createdAt: data.createdAt
          });
        });

        return NextResponse.json({ coaches });
      } catch (error) {
        console.error('Error fetching coaches:', error);
        return NextResponse.json({ coaches: [] });
      }
    }

    // Get Coach Pending Requests
    if (path === 'coach/requests') {
      const coachUid = searchParams.get('coachUid');
      if (!coachUid) {
        return NextResponse.json({ error: 'Coach ID required' }, { status: 400 });
      }

      try {
        const snapshot = await adminDb.collection('connections')
          .where('coachUid', '==', coachUid)
          .where('status', '==', 'pending')
          .get();

        const requests = [];
        const uniqueStudents = new Map(); // Map to track unique students by UID
        
        for (const docSnap of snapshot.docs) {
          const connection = docSnap.data();
          // Skip if we've already added this student
          if (uniqueStudents.has(connection.studentUid)) {
            continue;
          }
          
          const studentDoc = await adminDb.collection('users').doc(connection.studentUid).get();
          if (studentDoc.exists) {
            requests.push({
              id: docSnap.id,
              ...connection,
              studentData: { uid: connection.studentUid, ...studentDoc.data() }
            });
            uniqueStudents.set(connection.studentUid, true);
          }
        }

        return NextResponse.json({ requests });
      } catch (error) {
        console.error('Error fetching requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Get Connection Status
    if (path === 'connection/status') {
      const studentUid = searchParams.get('studentUid');
      const coachUid = searchParams.get('coachUid');
      
      if (!studentUid || !coachUid) {
        return NextResponse.json({ error: 'Student and Coach ID required' }, { status: 400 });
      }

      try {
        const q = query(
          collection(db, 'connections'),
          where('studentUid', '==', studentUid),
          where('coachUid', '==', coachUid)
        );

        const snapshot = await getDocs(q);
        
        if (snapshot.docs.length > 0) {
          const connection = snapshot.docs[0].data();
          return NextResponse.json({ 
            status: connection.status,
            connectionId: snapshot.docs[0].id
          });
        }
        
        return NextResponse.json({ status: null });
      } catch (error) {
        console.error('Error fetching connection status:', error);
        return NextResponse.json({ status: null });
      }
    }

    // Get Coach Meetings
    if (path === 'coach/meetings') {
      const coachUid = searchParams.get('coachUid');
      const studentUid = searchParams.get('studentUid');
      
      if (!coachUid) {
        return NextResponse.json({ error: 'Coach ID required' }, { status: 400 });
      }

      try {
        let meetingsQuery;
        
        if (studentUid) {
          // Get meetings between specific coach and student
          meetingsQuery = adminDb.collection('meetings')
            .where('coachUid', '==', coachUid)
            .where('studentUid', '==', studentUid);
        } else {
          // Get all meetings for the coach
          meetingsQuery = adminDb.collection('meetings')
            .where('coachUid', '==', coachUid);
        }

        const snapshot = await meetingsQuery.get();
        const meetings = [];
        
        for (const doc of snapshot.docs) {
          const meeting = doc.data();
          
          // Fetch student data to get name
          try {
            const studentDoc = await adminDb.collection('users').doc(meeting.studentUid).get();
            const studentData = studentDoc.exists ? studentDoc.data() : {};
            
            meetings.push({
              id: doc.id,
              ...meeting,
              studentName: studentData.name || 'Student'
            });
          } catch (error) {
            meetings.push({
              id: doc.id,
              ...meeting,
              studentName: 'Student'
            });
          }
        }

        // Sort by date and time
        meetings.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time}`);
          const dateB = new Date(`${b.date}T${b.time}`);
          return dateB - dateA;
        });

        return NextResponse.json({ meetings });
      } catch (error) {
        console.error('Error fetching meetings:', error);
        return NextResponse.json({ error: error.message, meetings: [] }, { status: 500 });
      }
    }

    // Get Student Stats
    if (path === 'stats/player') {
      const uid = searchParams.get('uid');
      if (!uid) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      try {
        const snapshot = await adminDb.collection('matches')
          .where('uid', '==', uid)
          .get();
        
        let totalMatches = 0;
        let totalRuns = 0;
        let totalBalls = 0;
        let totalWickets = 0;
        let totalOvers = 0;
        let totalRunsConceded = 0;

        snapshot.forEach(doc => {
          const match = doc.data();
          totalMatches++;
          totalRuns += match.batting?.runs || 0;
          totalBalls += match.batting?.balls || 0;
          totalWickets += match.bowling?.wickets || 0;
          totalOvers += match.bowling?.overs || 0;
          totalRunsConceded += match.bowling?.runsConceded || 0;
        });

        const battingAverage = totalMatches > 0 ? (totalRuns / totalMatches).toFixed(2) : 0;
        const strikeRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : 0;
        const bowlingEconomy = totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : 0;

        return NextResponse.json({
          stats: {
            totalMatches,
            battingAverage,
            strikeRate,
            bowlingEconomy,
            totalRuns,
            totalWickets
          }
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Get Player Badges
    if (path === 'player/badges') {
      const uid = searchParams.get('studentUid');
      if (!uid) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      try {
        const snapshot = await adminDb.collection('matches')
          .where('uid', '==', uid)
          .get();
        
        let totalMatches = 0;
        let maxSingleScore = 0;
        let totalWickets = 0;
        let maxWicketsInMatch = 0;

        const matches = [];
        snapshot.forEach(doc => {
          const match = doc.data();
          matches.push(match);
          totalMatches++;
          maxSingleScore = Math.max(maxSingleScore, match.batting?.runs || 0);
          totalWickets += match.bowling?.wickets || 0;
          maxWicketsInMatch = Math.max(maxWicketsInMatch, match.bowling?.wickets || 0);
        });

        // Define badges with conditions
        const badges = [
          {
            id: 'first-match',
            name: 'First Match',
            description: 'Record your first cricket match',
            icon: '🏏',
            requirement: 'Play 1 match',
            unlocked: totalMatches >= 1,
            unlockedDate: totalMatches >= 1 ? matches[matches.length - 1]?.date : null
          },
          {
            id: 'half-century',
            name: 'Half Century',
            description: 'Score 50 or more runs in a single match',
            icon: '⭐',
            requirement: 'Score 50+ runs',
            unlocked: maxSingleScore >= 50,
            unlockedDate: maxSingleScore >= 50 ? matches.find(m => m.batting?.runs >= 50)?.date : null
          },
          {
            id: 'century',
            name: 'Century',
            description: 'Score 100 or more runs in a single match',
            icon: '💯',
            requirement: 'Score 100+ runs',
            unlocked: maxSingleScore >= 100,
            unlockedDate: maxSingleScore >= 100 ? matches.find(m => m.batting?.runs >= 100)?.date : null
          },
          {
            id: 'five-wicket-haul',
            name: '5-Wicket Haul',
            description: 'Take 5 or more wickets in a single match',
            icon: '🎯',
            requirement: 'Take 5+ wickets',
            unlocked: maxWicketsInMatch >= 5,
            unlockedDate: maxWicketsInMatch >= 5 ? matches.find(m => m.bowling?.wickets >= 5)?.date : null
          },
          {
            id: 'ten-matches',
            name: 'Milestone: 10 Matches',
            description: 'Play 10 matches',
            icon: '🔟',
            requirement: 'Play 10 matches',
            unlocked: totalMatches >= 10,
            unlockedDate: totalMatches >= 10 ? matches[matches.length - 1]?.date : null
          },
          {
            id: 'striker',
            name: 'The Striker',
            description: 'Achieve 120+ strike rate in a match',
            icon: '⚡',
            requirement: 'Strike rate 120+',
            unlocked: matches.some(m => (m.batting?.strikeRate || 0) >= 120),
            unlockedDate: matches.find(m => (m.batting?.strikeRate || 0) >= 120)?.date || null
          }
        ];

        return NextResponse.json({ badges });
      } catch (error) {
        console.error('Error fetching badges:', error);
        return NextResponse.json({ badges: [] });
      }
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST Handler
export async function POST(request, { params }) {
  const path = params?.path?.join('/') || '';

  try {
    const body = await request.json();

    // Create User Profile (using Admin SDK for elevated permissions)
    if (path === 'user/profile') {
      const { uid, name, email, role } = body;
      
      if (!uid || !name || !email || !role) {
        return NextResponse.json({ error: 'uid, name, email, and role required' }, { status: 400 });
      }

      try {
        await adminDb.collection('users').doc(uid).set({
          name,
          email,
          role,
          profileCompleted: false,
          createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error creating user profile:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Add Match
    if (path === 'matches') {
      const { uid, date, format, location, opponent, batting, bowling, fielding } = body;
      
      const matchData = {
        uid,
        date,
        format,
        location,
        opponent: opponent || '',
        batting: {
          runs: batting.runs || 0,
          balls: batting.balls || 0,
          fours: batting.fours || 0,
          sixes: batting.sixes || 0,
          dismissal: batting.dismissal || '',
          strikeRate: batting.balls > 0 ? ((batting.runs / batting.balls) * 100).toFixed(2) : 0
        },
        bowling: {
          overs: bowling?.overs || 0,
          wickets: bowling?.wickets || 0,
          runsConceded: bowling?.runsConceded || 0,
          maidens: bowling?.maidens || 0,
          economy: bowling?.overs > 0 ? (bowling.runsConceded / bowling.overs).toFixed(2) : 0
        },
        fielding: {
          catches: fielding?.catches || 0,
          runOuts: fielding?.runOuts || 0,
          stumpings: fielding?.stumpings || 0
        },
        createdAt: new Date().toISOString()
      };

      try {
        const docRef = await adminDb.collection('matches').add(matchData);
        return NextResponse.json({ success: true, id: docRef.id });
      } catch (error) {
        console.error('Error adding match:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // AI Coach Chat
    if (path === 'ai/chat') {
      const { message, uid, chatHistory, matches: providedMatches, stats: providedStats } = body;

      if (!message || !uid) {
        return NextResponse.json({ error: 'Message and UID required' }, { status: 400 });
      }

      // Smart cricket validation - focus on REJECTING non-cricket rather than requiring cricket
      // Non-cricket topics to explicitly reject
      const nonCricketKeywords = [
        'football', 'soccer', 'basketball', 'tennis', 'golf', 'volleyball', 'hockey',
        'politics', 'movie', 'film', 'code', 'python', 'javascript', 'math', 'history',
        'literature', 'programming', 'weather', 'recipe', 'cooking', 'love', 'dating',
        'funny jokes', 'music', 'song'
      ];
      
      const messageLower = message.toLowerCase();
      const hasNonCricketKeyword = nonCricketKeywords.some(keyword => messageLower.includes(keyword));
      
      // If explicitly non-cricket, reject it
      if (hasNonCricketKeyword) {
        return NextResponse.json({
          response: "I'm a cricket coach, so I specialize in cricket coaching only! 🏏 But I'm here whenever you need help with your cricket game. Ask me about batting, bowling, fitness, strategy, or any aspect of cricket improvement!",
          stats: providedStats || { battingAverage: 0, strikeRate: 0, economy: 0, totalMatches: 0 }
        });
      }
      
      // If not explicitly non-cricket, allow it - give the AI a chance to answer
      // The AI has instructions to only talk about cricket in its system prompt

      try {
        let recentMatches = [];
        let calculatedStats = providedStats;

        // Use provided matches if available, otherwise fetch from Firestore
        if (providedMatches && providedMatches.length > 0) {
          recentMatches = providedMatches.slice(0, 20);
        } else {
          const matchesRef = collection(db, 'matches');
          const q = query(matchesRef, where('uid', '==', uid));
          const snapshot = await getDocs(q);
          
          const allMatches = [];
          snapshot.forEach(doc => {
            allMatches.push(doc.data());
          });

          // Sort and get last 20
          allMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
          recentMatches = allMatches.slice(0, 20);
        }

        // Calculate or use provided stats
        if (!calculatedStats || !calculatedStats.battingAverage) {
          let totalRuns = 0, totalBalls = 0, totalWickets = 0, totalOvers = 0, totalRunsConceded = 0;
          recentMatches.forEach(match => {
            totalRuns += match.batting?.runs || 0;
            totalBalls += match.batting?.balls || 0;
            totalWickets += match.bowling?.wickets || 0;
            totalOvers += match.bowling?.overs || 0;
            totalRunsConceded += match.bowling?.runsConceded || 0;
          });

          calculatedStats = {
            battingAverage: recentMatches.length > 0 ? parseFloat((totalRuns / recentMatches.length).toFixed(2)) : 0,
            strikeRate: totalBalls > 0 ? parseFloat(((totalRuns / totalBalls) * 100).toFixed(2)) : 0,
            economy: totalOvers > 0 ? parseFloat((totalRunsConceded / totalOvers).toFixed(2)) : 0,
            totalMatches: recentMatches.length,
            totalRuns,
            totalWickets,
            totalOvers,
            totalRunsConceded
          };
        }

        // Build detailed context message with match history
        let matchSummary = "Recent match performances:\n";
        if (recentMatches.length > 0) {
          recentMatches.slice(0, 5).forEach((match, idx) => {
            const runs = match.batting?.runs || 0;
            const balls = match.batting?.balls || 0;
            const wickets = match.bowling?.wickets || 0;
            const overs = match.bowling?.overs || 0;
            const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(2) : 0;
            matchSummary += `Match ${idx + 1}: ${runs} runs (${balls} balls, SR: ${strikeRate}%) | Bowling: ${wickets}/${overs} overs\n`;
          });
        }

        const contextMessage = `You are an expert cricket coach specializing in player development and performance analysis.

RULES - STRICTLY ENFORCE:
1. Only answer cricket-related questions
2. Reject any questions about other sports, politics, entertainment, or non-cricket topics
3. Always provide specific, actionable coaching advice
4. Reference player statistics and recent performances
5. Be encouraging but honest about areas for improvement

Player Performance Statistics:
• Batting Average: ${calculatedStats.battingAverage}
• Strike Rate: ${calculatedStats.strikeRate}%
• Bowling Economy: ${calculatedStats.economy}
• Total Matches Played: ${calculatedStats.totalMatches}
• Total Runs Scored: ${calculatedStats.totalRuns}
• Total Wickets Taken: ${calculatedStats.totalWickets}

${matchSummary}

Provide expert cricket coaching based on their actual performance data. Focus on improvement strategies, technique refinement, mental toughness, and training plans.`;

        // Build messages array with chat history
        const messages = [
          { role: "system", content: contextMessage }
        ];

        // Add chat history if available
        if (chatHistory && chatHistory.length > 0) {
          chatHistory.forEach(msg => {
            messages.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            });
          });
        }

        // Add current message
        messages.push({ role: "user", content: message });

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.7,
            max_tokens: 600
          });

          return NextResponse.json({
            response: completion.choices[0].message.content,
            stats: calculatedStats
          });
        } catch (openaiError) {
          console.error('OpenAI Error:', openaiError);
          
          // Provide cricket-specific fallback
          const fallbackResponse = `I'm your AI cricket coach! I can help you with:

📊 Performance Analysis
Review your stats: Batting Average ${calculatedStats.battingAverage}, Strike Rate ${calculatedStats.strikeRate}%, Bowling Economy ${calculatedStats.economy}

🏏 Technique Improvement
Batting, bowling, fielding, and positioning coaching

💪 Training & Fitness
Cricket-specific drills, conditioning, and exercises

🎯 Match Strategy
Tactics, field placement, and game situations

🧠 Mental Performance
Pressure management, confidence, and focus

What aspect of your game would you like to work on?`;

          return NextResponse.json({
            response: fallbackResponse,
            stats: calculatedStats
          });
        }
      } catch (error) {
        console.error('Error in AI chat:', error);
        return NextResponse.json({
          response: "I'm experiencing some technical difficulties. Please try again in a moment.",
          stats: { battingAverage: 0, strikeRate: 0, economy: 0, totalMatches: 0 }
        });
      }
    }

    // Create Post
    if (path === 'posts') {
      const { uid, content, matchId } = body;
      
      const userDoc = await adminDb.collection('users').doc(uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      const postData = {
        uid,
        userName: userData.name || 'Anonymous',
        userRole: userData.role || 'player',
        content,
        matchId: matchId || null,
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString()
      };

      try {
        const docRef = await adminDb.collection('posts').add(postData);
        return NextResponse.json({ success: true, id: docRef.id });
      } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Coach-Student Connection Request
    if (path === 'coach/connect') {
      const { studentUid, coachUid, message } = body;
      
      try {
        const connectionData = {
          studentUid,
          coachUid,
          message: message || '',
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        const docRef = await adminDb.collection('connections').add(connectionData);
        
        // Create notification for coach
        const studentDoc = await adminDb.collection('users').doc(studentUid).get();
        const studentData = studentDoc.exists ? studentDoc.data() : {};
        
        await adminDb.collection('notifications').add({
          uid: coachUid,
          type: 'connection_request',
          title: 'New Student Request',
          message: `${studentData.name || 'A student'} wants to connect with you`,
          read: false,
          data: {
            connectionId: docRef.id,
            studentUid,
            studentName: studentData.name
          },
          createdAt: new Date().toISOString()
        });
        
        return NextResponse.json({ success: true, id: docRef.id });
      } catch (error) {
        console.error('Error creating connection:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Schedule Meeting
    if (path === 'coach/schedule-meeting') {
      const { coachUid, studentUid, date, time, type, notes } = body;
      
      if (!coachUid || !studentUid || !date || !time || !type) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      try {
        const meetingData = {
          coachUid,
          studentUid,
          date,
          time,
          type,
          notes: notes || '',
          status: 'scheduled',
          createdAt: new Date().toISOString()
        };

        const docRef = await adminDb.collection('meetings').add(meetingData);
        
        // Create notification for student
        const coachDoc = await adminDb.collection('users').doc(coachUid).get();
        const coachData = coachDoc.exists ? coachDoc.data() : {};
        
        await adminDb.collection('notifications').add({
          uid: studentUid,
          type: 'meeting_scheduled',
          title: 'Session Scheduled',
          message: `${coachData.name || 'Your coach'} scheduled a ${type} session for ${date} at ${time}`,
          read: false,
          data: {
            meetingId: docRef.id,
            coachUid,
            coachName: coachData.name,
            date,
            time,
            type
          },
          createdAt: new Date().toISOString()
        });
        
        return NextResponse.json({ success: true, id: docRef.id });
      } catch (error) {
        console.error('Error scheduling meeting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Get Notifications
    if (path === 'notifications') {
      const uid = searchParams.get('uid');
      if (!uid) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(notificationsRef, where('uid', '==', uid));
        const snapshot = await getDocs(q);
        
        const notifications = [];
        snapshot.forEach(doc => {
          notifications.push({ id: doc.id, ...doc.data() });
        });

        // Sort by date
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return NextResponse.json({ notifications });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ notifications: [] });
      }
    }

    // Update User Profile (using Admin SDK for elevated permissions)
    if (path === 'user/profile/update') {
      const { uid, age, birthday, gender, phone, city, state } = body;
      
      if (!uid) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      try {
        await adminDb.collection('users').doc(uid).update({
          age,
          birthday,
          gender,
          phone,
          city,
          state,
          profileCompleted: true,
          updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT Handler
export async function PUT(request, { params }) {
  const path = params?.path?.join('/') || '';

  try {
    const body = await request.json();

    // Update Match
    if (path.startsWith('matches/')) {
      const matchId = path.split('/')[1];
      const updateData = { ...body, updatedAt: new Date().toISOString() };
      
      try {
        await adminDb.collection('matches').doc(matchId).update(updateData);
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error updating match:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Accept/Reject Connection
    if (path === 'coach/connection') {
      const { connectionId, status } = body;
      
      try {
        await adminDb.collection('connections').doc(connectionId).update({
          status,
          updatedAt: new Date().toISOString()
        });
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error updating connection:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    // Mark Notification as Read
    if (path === 'notifications/mark-read') {
      const { notificationId } = body;
      
      try {
        await adminDb.collection('notifications').doc(notificationId).update({
          read: true,
          readAt: new Date().toISOString()
        });
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Mark All Notifications as Read
    if (path === 'notifications/mark-all-read') {
      const { uid } = body;
      
      try {
        const snapshot = await adminDb.collection('notifications')
          .where('uid', '==', uid)
          .where('read', '==', false)
          .get();
        
        const updates = [];
        snapshot.forEach(doc => {
          updates.push(doc.ref.update({ read: true, readAt: new Date().toISOString() }));
        });
        
        await Promise.all(updates);
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Like Post
    if (path.startsWith('posts/') && path.endsWith('/like')) {
      const postId = path.split('/')[1];
      
      try {
        const postDoc = await adminDb.collection('posts').doc(postId).get();
        
        if (postDoc.exists) {
          const currentLikes = postDoc.data().likes || 0;
          await adminDb.collection('posts').doc(postId).update({
            likes: currentLikes + 1
          });
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      } catch (error) {
        console.error('Error liking post:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Update User Profile
    if (path === 'user/profile') {
      const { uid, name, bio, specializations, certifications, maxStudents, sessionTypes, yearsCoaching, totalStudentsCoached } = body;
      
      if (!uid) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      try {
        const updateData = {
          updatedAt: new Date().toISOString()
        };

        if (name !== undefined) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (specializations !== undefined) updateData.specializations = specializations;
        if (certifications !== undefined) updateData.certifications = certifications;
        if (maxStudents !== undefined) updateData.maxStudents = maxStudents;
        if (sessionTypes !== undefined) updateData.sessionTypes = sessionTypes;
        if (yearsCoaching !== undefined) updateData.yearsCoaching = yearsCoaching;
        if (totalStudentsCoached !== undefined) updateData.totalStudentsCoached = totalStudentsCoached;

        await adminDb.collection('users').doc(uid).update(updateData);
        return NextResponse.json({ success: true, user: updateData });
      } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE Handler
export async function DELETE(request, { params }) {
  const path = params?.path?.join('/') || '';

  try {
    // Delete Match
    if (path.startsWith('matches/')) {
      const matchId = path.split('/')[1];
      try {
        await adminDb.collection('matches').doc(matchId).delete();
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error deleting match:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
