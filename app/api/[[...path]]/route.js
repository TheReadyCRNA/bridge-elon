import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import OpenAI from 'openai'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// OpenAI client for question generation
const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL
})

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// JWT verification middleware
function verifyToken(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  
  const token = authHeader.replace('Bearer ', '')
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Initialize database with curriculum
async function initializeCurriculum(db) {
  const subjects = [
    { id: 'math', name: 'Math', icon: '\ud83d\udd22', color: 'bg-blue-500' },
    { id: 'reading', name: 'Reading', icon: '\ud83d\udcda', color: 'bg-green-500' },
    { id: 'writing', name: 'Writing', icon: '\u270d\ufe0f', color: 'bg-purple-500' },
    { id: 'language', name: 'Language Arts', icon: '\ud83d\udcdd', color: 'bg-pink-500' },
    { id: 'science', name: 'Science', icon: '\ud83d\udd2c', color: 'bg-teal-500' },
    { id: 'social', name: 'Social Studies', icon: '\ud83c\udf0d', color: 'bg-orange-500' }
  ]
  
  const skills = [
    { id: 'math-fractions', subjectId: 'math', name: 'Fractions', description: 'Adding, subtracting, and comparing fractions', difficulty: 1 },
    { id: 'math-decimals', subjectId: 'math', name: 'Decimals', description: 'Decimal operations and place value', difficulty: 1 },
    { id: 'math-percentages', subjectId: 'math', name: 'Percentages', description: 'Converting and calculating percentages', difficulty: 2 },
    { id: 'math-geometry', subjectId: 'math', name: 'Basic Geometry', description: 'Shapes, angles, and area', difficulty: 1 },
    { id: 'math-word-problems', subjectId: 'math', name: 'Word Problems', description: 'Multi-step problem solving', difficulty: 2 },
    { id: 'math-order-ops', subjectId: 'math', name: 'Order of Operations', description: 'PEMDAS and arithmetic', difficulty: 1 },
    { id: 'math-ratios', subjectId: 'math', name: 'Ratios & Proportions', description: 'Understanding ratios and rates', difficulty: 2 },
    { id: 'math-integers', subjectId: 'math', name: 'Integers', description: 'Positive and negative numbers', difficulty: 1 },
    { id: 'reading-comprehension', subjectId: 'reading', name: 'Reading Comprehension', description: 'Understanding main ideas and details', difficulty: 1 },
    { id: 'reading-inference', subjectId: 'reading', name: 'Making Inferences', description: 'Drawing conclusions from text', difficulty: 2 },
    { id: 'reading-vocabulary', subjectId: 'reading', name: 'Vocabulary', description: 'Context clues and word meanings', difficulty: 1 },
    { id: 'reading-theme', subjectId: 'reading', name: 'Theme & Main Idea', description: 'Identifying central themes', difficulty: 2 },
    { id: 'reading-character', subjectId: 'reading', name: 'Character Analysis', description: 'Understanding character traits', difficulty: 1 },
    { id: 'reading-plot', subjectId: 'reading', name: 'Plot Structure', description: 'Story elements and sequence', difficulty: 1 },
    { id: 'reading-fact-opinion', subjectId: 'reading', name: 'Fact vs Opinion', description: 'Distinguishing facts from opinions', difficulty: 1 },
    { id: 'reading-compare', subjectId: 'reading', name: 'Compare & Contrast', description: 'Analyzing similarities and differences', difficulty: 2 },
    { id: 'writing-essay', subjectId: 'writing', name: 'Essay Structure', description: 'Introduction, body, conclusion', difficulty: 2 },
    { id: 'writing-paragraph', subjectId: 'writing', name: 'Paragraph Writing', description: 'Topic sentences and support', difficulty: 1 },
    { id: 'writing-narrative', subjectId: 'writing', name: 'Narrative Writing', description: 'Telling stories effectively', difficulty: 1 },
    { id: 'writing-persuasive', subjectId: 'writing', name: 'Persuasive Writing', description: 'Arguments and evidence', difficulty: 2 },
    { id: 'writing-descriptive', subjectId: 'writing', name: 'Descriptive Writing', description: 'Using sensory details', difficulty: 1 },
    { id: 'writing-editing', subjectId: 'writing', name: 'Editing & Revision', description: 'Improving written work', difficulty: 2 },
    { id: 'language-grammar', subjectId: 'language', name: 'Grammar', description: 'Parts of speech and sentence structure', difficulty: 1 },
    { id: 'language-punctuation', subjectId: 'language', name: 'Punctuation', description: 'Correct use of punctuation marks', difficulty: 1 },
    { id: 'language-capitalization', subjectId: 'language', name: 'Capitalization', description: 'Proper capitalization rules', difficulty: 1 },
    { id: 'language-spelling', subjectId: 'language', name: 'Spelling Patterns', description: 'Common spelling rules', difficulty: 1 },
    { id: 'language-sentences', subjectId: 'language', name: 'Sentence Types', description: 'Simple, compound, complex sentences', difficulty: 2 },
    { id: 'language-verbs', subjectId: 'language', name: 'Verb Tenses', description: 'Past, present, future tenses', difficulty: 1 },
    { id: 'science-life', subjectId: 'science', name: 'Life Science', description: 'Living organisms and ecosystems', difficulty: 1 },
    { id: 'science-earth', subjectId: 'science', name: 'Earth Science', description: 'Weather, rocks, and Earth systems', difficulty: 1 },
    { id: 'science-physical', subjectId: 'science', name: 'Physical Science', description: 'Matter, energy, and forces', difficulty: 2 },
    { id: 'science-method', subjectId: 'science', name: 'Scientific Method', description: 'Observation and experimentation', difficulty: 1 },
    { id: 'science-classify', subjectId: 'science', name: 'Classification', description: 'Grouping and categorizing', difficulty: 1 },
    { id: 'science-data', subjectId: 'science', name: 'Data Analysis', description: 'Reading graphs and charts', difficulty: 2 },
    { id: 'social-geography', subjectId: 'social', name: 'Geography', description: 'Maps, locations, and regions', difficulty: 1 },
    { id: 'social-history', subjectId: 'social', name: 'US History', description: 'Important historical events', difficulty: 1 },
    { id: 'social-government', subjectId: 'social', name: 'Government', description: 'How government works', difficulty: 2 },
    { id: 'social-economics', subjectId: 'social', name: 'Economics', description: 'Goods, services, and money', difficulty: 1 },
    { id: 'social-culture', subjectId: 'social', name: 'Culture & Society', description: 'Different cultures and traditions', difficulty: 1 },
    { id: 'social-citizenship', subjectId: 'social', name: 'Citizenship', description: 'Rights and responsibilities', difficulty: 1 }
  ]
  
  const existingSubjects = await db.collection('subjects').countDocuments()
  if (existingSubjects === 0) {
    await db.collection('subjects').insertMany(subjects)
    await db.collection('skills').insertMany(skills)
    console.log('Curriculum initialized')
  }
}

async function generateQuestion(skillName, skillDescription, difficulty, interests = {}, subjectId = '') {
  const contextPrompt = (interests && interests.sports) ? `The student loves ${interests.sports}, especially basketball.` : ''
  const isReadingSubject = subjectId === 'reading' || subjectId === 'language'
  const isComprehensionSkill = skillName.toLowerCase().includes('comprehension') || skillName.toLowerCase().includes('inference') || skillName.toLowerCase().includes('theme') || skillName.toLowerCase().includes('character') || skillName.toLowerCase().includes('plot')
  const needsPassage = isReadingSubject && isComprehensionSkill && difficulty >= 2
  
  let prompt
  if (needsPassage) {
    prompt = `Generate a 5th-6th grade reading comprehension question with passage for "${skillName}" (${skillDescription}).\nDifficulty level: ${difficulty}/3\n${contextPrompt}\n\nCRITICAL REQUIREMENTS:\n1. Include a SHORT reading passage (80-120 words) appropriate for 11-12 year olds\n2. The passage MUST contain 3-5 KEY WORDS/PHRASES that are critical to answering the question\n3. The "correctAnswer" field MUST be EXACTLY one of the four options\n4. List the keywords separately\n\nReturn ONLY valid JSON in this exact format:\n{\n  "passage": "The reading passage text here...",\n  "keywords": ["keyword1", "keyword2", "keyword3"],\n  "question": "The question about the passage",\n  "options": ["Option A", "Option B", "Option C", "Option D"],\n  "correctAnswer": "Option A",\n  "explanation": "Why this is correct",\n  "hints": ["Nudge hint", "Guided hint", "Full explanation"]\n}\n\nVERIFICATION STEP: Ensure correctAnswer matches one option EXACTLY and keywords are present in passage.`
  } else {
    prompt = `Generate a 5th-6th grade level educational question for the skill "${skillName}" (${skillDescription}).\nDifficulty level: ${difficulty}/3\n${contextPrompt}\n\nCRITICAL REQUIREMENTS:\n1. The "correctAnswer" field MUST be EXACTLY one of the four options provided in the "options" array\n2. Copy the correct option text EXACTLY, character-for-character, into the "correctAnswer" field\n3. Verify before outputting that correctAnswer matches one option EXACTLY\n\nReturn ONLY valid JSON in this exact format:\n{\n  "question": "The question text",\n  "options": ["Option A", "Option B", "Option C", "Option D"],\n  "correctAnswer": "Option A",\n  "explanation": "Why this is correct",\n  "hints": ["Nudge hint", "Guided hint", "Full explanation"]\n}\n\nVERIFICATION STEP: Before returning JSON, check that correctAnswer is found in the options array.`
  }

  const maxRetries = 3
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
      const content = response.choices[0].message.content.trim()
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      const questionData = JSON.parse(jsonStr)
      if (!questionData.options || !Array.isArray(questionData.options)) { console.error('Invalid options array'); continue }
      if (!questionData.options.includes(questionData.correctAnswer)) {
        const trimmedAnswer = questionData.correctAnswer.trim()
        const matchedOption = questionData.options.find(opt => opt.trim() === trimmedAnswer || opt.trim().toLowerCase() === trimmedAnswer.toLowerCase())
        if (matchedOption) { questionData.correctAnswer = matchedOption } else { continue }
      }
      if (questionData.passage) { questionData.type = 'passage_comprehension' }
      return questionData
    } catch (error) {
      console.error(`Question generation attempt ${attempt + 1} failed:`, error)
      if (attempt === maxRetries - 1) {
        return { question: `Practice question for ${skillName}: ${skillDescription}`, options: ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4'], correctAnswer: 'Answer 1', explanation: 'This is the correct answer', hints: ['Think about what you know', 'Consider the key concept', 'The answer is Answer 1'] }
      }
    }
  }
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()
    await initializeCurriculum(db)

    if (route === '/auth/signup' && method === 'POST') {
      const body = await request.json()
      const { email, password, name } = body
      if (!email || !password || !name) return handleCORS(NextResponse.json({ error: 'Missing required fields' }, { status: 400 }))
      const existingUser = await db.collection('users').findOne({ email })
      if (existingUser) return handleCORS(NextResponse.json({ error: 'Email already exists' }, { status: 400 }))
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = { id: uuidv4(), email, password: hashedPassword, name, role: 'parent', createdAt: new Date() }
      await db.collection('users').insertOne(user)
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET)
      return handleCORS(NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } }))
    }
    
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body
      const user = await db.collection('users').findOne({ email })
      if (!user || !(await bcrypt.compare(password, user.password))) return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET)
      return handleCORS(NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } }))
    }
    
    if (route === '/auth/student-login' && method === 'POST') {
      const body = await request.json()
      const { pin } = body
      const student = await db.collection('students').findOne({ pin })
      if (!student) return handleCORS(NextResponse.json({ error: 'Invalid PIN' }, { status: 401 }))
      const token = jwt.sign({ id: student.id, name: student.name, role: 'student' }, process.env.JWT_SECRET)
      return handleCORS(NextResponse.json({ token, student: { id: student.id, name: student.name, avatar: student.avatar } }))
    }
    
    if (route === '/students' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'parent') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { name, pin, avatar } = body
      if (!name || !pin || pin.length !== 4) return handleCORS(NextResponse.json({ error: 'Invalid input' }, { status: 400 }))
      const student = { id: uuidv4(), parentId: user.id, name, pin, avatar: avatar || 'avatar1', createdAt: new Date() }
      await db.collection('students').insertOne(student)
      return handleCORS(NextResponse.json({ student }))
    }
    
    if (route === '/students' && method === 'GET') {
      const user = verifyToken(request)
      if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const students = await db.collection('students').find({ parentId: user.id }).toArray()
      return handleCORS(NextResponse.json({ students }))
    }
    
    if (route === '/students/profile' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'student') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const profile = { studentId: user.id, ...body, createdAt: new Date() }
      await db.collection('interest_profiles').updateOne({ studentId: user.id }, { $set: profile }, { upsert: true })
      return handleCORS(NextResponse.json({ profile }))
    }
    
    if (route === '/students/profile' && method === 'GET') {
      const user = verifyToken(request)
      if (!user || user.role !== 'student') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const profile = await db.collection('interest_profiles').findOne({ studentId: user.id })
      return handleCORS(NextResponse.json({ profile }))
    }
    
    if (route === '/students/update-avatar' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'student') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { avatar } = body
      await db.collection('students').updateOne({ id: user.id }, { $set: { avatar, updatedAt: new Date() } })
      return handleCORS(NextResponse.json({ success: true, avatar }))
    }
    
    if (route === '/subjects' && method === 'GET') {
      const subjects = await db.collection('subjects').find({}).toArray()
      return handleCORS(NextResponse.json({ subjects }))
    }
    
    if (route === '/skills' && method === 'GET') {
      const skills = await db.collection('skills').find({}).toArray()
      return handleCORS(NextResponse.json({ skills }))
    }
    
    if (route === '/diagnostic/start' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'student') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const diagnostic = { id: uuidv4(), studentId: user.id, status: 'in_progress', currentQuestion: 0, totalQuestions: 60, responses: [], startedAt: new Date() }
      await db.collection('diagnostics').insertOne(diagnostic)
      return handleCORS(NextResponse.json({ diagnostic }))
    }
    
    if (route === '/diagnostic/question' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'student') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { diagnosticId, currentMastery = {} } = body
      const profile = await db.collection('interest_profiles').findOne({ studentId: user.id })
      const subjects = await db.collection('subjects').find({}).toArray()
      const subjectIndex = Object.keys(currentMastery).length % subjects.length
      const subject = subjects[subjectIndex]
      const skills = await db.collection('skills').find({ subjectId: subject.id }).toArray()
      const skill = skills[Math.floor(Math.random() * skills.length)]
      let difficulty = 2
      if (currentMastery[skill.id]) difficulty = currentMastery[skill.id] > 70 ? 3 : currentMastery[skill.id] > 40 ? 2 : 1
      const questionData = await generateQuestion(skill.name, skill.description, difficulty, profile, subject.id)
      const question = { id: uuidv4(), skillId: skill.id, subjectId: subject.id, skillName: skill.name, difficulty, ...questionData }
      return handleCORS(NextResponse.json({ question }))
    }
    
    if (route === '/diagnostic/answer' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'student') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { diagnosticId, questionId, skillId, answer, correct, timeTaken } = body
      await db.collection('diagnostics').updateOne({ id: diagnosticId }, { $push: { responses: { questionId, skillId, answer, correct, timeTaken, timestamp: new Date() } }, $inc: { currentQuestion: 1 } })
      return handleCORS(NextResponse.json({ success: true }))
    }
    
    if (route === '/diagnostic/complete' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'student') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { diagnosticId } = body
      const diagnostic = await db.collection('diagnostics').findOne({ id: diagnosticId })
      const skillMastery = {}
      diagnostic.responses.forEach(r => { if (!skillMastery[r.skillId]) skillMastery[r.skillId] = { correct: 0, total: 0 }; skillMastery[r.skillId].total++; if (r.correct) skillMastery[r.skillId].correct++ })
      const masteryScores = {}
      Object.keys(skillMastery).forEach(skillId => { masteryScores[skillId] = Math.round((skillMastery[skillId].correct / skillMastery[skillId].total) * 100) })
      await db.collection('diagnostics').updateOne({ id: diagnosticId }, { $set: { status: 'completed', masteryScores, completedAt: new Date() } })
      const masteryDocs = Object.keys(masteryScores).map(skillId => ({ studentId: user.id, skillId, mastery: masteryScores[skillId], attempts: 0, lastPracticed: new Date() }))
      for (const doc of masteryDocs) { await db.collection('student_skill_mastery').updateOne({ studentId: user.id, skillId: doc.skillId }, { $set: doc }, { upsert: true }) }
      return handleCORS(NextResponse.json({ masteryScores }))
    }
    
    if (route === '/sessions/start' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'student') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const session = { id: uuidv4(), studentId: user.id, startedAt: new Date(), questions: [], xpEarned: 0, status: 'in_progress' }
      await db.collection('sessions').insertOne(session)
      return handleCORS(NextResponse.json({ session }))
    }
    
    if (route === '/sessions/question' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'student') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { sessionId } = body
      const profile = await db.collection('interest_profiles').findOne({ studentId: user.id })
      let masteryData = await db.collection('student_skill_mastery').find({ studentId: user.id }).toArray()
      if (masteryData.length === 0) {
        const allSkills = await db.collection('skills').find({}).toArray()
        const defaultMasteryData = allSkills.map(skill => ({ studentId: user.id, skillId: skill.id, subjectId: skill.subjectId, mastery: 50, questionsAnswered: 0, createdAt: new Date() }))
        if (defaultMasteryData.length > 0) { await db.collection('student_skill_mastery').insertMany(defaultMasteryData); masteryData = defaultMasteryData }
      }
      const skillsBySubject = {}
      masteryData.forEach(skill => { if (!skillsBySubject[skill.subjectId]) skillsBySubject[skill.subjectId] = []; skillsBySubject[skill.subjectId].push(skill) })
      const session = await db.collection('sessions').findOne({ id: sessionId })
      const recentSubjects = session?.questions?.slice(-6).map(q => q.subjectId) || []
      const subjectIds = Object.keys(skillsBySubject)
      const availableSubjects = subjectIds.filter(subj => !recentSubjects.includes(subj))
      const targetSubjectId = availableSubjects.length > 0 ? availableSubjects[Math.floor(Math.random() * availableSubjects.length)] : subjectIds[Math.floor(Math.random() * subjectIds.length)]
      const subjectSkills = skillsBySubject[targetSubjectId].sort((a, b) => a.mastery - b.mastery)
      const targetSkill = subjectSkills[Math.floor(Math.random() * Math.min(3, subjectSkills.length))]
      if (!targetSkill) return handleCORS(NextResponse.json({ error: 'No skills available' }, { status: 400 }))
      const skill = await db.collection('skills').findOne({ id: targetSkill.skillId })
      const difficulty = targetSkill.mastery > 70 ? 3 : targetSkill.mastery > 40 ? 2 : 1
      const questionData = await generateQuestion(skill.name, skill.description, difficulty, profile, skill.subjectId)
      const question = { id: uuidv4(), skillId: skill.id, subjectId: skill.subjectId, skillName: skill.name, difficulty, ...questionData }
      return handleCORS(NextResponse.json({ question }))
    }
    
    if (route === '/sessions/answer' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'student') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { sessionId, questionId, skillId, answer, correct, hintsUsed } = body
      let xp = correct ? 10 : 0
      if (hintsUsed === 0) xp += 5
      await db.collection('sessions').updateOne({ id: sessionId }, { $push: { questions: { questionId, skillId, answer, correct, hintsUsed, timestamp: new Date() } }, $inc: { xpEarned: xp } })
      const currentMastery = await db.collection('student_skill_mastery').findOne({ studentId: user.id, skillId })
      if (currentMastery) {
        let newMastery = currentMastery.mastery
        if (correct) newMastery = Math.min(100, newMastery + 5)
        else newMastery = Math.max(0, newMastery - 2)
        await db.collection('student_skill_mastery').updateOne({ studentId: user.id, skillId }, { $set: { mastery: newMastery, lastPracticed: new Date() }, $inc: { attempts: 1 } })
      }
      return handleCORS(NextResponse.json({ success: true, xpEarned: xp }))
    }
    
    if (route === '/sessions/complete' && method === 'POST') {
      const user = verifyToken(request)
      if (!user || user.role !== 'student') return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { sessionId } = body
      const session = await db.collection('sessions').findOne({ id: sessionId })
      const duration = Math.round((new Date() - session.startedAt) / 1000 / 60)
      await db.collection('sessions').updateOne({ id: sessionId }, { $set: { status: 'completed', duration, completedAt: new Date() } })
      return handleCORS(NextResponse.json({ session: { ...session, duration, questionsAnswered: session.questions.length, correctAnswers: session.questions.filter(q => q.correct).length } }))
    }
    
    if (route === '/dashboard/mastery' && method === 'GET') {
      const user = verifyToken(request)
      if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const studentId = user.role === 'student' ? user.id : new URL(request.url).searchParams.get('studentId')
      const mastery = await db.collection('student_skill_mastery').find({ studentId }).toArray()
      const skills = await db.collection('skills').find({}).toArray()
      const subjects = await db.collection('subjects').find({}).toArray()
      return handleCORS(NextResponse.json({ mastery, skills, subjects }))
    }
    
    if (route === '/dashboard/sessions' && method === 'GET') {
      const user = verifyToken(request)
      if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const studentId = user.role === 'student' ? user.id : new URL(request.url).searchParams.get('studentId')
      const sessions = await db.collection('sessions').find({ studentId, status: 'completed' }).sort({ completedAt: -1 }).limit(20).toArray()
      return handleCORS(NextResponse.json({ sessions }))
    }
    
    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
