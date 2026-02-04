# Cricket Analyzer - Performance Tracking Platform

A comprehensive cricket performance tracking and AI-powered coaching platform built with Next.js, Firebase, and OpenAI.

## Features

### Player Portal (9 Pages)
1. **Landing Page** - Hero section with cricket images and feature highlights
2. **Login/Register** - Firebase authentication with role selection (Player/Coach)
3. **Dashboard** - Performance stats, charts, and recent matches overview
4. **Add Match** - Comprehensive match entry form with batting, bowling, and fielding stats
5. **Match History** - Filterable match cards with search functionality
6. **Analytics** - Advanced charts showing performance trends and insights
7. **AI Coach Chat** - OpenAI-powered coaching advice based on your performance
8. **Community** - Social feed for sharing achievements and connecting with others
9. **Profile** - Personal profile with career statistics and settings

### Coach Portal (3 Pages)
1. **Coach Dashboard** - Student overview, sessions, and activity tracking
2. **My Students** - Student roster with detailed progress tracking and session notes
3. **Coach Profile** - Professional profile with certifications and availability settings

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Chart.js, react-chartjs-2
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **AI**: OpenAI GPT-4o-mini for coaching advice
- **Icons**: Lucide React

## Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
OPENAI_API_KEY=your_openai_api_key
```

## Getting Started

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables in `.env` file

3. Run the development server:
```bash
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Deploy to Vercel (Recommended)

1. **Install Git** (if not already installed):
   - Download from [git-scm.com](https://git-scm.com/download/win)
   - Or skip Git and use Option 2 below

2. **Option 1: Deploy with Git**
   ```bash
   # Initialize git repository
   git init
   git add .
   git commit -m "Initial commit"
   
   # Push to GitHub
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. **Option 2: Deploy without Git**
   - Install Vercel CLI: `npm i -g vercel`
   - Run `vercel` in your project directory
   - Follow the prompts

4. **Configure on Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Import your project or connect GitHub
   - Add Environment Variables:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
     - `OPENAI_API_KEY`
   - Click "Deploy"

5. **Share the live URL** with your tutor!

### Alternative: Deploy to Netlify

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run: `netlify deploy --prod`
3. Add environment variables in Netlify dashboard

### Alternative: Deploy to Railway

1. Visit [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Add environment variables
4. Deploy automatically

## API Endpoints

### User Management
- `POST /api/user/profile` - Create user profile
- `GET /api/user/profile?uid={uid}` - Get user profile

### Matches
- `GET /api/matches?uid={uid}&format={format}` - Get user matches
- `POST /api/matches` - Add new match
- `PUT /api/matches/{id}` - Update match
- `DELETE /api/matches/{id}` - Delete match

### Statistics
- `GET /api/stats/player?uid={uid}` - Get player statistics

### AI Coach
- `POST /api/ai/chat` - Get AI coaching advice

### Community
- `GET /api/posts?uid={uid}&filter={filter}` - Get community posts
- `POST /api/posts` - Create new post
- `PUT /api/posts/{id}/like` - Like a post

### Coach Features
- `GET /api/coach/students?coachUid={uid}` - Get coach's students
- `POST /api/coach/connect` - Request coach connection
- `PUT /api/coach/connection` - Accept/reject connection request

## Key Features

### Performance Tracking
- Track batting, bowling, and fielding statistics
- Support for multiple match formats (T20, ODI, Test)
- Auto-calculated metrics (strike rate, economy rate)
- Historical performance trends

### AI Coaching
- Personalized coaching advice based on your statistics
- Context-aware responses using recent match data
- Specific drills and training recommendations

### Analytics
- Visual performance trends with charts
- Format-wise comparison
- Key insights and improvement metrics

### Coach Dashboard
- Student roster management
- Progress tracking for each student
- Session scheduling and notes
- Performance alerts for struggling students

## Design System

- **Primary Color**: Blue (#2563EB)
- **Success Color**: Green (#10B981)
- **Alert Color**: Orange (#F97316)
- **Background**: Light Gray (#F9FAFB)
- **Font**: Inter (body), Poppins (headings)
- **Border Radius**: 8px
- **Shadow**: Soft shadows for depth

## Firebase Collections

### users
```javascript
{
  uid: string,
  name: string,
  email: string,
  role: 'player' | 'coach',
  createdAt: timestamp
}
```

### matches
```javascript
{
  uid: string,
  date: string,
  format: 'T20' | 'ODI' | 'Test',
  location: string,
  batting: { runs, balls, fours, sixes, dismissal, strikeRate },
  bowling: { overs, wickets, runsConceded, maidens, economy },
  fielding: { catches, runOuts, stumpings },
  createdAt: timestamp
}
```

### posts
```javascript
{
  uid: string,
  userName: string,
  userRole: string,
  content: string,
  matchId: string (optional),
  likes: number,
  comments: array,
  createdAt: timestamp
}
```

### connections
```javascript
{
  studentUid: string,
  coachUid: string,
  message: string,
  status: 'pending' | 'accepted' | 'rejected',
  createdAt: timestamp
}
```

## Author

Built with ❤️ for cricket enthusiasts and coaches
