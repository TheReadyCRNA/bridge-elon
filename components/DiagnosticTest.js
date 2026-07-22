'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Brain, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DiagnosticTest({ user, token, setView, toast }) {
  const [status, setStatus] = useState('loading')
  const [diagnosticId, setDiagnosticId] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [totalQuestions] = useState(60)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [currentMastery, setCurrentMastery] = useState({})
  const [loading, setLoading] = useState(false)
  const [masteryResults, setMasteryResults] = useState(null)

  useEffect(() => {
    startDiagnostic()
  }, [])

  const startDiagnostic = async () => {
    try {
      const res = await fetch('/api/diagnostic/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setDiagnosticId(data.diagnostic.id)
      await loadNextQuestion(data.diagnostic.id, {})
      setStatus('testing')
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start diagnostic', variant: 'destructive' })
    }
  }

  const loadNextQuestion = async (diagId, mastery) => {
    setLoading(true)
    try {
      const res = await fetch('/api/diagnostic/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ diagnosticId: diagId, currentMastery: mastery })
      })
      const data = await res.json()
      setCurrentQuestion(data.question)
      setSelectedAnswer('')
    } catch (error) {
      console.error('Failed to load question:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!selectedAnswer || loading) return
    const correct = selectedAnswer === currentQuestion.correctAnswer
    const newMastery = { ...currentMastery }
    if (!newMastery[currentQuestion.skillId]) { newMastery[currentQuestion.skillId] = 50 }
    newMastery[currentQuestion.skillId] += correct ? 10 : -10
    newMastery[currentQuestion.skillId] = Math.max(0, Math.min(100, newMastery[currentQuestion.skillId]))
    setCurrentMastery(newMastery)

    try {
      await fetch('/api/diagnostic/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ diagnosticId, questionId: currentQuestion.id, skillId: currentQuestion.skillId, answer: selectedAnswer, correct, timeTaken: 0 })
      })
      const nextNumber = questionNumber + 1
      setQuestionNumber(nextNumber)
      if (nextNumber >= totalQuestions) { completeDiagnostic() } else { await loadNextQuestion(diagnosticId, newMastery) }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit answer', variant: 'destructive' })
    }
  }

  const completeDiagnostic = async () => {
    try {
      const res = await fetch('/api/diagnostic/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ diagnosticId })
      })
      const data = await res.json()
      setMasteryResults(data.masteryScores)
      setStatus('completed')
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to complete diagnostic', variant: 'destructive' })
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">Preparing Your Diagnostic...</h2>
            <p className="text-slate-600">This will help us understand your strengths!</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl">Awesome Job! 🎉</CardTitle>
            <CardDescription className="text-lg">You completed the diagnostic assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <p className="text-lg font-medium mb-2">We have identified your learning profile!</p>
              <p className="text-slate-600">Now we can create a personalized learning plan just for you.</p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Your Skill Snapshot:</h3>
              {masteryResults && Object.entries(masteryResults).slice(0, 8).map(([skillId, score]) => (
                <div key={skillId}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{skillId.split('-').pop()}</span>
                    <span className="text-sm font-bold text-blue-600">{score}%</span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
            </div>
            <Button onClick={() => setView('student-home')} className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-teal-500">Start Learning! 🚀</Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold">Diagnostic Assessment</h1>
            <Badge variant="secondary" className="text-base px-4 py-2">{questionNumber + 1} / {totalQuestions}</Badge>
          </div>
          <Progress value={(questionNumber / totalQuestions) * 100} className="h-3" />
        </div>
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>{currentQuestion.skillName}</Badge>
                    <Badge variant="outline">Level {currentQuestion.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, idx) => (
                        <div key={idx} className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedAnswer === option ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`} onClick={() => setSelectedAnswer(option)}>
                          <RadioGroupItem value={option} id={`option-${idx}`} />
                          <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-base">{option}</Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button onClick={submitAnswer} disabled={!selectedAnswer || loading} size="lg" className="bg-gradient-to-r from-blue-600 to-teal-500">
                  {loading ? 'Loading...' : questionNumber + 1 === totalQuestions ? 'Finish!' : 'Next Question →'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
