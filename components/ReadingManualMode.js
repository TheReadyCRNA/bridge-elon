'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Lightbulb, CheckCircle2, Target } from 'lucide-react'

export default function ReadingManualMode({ 
  passage, 
  question, 
  options, 
  keywords = [],
  onComplete,
  userName = 'there'
}) {
  const [phase, setPhase] = useState('reading')
  const [readingTimeElapsed, setReadingTimeElapsed] = useState(0)
  const [selectedKeywords, setSelectedKeywords] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [showSpeedWarning, setShowSpeedWarning] = useState(false)
  const [recoveryTaps, setRecoveryTaps] = useState(0)
  const [highlightedSentence, setHighlightedSentence] = useState(null)
  const passageRef = useRef(null)
  
  const wordCount = passage.split(/\s+/).length
  const minReadingTime = Math.max(8, Math.round((wordCount / 140) * 60 * 0.7))
  
  useEffect(() => {
    if (phase === 'reading') {
      const interval = setInterval(() => {
        setReadingTimeElapsed(prev => {
          const next = prev + 1
          if (next >= minReadingTime) { setPhase('signal-detection'); return minReadingTime }
          return next
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [phase, minReadingTime])
  
  useEffect(() => {
    if (phase === 'signal-detection' && selectedKeywords.length < 3) {
      const timeout = setTimeout(() => { setShowHint(true) }, 8000)
      return () => clearTimeout(timeout)
    }
  }, [phase, selectedKeywords.length])
  
  const handleWordTap = (word) => {
    if (phase === 'signal-detection') {
      const normalizedWord = word.toLowerCase().replace(/[^a-z0-9]/g, '')
      const isKeyword = keywords.some(kw => kw.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedWord)
      if (isKeyword && !selectedKeywords.includes(word)) {
        const newSelected = [...selectedKeywords, word]
        setSelectedKeywords(newSelected)
        if (newSelected.length >= 3) { setTimeout(() => setPhase('answering'), 800) }
      }
    } else if (phase === 'recovery') { handleRecoveryTap(word) }
  }
  
  const handleRecoveryTap = (word) => {
    const normalizedWord = word.toLowerCase().replace(/[^a-z0-9]/g, '')
    const isAnswerKeyword = keywords.some(kw => kw.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedWord)
    if (isAnswerKeyword) {
      setTimeout(() => { onComplete({ selectedAnswer, recoverySuccess: true, keywordsFound: selectedKeywords }) }, 2000)
    } else { setRecoveryTaps(prev => prev + 1) }
  }
  
  const handleSubmit = () => {
    if (readingTimeElapsed < minReadingTime) {
      setShowSpeedWarning(true)
      setTimeout(() => setShowSpeedWarning(false), 3000)
      return
    }
    onComplete({ selectedAnswer, needsRecovery: false, keywordsFound: selectedKeywords })
  }
  
  const renderPassage = () => {
    const words = passage.split(/\s+/)
    return (
      <div ref={passageRef} className="leading-relaxed text-lg">
        {words.map((word, idx) => {
          const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '')
          const isKeyword = keywords.some(kw => kw.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanWord)
          const isSelected = selectedKeywords.some(sw => sw.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanWord)
          const showAsHint = showHint && isKeyword && !isSelected
          return (
            <span key={idx} onClick={() => handleWordTap(word)} className={`inline-block mr-1 mb-1 px-1 rounded transition-all cursor-pointer ${phase === 'signal-detection' ? isSelected ? 'bg-teal-200 text-teal-900 font-semibold scale-105' : showAsHint ? 'bg-amber-100 hover:bg-amber-200 border-2 border-amber-300' : 'hover:bg-slate-100' : phase === 'recovery' && isKeyword ? 'bg-blue-100 hover:bg-blue-200 border-2 border-blue-300' : ''}`}>{word}</span>
          )
        })}
      </div>
    )
  }
  
  const getProgressMessage = () => {
    const count = selectedKeywords.length
    if (count === 0) return "Find the key words!"
    if (count === 1) return "Nice eye! Keep going"
    if (count === 2) return "Almost there!"
    return "All signals found! Unlocking the question..."
  }
  
  const getRecoveryHint = () => {
    if (recoveryTaps === 0) return "Tap the word you missed"
    if (recoveryTaps === 1) return "Not quite - look for specific info"
    if (recoveryTaps === 2) return "Hint: name, number, or action word"
    return "Look at the highlighted sentence carefully"
  }

  return (
    <div className="space-y-6">
      {phase === 'reading' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2"><Eye className="w-6 h-6 text-blue-600" />Reading Time</CardTitle>
                <Badge className="bg-blue-500">{readingTimeElapsed}s / {minReadingTime}s</Badge>
              </div>
              <Progress value={(readingTimeElapsed / minReadingTime) * 100} className="h-3 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-slate-50 rounded-xl"><p className="text-lg leading-relaxed text-slate-800">{passage}</p></div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <p className="text-sm text-blue-900 font-medium"><strong>Slow down, {userName}!</strong> Make sure you catch all the details. The question will unlock in {minReadingTime - readingTimeElapsed} seconds.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {phase === 'signal-detection' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-2 border-teal-200">
            <CardHeader>
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-xl flex items-center gap-2"><Target className="w-6 h-6 text-teal-600" />Signal Detection</CardTitle>
                <div className="flex gap-2">{[0, 1, 2].map((i) => (<div key={i} className={`w-4 h-4 rounded-full transition-all ${i < selectedKeywords.length ? 'bg-teal-500 scale-110' : 'bg-slate-300'}`} />))}</div>
              </div>
              <p className="text-base text-teal-700 font-medium">{getProgressMessage()}</p>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-slate-50 rounded-xl border-2 border-slate-200">{renderPassage()}</div>
              {showHint && selectedKeywords.length < 3 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                  <div className="flex items-start gap-2"><Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" /><p className="text-sm text-amber-900"><strong>Need a hint?</strong> The important words are highlighted in yellow. Tap them to unlock the question!</p></div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {phase === 'answering' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-xl leading-relaxed">{question}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {options.map((option, idx) => (
                  <div key={idx} onClick={() => setSelectedAnswer(option)} className={`flex items-center space-x-4 p-5 rounded-xl border-3 transition-all cursor-pointer min-h-[70px] ${selectedAnswer === option ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md'}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAnswer === option ? 'border-blue-500 bg-blue-500' : 'border-slate-400'}`}>{selectedAnswer === option && (<CheckCircle2 className="w-4 h-4 text-white" />)}</div>
                    <span className="flex-1 cursor-pointer text-base leading-relaxed font-medium">{option}</span>
                  </div>
                ))}
              </div>
              <Button onClick={handleSubmit} disabled={!selectedAnswer} size="lg" className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-teal-500">Submit Answer</Button>
            </CardContent>
          </Card>
          <AnimatePresence>
            {showSpeedWarning && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
                <Card className="border-2 border-amber-400 bg-amber-50 shadow-xl"><CardContent className="p-6"><p className="text-lg font-medium text-amber-900">Slow down, {userName}! Make sure you caught all the details.</p></CardContent></Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {phase === 'recovery' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2"><Target className="w-6 h-6 text-blue-600" />Let's Find That Detail</CardTitle>
              <p className="text-base text-blue-700 font-medium mt-2">{getRecoveryHint()}</p>
            </CardHeader>
            <CardContent><div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">{renderPassage()}</div></CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
