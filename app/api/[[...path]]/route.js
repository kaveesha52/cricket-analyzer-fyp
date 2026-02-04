import { NextResponse } from 'next/server';
import { collection, doc, getDoc, setDoc, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return NextResponse.json({ user: { uid, ...userDoc.data() } });
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get Matches
    if (path === 'matches') {
      const uid = searchParams.get('uid');
      const format = searchParams.get('format');
      
      if (!uid) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      try {
        const matchesRef = collection(db, 'matches');
        let q;
        
        if (format && format !== 'all') {
          q = query(matchesRef, where('uid', '==', uid), where('format', '==', format));
        } else {
          q = query(matchesRef, where('uid', '==', uid));
        }

        const snapshot = await getDocs(q);
        const matches = [];
        snapshot.forEach(doc => {
          matches.push({ id: doc.id, ...doc.data() });
        });

        // Sort by date on the client side to avoid index requirement
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

      const q = query(
        collection(db, 'connections'),
        where('coachUid', '==', coachUid),
        where('status', '==', 'accepted')
      );

      const snapshot = await getDocs(q);
      const students = [];
      
      for (const docSnap of snapshot.docs) {
        const connection = docSnap.data();
        const studentDoc = await getDoc(doc(db, 'users', connection.studentUid));
        if (studentDoc.exists()) {
          students.push({
            id: docSnap.id,
            ...connection,
            studentData: { uid: connection.studentUid, ...studentDoc.data() }
          });
        }
      }

      return NextResponse.json({ students });
    }

    // Get Student Stats
    if (path === 'stats/player') {
      const uid = searchParams.get('uid');
      if (!uid) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      const matchesQuery = query(
        collection(db, 'matches'),
        where('uid', '==', uid)
      );
      const snapshot = await getDocs(matchesQuery);
      
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

    // Create User Profile
    if (path === 'user/profile') {
      const { uid, name, email, role } = body;
      
      await setDoc(doc(db, 'users', uid), {
        name,
        email,
        role,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({ success: true });
    }

    // Add Match
    if (path === 'matches') {
      const { uid, date, format, location, batting, bowling, fielding } = body;
      
      const matchData = {
        uid,
        date,
        format,
        location,
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

      const docRef = await addDoc(collection(db, 'matches'), matchData);
      return NextResponse.json({ success: true, id: docRef.id });
    }

    // AI Coach Chat
    if (path === 'ai/chat') {
      const { message, uid, chatHistory } = body;

      if (!message || !uid) {
        return NextResponse.json({ error: 'Message and UID required' }, { status: 400 });
      }

      try {
        // Get user's recent matches for context
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, where('uid', '==', uid));
        const snapshot = await getDocs(q);
        
        const allMatches = [];
        snapshot.forEach(doc => {
          allMatches.push(doc.data());
        });

        // Sort and get last 10
        allMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
        const recentMatches = allMatches.slice(0, 10);

        // Calculate stats
        let totalRuns = 0, totalBalls = 0, totalWickets = 0, totalOvers = 0, totalRunsConceded = 0;
        recentMatches.forEach(match => {
          totalRuns += match.batting?.runs || 0;
          totalBalls += match.batting?.balls || 0;
          totalWickets += match.bowling?.wickets || 0;
          totalOvers += match.bowling?.overs || 0;
          totalRunsConceded += match.bowling?.runsConceded || 0;
        });

        const battingAvg = recentMatches.length > 0 ? (totalRuns / recentMatches.length).toFixed(2) : 0;
        const strikeRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : 0;
        const economy = totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : 0;

        const contextMessage = `You are an expert cricket coach specializing in player development. IMPORTANT: You ONLY answer questions related to cricket - technique, training, performance, strategy, rules, equipment, fitness for cricket, mental game, etc.

If the user asks about anything non-cricket related, politely redirect them: "I'm a cricket coaching AI. I can only help with cricket-related questions about technique, training, performance analysis, strategy, and improvement. Please ask me something about cricket!"

The player has played ${recentMatches.length} recent matches with these stats:
- Batting Average: ${battingAvg}
- Strike Rate: ${strikeRate}
- Bowling Economy: ${economy}
- Total Runs: ${totalRuns}
- Total Wickets: ${totalWickets}

Provide helpful, specific coaching advice. Be encouraging and provide actionable tips. Reference their stats when relevant.`;

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
            max_tokens: 500
          });

          return NextResponse.json({
            response: completion.choices[0].message.content,
            stats: { battingAvg, strikeRate, economy, totalMatches: recentMatches.length }
          });
        } catch (openaiError) {
          console.error('OpenAI Error:', openaiError);
          
          // Provide cricket-specific fallback
          const fallbackResponse = `I'm your AI cricket coach! I can help you with:

📊 Performance Analysis - Review your batting average (${battingAvg}), strike rate (${strikeRate}), and bowling economy (${economy})

🏏 Technique Tips - Batting, bowling, and fielding improvements

💪 Training Plans - Drills and exercises to improve your game

🎯 Strategy Advice - Match situations and decision making

What would you like to focus on today?`;

          return NextResponse.json({
            response: fallbackResponse,
            stats: { battingAvg, strikeRate, economy, totalMatches: recentMatches.length }
          });
        }
      } catch (error) {
        console.error('Error in AI chat:', error);
        return NextResponse.json({
          response: "I'm experiencing some technical difficulties. Please try again in a moment.",
          stats: { battingAvg: 0, strikeRate: 0, economy: 0, totalMatches: 0 }
        });
      }
    }

    // Create Post
    if (path === 'posts') {
      const { uid, content, matchId } = body;
      
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

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

      const docRef = await addDoc(collection(db, 'posts'), postData);
      return NextResponse.json({ success: true, id: docRef.id });
    }

    // Coach-Student Connection Request
    if (path === 'coach/connect') {
      const { studentUid, coachUid, message } = body;
      
      const connectionData = {
        studentUid,
        coachUid,
        message,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'connections'), connectionData);
      
      // Create notification for coach
      const studentDoc = await getDoc(doc(db, 'users', studentUid));
      const studentData = studentDoc.exists() ? studentDoc.data() : {};
      
      await addDoc(collection(db, 'notifications'), {
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
      
      await updateDoc(doc(db, 'matches', matchId), updateData);
      return NextResponse.json({ success: true });
    }

    // Accept/Reject Connection
    if (path === 'coach/connection') {
      const { connectionId, status } = body;
      
      await updateDoc(doc(db, 'connections', connectionId), {
        status,
        updatedAt: new Date().toISOString()
      });
      return NextResponse.json({ success: true });
    }

    // Mark Notification as Read
    if (path === 'notifications/mark-read') {
      const { notificationId } = body;
      
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date().toISOString()
      });
      return NextResponse.json({ success: true });
    }

    // Mark All Notifications as Read
    if (path === 'notifications/mark-all-read') {
      const { uid } = body;
      
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('uid', '==', uid), where('read', '==', false));
      const snapshot = await getDocs(q);
      
      const updates = [];
      snapshot.forEach(doc => {
        updates.push(updateDoc(doc.ref, { read: true, readAt: new Date().toISOString() }));
      });
      
      await Promise.all(updates);
      return NextResponse.json({ success: true });
    }

    // Like Post
    if (path.startsWith('posts/') && path.endsWith('/like')) {
      const postId = path.split('/')[1];
      const postDoc = await getDoc(doc(db, 'posts', postId));
      
      if (postDoc.exists()) {
        const currentLikes = postDoc.data().likes || 0;
        await updateDoc(doc(db, 'posts', postId), {
          likes: currentLikes + 1
        });
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
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
      await deleteDoc(doc(db, 'matches', matchId));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
