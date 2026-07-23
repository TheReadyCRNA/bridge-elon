import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Zap, Clock, Trophy, Star, Lightbulb, ArrowRight, CheckCircle2, XCircle, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { soundManager } from '@/lib/sounds'
import ReadingManualMode from '@/components/ReadingManualMode'

export default function LearningSession({ user, token, setView, toast }) {
  const [status, setStatus] = useState('preview')
  const [sessionId, setSessionId] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0, xp: 0 })
  const [loading, setLoading] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [currentHintLevel, setCurrentHintLevel] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(3600) // 60 minutes in seconds
  const [showBreakOverlay, setShowBreakOverlay] = useState(false)
  const [targetQuestions] = useState(30)

  useEffect(() => {
    let interval
    if (status === 'active' && !showBreakOverlay) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setShowBreakOverlay(true)
            if (soundManager) soundManager.playBreakTime()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [status, showBreakOverlay])

  const startSession = async () => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      setSessionId(data.session.id)
      setTimeRemaining(3600)
      setShowBreakOverlay(false)
      await loadNextQuestion(data.session.id)
      setStatus('active')
      toast({ title: 'Session started!', description: 'Lets learn!' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start session', variant: 'destructive' })
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    if (timeRemaining > 600) return 'text-blue-600'
    if (timeRemaining > 300) return 'text-amber-600'
    return 'text-red-600'
  }

  const handleTakeBreak = () => {
    setShowBreakOverlay(false)
    completeSession()
  }

  const handleContinue = () => {
    setShowBreakOverlay(false)
    setTimeRemaining(3600)
  }

  const loadNextQuestion = async (sessId) => {
    setLoading(true)
    setShowFeedback(false)
    setSelectedAnswer('')
    setShowHint(false)
    setCurrentHintLevel(0)
    setHintsUsed(0)
    
    try {
      const res = await fetch('/api/sessions/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId: sessId })
      })
      const data = await res.json()
      setCurrentQuestion(data.question)
    } catch (error) {
      console.error('Failed to load question:', error)
      toast({ title: 'Error', description: 'Failed to load question', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const showNextHint = () => {
    if (currentHintLevel < 3) {
      setCurrentHintLevel(prev => prev + 1)
      setShowHint(true)
      setHintsUsed(prev => prev + 1)
      if (soundManager) soundManager.playHint()
    }
  }

  const submitAnswer = () => {
    if (!selectedAnswer) return
    
    const correct = selectedAnswer === currentQuestion.correctAnswer
    setIsCorrect(correct)
    setShowFeedback(true)
    
    if (soundManager) {
      if (correct) {
        soundManager.playSuccess()
      } else {
        soundManager.playCorrection()
      }
    }
    
    setSessionStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
      xp: prev.xp + (correct ? (hintsUsed === 0 ? 15 : 10) : 0)
    }))
  }

  const handleNext = async () => {
    try {
      await fetch('/api/sessions/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          skillId: currentQuestion.skillId,
          answer: selectedAnswer,
          correct: isCorrect,
          hintsUsed
        })
      })

      const nextNumber = questionNumber + 1
      setQuestionNumber(nextNumber)

      if (nextNumber >= targetQuestions) {
        completeSession()
      } else {
        await loadNextQuestion(sessionId)
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save progress', variant: 'destructive' })
    }
  }

  const completeSession = async () => {
    try {
      await fetch('/api/sessions/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      })
      if (soundManager) soundManager.playComplete()
      setStatus('completed')
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to complete session', variant: 'destructive' })
    }
  }

  if (status === 'preview') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
              <Star className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl">Todays Learning Mission</CardTitle>
            <CardDescription className="text-lg mt-2">
              Ready for an awesome learning adventure?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-5 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-start gap-3 mb-3">
                <Info className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-blue-900 mb-2">🎯 Mission Briefing</h3>
                  <p className="text-slate-700 leading-relaxed mb-3">
                    Hey! You're in <strong>Manual Mode</strong> — that means YOU are in control of your learning. 
                    Every question makes your brain stronger, even the tricky ones!
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Remember:</strong> Mistakes are how your brain grows the most. 
                    When you get something wrong, that's your brain building new connections. 
                    Think of it like leveling up in a game — you can't skip the challenge! 💪🧠
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="font-bold text-2xl text-blue-600">~60 min</div>
                <div className="text-sm text-slate-600">Duration</div>
              </div>
              <div className="text-center p-4 bg-teal-50 rounded-xl">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                <div className="font-bold text-2xl text-teal-600">~30</div>
                <div className="text-sm text-slate-600">Questions</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <Zap className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                <div className="font-bold text-2xl text-amber-600">300+ XP</div>
                <div className="text-sm text-slate-600">Potential</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setView('student-home')} variant="outline" className="flex-1 h-14 text-lg">
                Maybe Later
              </Button>
              <Button 
                onClick={() => { startSession(); if (soundManager) soundManager.init(); }} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500 text-lg h-14"
              >
                Lets Go! 🚀
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'completed') {
    const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl">You Crushed It!</CardTitle>
            <CardDescription className="text-lg">Amazing work on todays session!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">{sessionStats.xp}</div>
                <div className="text-sm text-slate-600 mt-1">XP Earned</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
                <div className="text-sm text-slate-600 mt-1">Accuracy</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600">{sessionStats.total}</div>
                <div className="text-sm text-slate-600 mt-1">Questions</div>
              </div>
            </div>

            <Button 
              onClick={() => setView('student-home')} 
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-teal-500"
            >
              Back to Home <ArrowRight className="ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="text-base px-3 py-1">
                Question {questionNumber + 1} / {targetQuestions}
              </Badge>
              <Badge className="bg-amber-500 text-base px-3 py-1">
                <Zap className="w-4 h-4 mr-1" />
                {sessionStats.xp} XP
              </Badge>
            </div>
            <Progress value={(questionNumber / targetQuestions) * 100} className="h-3 w-64" />
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <Clock className={`w-6 h-6 ${getTimerColor()}`} />
              <div className={`text-3xl font-bold font-mono ${getTimerColor()}`}>
                {formatTime(timeRemaining)}
              </div>
            </div>
            <div className="text-sm text-slate-600">Time Remaining</div>
            {timeRemaining < 300 && (
              <div className="text-xs text-red-600 font-medium mt-1">
                Break coming soon!
              </div>
            )}
          </div>
        </div>

        {showBreakOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <Card className="w-full max-w-2xl border-4 border-blue-400 shadow-2xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-24 h-24 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center animate-pulse">
                  <Clock className="w-14 h-14 text-white" />
                </div>
                <CardTitle className="text-4xl mb-2">Time for a Break! 🎉</CardTitle>
                <CardDescription className="text-lg">
                  You've completed your first 1-hour session!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border-2 border-blue-200">
                  <h3 className="font-bold text-xl text-blue-900 mb-3 flex items-center gap-2">
                    <Star className="w-6 h-6" />
                    Great Work, {user?.name}!
                  </h3>
                  <p className="text-slate-700 leading-relaxed mb-3">
                    Your brain has been working hard! Taking breaks is an important part of learning. 
                    When you rest, your brain processes and stores everything you've learned.
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Manual Mode:</strong> You can take a break now, or if you're feeling great, 
                    keep going for your second session. Listen to your body! 💪
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600">{sessionStats.xp}</div>
                    <div className="text-sm text-slate-600">XP Earned</div>
                  </div>
                  <div className="text-center p-4 bg-teal-50 rounded-xl">
                    <div className="text-3xl font-bold text-teal-600">{sessionStats.total}</div>
                    <div className="text-sm text-slate-600">Questions Done</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={handleTakeBreak}
                    variant="outline"
                    size="lg"
                    className="flex-1 h-16 text-lg"
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    Take a Break
                  </Button>
                  <Button 
                    onClick={handleContinue}
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500 h-16 text-lg font-semibold"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Continue Session 2
                  </Button>
                </div>

                <p className="text-center text-sm text-slate-500">
                  Recommended: Take a 10-15 minute break to recharge ⚡
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentQuestion && !loading && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {currentQuestion.type === 'passage_comprehension' && currentQuestion.passage ? (
              <ReadingManualMode
                passage={currentQuestion.passage}
                question={currentQuestion.question}
                options={currentQuestion.options}
                keywords={currentQuestion.keywords || []}
                userName={user?.name || 'there'}
                onComplete={(result) => {
                  setSelectedAnswer(result.selectedAnswer)
                  if (result.selectedAnswer === currentQuestion.correctAnswer) {
                    setIsCorrect(true)
                    setShowFeedback(true)
                    if (soundManager) soundManager.playSuccess()
                    setSessionStats(prev => ({
                      correct: prev.correct + 1,
                      total: prev.total + 1,
                      xp: prev.xp + 15
                    }))
                  } else {
                    setIsCorrect(false)
                    setShowFeedback(true)
                    if (soundManager) soundManager.playCorrection()
                    setSessionStats(prev => ({
                      correct: prev.correct,
                      total: prev.total + 1,
                      xp: prev.xp
                    }))
                  }
                }}
              />
            ) : (
              <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-blue-500">{currentQuestion.skillName}</Badge>
                  <Badge variant="outline">Level {currentQuestion.difficulty}</Badge>
                </div>
                <CardTitle className="text-xl leading-relaxed">{currentQuestion.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup 
                  value={selectedAnswer} 
                  onValueChange={setSelectedAnswer}
                  disabled={showFeedback}
                >
                  <div className="space-y-4">
                    {currentQuestion.options.map((option, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center space-x-4 p-5 rounded-xl border-3 transition-all cursor-pointer min-h-[70px] ${
                          showFeedback
                            ? option === currentQuestion.correctAnswer
                              ? 'border-green-500 bg-green-50 shadow-lg'
                              : option === selectedAnswer
                              ? 'border-red-500 bg-red-50'
                              : 'border-slate-200 bg-slate-50'
                            : selectedAnswer === option
                            ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02] cursor-pointer'
                            : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md cursor-pointer'
                        }`}
                        onClick={() => !showFeedback && setSelectedAnswer(option)}
                      >
                        <RadioGroupItem value={option} id={`option-${idx}`} disabled={showFeedback} className="w-6 h-6" />
                        <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-base leading-relaxed font-medium">
                          {option}
                        </Label>
                        {showFeedback && option === currentQuestion.correctAnswer && (
                          <CheckCircle2 className="w-7 h-7 text-green-600 flex-shrink-0" />
                        )}
                        {showFeedback && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                          <XCircle className="w-7 h-7 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-blue-50 border-2 border-blue-200'}`}
                  >
                    <p className="font-medium mb-2">
                      {isCorrect ? 'Correct! Well done!' : 'Not quite, but good try!'}
                    </p>
                    <p className="text-sm text-slate-700">{currentQuestion.explanation}</p>
                  </motion.div>
                )}

                {showHint && !showFeedback && currentQuestion.hints && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-900 mb-1">Hint {currentHintLevel}:</p>
                        <p className="text-sm text-amber-800">{currentQuestion.hints[currentHintLevel - 1]}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
              <CardContent className="pt-0">
                <div className="flex justify-between">
                  {!showFeedback && (
                    <>
                      <Button
                        onClick={showNextHint}
                        variant="outline"
                        size="lg"
                        className="h-14 px-6 text-base"
                        disabled={currentHintLevel >= 3 || !currentQuestion.hints}
                      >
                        <Lightbulb className="w-5 h-5 mr-2" />
                        Need a Hint?
                      </Button>
                      <Button
                        onClick={submitAnswer}
                        disabled={!selectedAnswer}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-teal-500 h-14 px-8 text-base font-semibold"
                      >
                        Submit Answer
                      </Button>
                    </>
                  )}
                  {showFeedback && (
                    <Button
                      onClick={handleNext}
                      size="lg"
                      className="ml-auto bg-gradient-to-r from-blue-600 to-teal-500 h-14 px-8 text-base font-semibold"
                    >
                      {questionNumber + 1 >= targetQuestions ? 'Finish Session 🎉' : 'Next Question →'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            )}
          </motion.div>
        )}

        {loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-600">Loading next question...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
