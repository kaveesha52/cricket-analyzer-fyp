import { adminDb } from '@/lib/firebaseAdmin'

export async function GET(request) {
  try {
    const uid = request.headers.get('x-user-id')
    
    if (!uid) {
      console.log('❌ GET /api/chat: No UID provided')
      return Response.json({ error: 'User not authenticated' }, { status: 401 })
    }

    console.log('📥 GET /api/chat: Loading chats for user:', uid)
    
    // Try to load with orderBy first
    let snapshot
    try {
      snapshot = await adminDb
        .collection(`users/${uid}/aiCoachChats`)
        .orderBy('updatedAt', 'desc')
        .get()
    } catch (orderError) {
      // If orderBy fails, fallback to unordered query
      console.warn('⚠️ orderBy failed, trying unordered query:', orderError.message)
      snapshot = await adminDb
        .collection(`users/${uid}/aiCoachChats`)
        .get()
    }

    const chats = []
    snapshot.forEach(doc => {
      chats.push({
        id: doc.id,
        ...doc.data()
      })
    })

    // Sort by updatedAt in JavaScript if orderBy wasn't used
    chats.sort((a, b) => {
      const aTime = a.updatedAt?.toDate?.() || new Date(a.updatedAt) || 0
      const bTime = b.updatedAt?.toDate?.() || new Date(b.updatedAt) || 0
      return bTime - aTime
    })

    console.log('✅ GET /api/chat: Loaded', chats.length, 'chats')
    return Response.json({ chats })
  } catch (error) {
    console.error('❌ Error fetching chats:', error.message, error.code)
    // If collection doesn't exist, return empty array instead of error
    if (error.code === 'FAILED_PRECONDITION' || error.code === 'PERMISSION_DENIED') {
      console.log('⚠️ Collection access issue, returning empty array')
      return Response.json({ chats: [] })
    }
    return Response.json({ error: 'Failed to fetch chats', details: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  console.log('🔵 POST /api/chat called at', new Date().toISOString())
  try {
    const uid = request.headers.get('x-user-id')
    if (!uid) {
      console.log('❌ POST /api/chat: No UID provided')
      return Response.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { messages, chatId } = body

    console.log('📤 POST /api/chat: Received request', {
      uid,
      chatId: chatId || 'NEW',
      messagesCount: messages?.length || 0,
      bodyKeys: Object.keys(body)
    })

    if (!messages || messages.length === 0) {
      console.log('❌ POST /api/chat: No messages provided')
      return Response.json({ error: 'No messages to save' }, { status: 400 })
    }

    console.log('📤 POST /api/chat: Saving', messages.length, 'messages for user:', uid)
    console.log('   First 3 messages:', messages.slice(0, 3).map(m => ({ id: m.id, type: m.type, textLen: m.text?.length })))

    if (!chatId) {
      // Create new chat
      console.log('   Creating NEW chat...')
      const chatRef = await adminDb
        .collection(`users/${uid}/aiCoachChats`)
        .add({
          messages,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      console.log('✅ POST /api/chat: Created new chat:', chatRef.id)
      return Response.json({ chatId: chatRef.id, success: true })
    } else {
      // Update existing chat
      console.log('   Updating chat:', chatId)
      await adminDb
        .collection(`users/${uid}/aiCoachChats`)
        .doc(chatId)
        .update({
          messages,
          updatedAt: new Date()
        })
      console.log('✅ POST /api/chat: Updated chat:', chatId)
      return Response.json({ chatId, success: true })
    }
  } catch (error) {
    console.error('❌ Error in POST /api/chat:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return Response.json({ error: 'Failed to save chat', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const uid = request.headers.get('x-user-id')
    if (!uid) {
      console.log('❌ DELETE /api/chat: No UID provided')
      return Response.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')

    if (!chatId) {
      console.log('❌ DELETE /api/chat: No chatId provided')
      return Response.json({ error: 'Chat ID required' }, { status: 400 })
    }

    console.log('🗑️ DELETE /api/chat: Deleting chat:', chatId, 'for user:', uid)

    await adminDb
      .collection(`users/${uid}/aiCoachChats`)
      .doc(chatId)
      .delete()
    
    console.log('✅ DELETE /api/chat: Deleted chat:', chatId)
    return Response.json({ success: true })
  } catch (error) {
    console.error('❌ Error deleting chat:', error.message, error.code)
    return Response.json({ error: 'Failed to delete chat', details: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const uid = request.headers.get('x-user-id')
    if (!uid) {
      console.log('❌ PUT /api/chat: No UID provided')
      return Response.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { chatId, name } = body

    if (!chatId) {
      console.log('❌ PUT /api/chat: No chatId provided')
      return Response.json({ error: 'Chat ID required' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.log('❌ PUT /api/chat: Invalid name provided')
      return Response.json({ error: 'Chat name required' }, { status: 400 })
    }

    console.log('✏️ PUT /api/chat: Renaming chat:', chatId, 'to:', name)

    await adminDb
      .collection(`users/${uid}/aiCoachChats`)
      .doc(chatId)
      .update({
        name: name.trim(),
        updatedAt: new Date()
      })
    
    console.log('✅ PUT /api/chat: Renamed chat:', chatId)
    return Response.json({ success: true })
  } catch (error) {
    console.error('❌ Error renaming chat:', error.message, error.code)
    return Response.json({ error: 'Failed to rename chat', details: error.message }, { status: 500 })
  }
}
