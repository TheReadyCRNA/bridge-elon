# Bridge Summer Learning App

A comprehensive summer learning platform designed for rising 6th graders, featuring adaptive learning, diagnostic testing, and personalized curriculum across 6 core subjects.

## Features

- 🎯 **Adaptive Learning Engine**: AI-powered question generation with difficulty adjustment
- 📚 **6 Full Subjects**: Reading, Writing, Language Arts, Math, Science, Social Studies
- 🔐 **Dual Authentication**: Parent accounts (email/password) and Student PIN login
- 📊 **Parent Dashboard**: Track progress, view executive briefings, monitor XP and mastery
- ⏱️ **Session Timer**: 1-hour learning sessions with break reminders
- 🎨 **Student Settings**: Theme toggle (Light/Dark), text size adjustment, photo avatar upload
- 📖 **Reading Manual Mode**: Special reading comprehension flow with passage analysis
- 🏆 **Gamification**: XP points, streaks, levels, and achievements

## Tech Stack

- **Frontend**: Next.js 15.5.16 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **AI**: OpenAI-compatible API for question generation
- **Authentication**: JWT with bcryptjs

## Deployment to Vercel

### Prerequisites

1. MongoDB Atlas account (or MongoDB connection string)
2. OpenAI API key (or compatible LLM API)
3. Vercel account

### Environment Variables

Set these in your Vercel project settings:

```bash
MONGO_URL=mongodb+srv://your-connection-string
DB_NAME=bridge_learning
JWT_SECRET=your-secure-random-string-min-32-chars
LLM_API_KEY=your-llm-api-key
LLM_BASE_URL=https://api.openai.com/v1
CORS_ORIGINS=*
```

### Deploy Steps

1. Push to GitHub
2. Import to Vercel - Go to vercel.com/new, import bridge-elon repository
3. Framework: Next.js (auto-detected)
4. Add environment variables
5. Deploy - app will be live at your-project.vercel.app

## Local Development

```bash
yarn install
cp .env.example .env
yarn dev
```

## Architecture

- `/app/page.js`: Main application entry point
- `/app/api/[[...path]]/route.js`: Unified API handler
- `/components/`: React components
- `/lib/`: Utility functions

## License

MIT
