'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { BookOpen, Brain, Gamepad2, Trophy, Star, Zap, Clock, Target, TrendingUp, ArrowRight, Sparkles, Rocket, Crown, Settings2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import DiagnosticTest from '@/components/DiagnosticTest'
import LearningSession from '@/components/LearningSession'
import ParentDashboard from '@/components/ParentDashboard'
import StudentAvatar from '@/components/StudentAvatar'
import StudentSettings from '@/components/StudentSettings'

export default function BridgeApp() {
  const [view, setView] = useState('welcome')
  const [userType, setUserType] = useState(null)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [student, setStudent] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUserType = localStorage.getItem('userType')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUserType && savedUser) {
      setToken(savedToken)
      setUserType(savedUserType)
      setUser(JSON.parse(savedUser))
      
      if (savedUserType === 'student') {
        setView('student-home')
      } else {
        setView('parent-dashboard')
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    setToken(null)
    setUser(null)
    setUserType(null)
    setStudent(null)
    setView('welcome')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AnimatePresence mode="wait">
        {view === 'welcome' && <WelcomeScreen setView={setView} setUserType={setUserType} />}
        {view === 'parent-login' && <ParentLogin setView={setView} setToken={setToken} setUser={setUser} setUserType={setUserType} toast={toast} />}
        {view === 'parent-signup' && <ParentSignup setView={setView} setToken={setToken} setUser={setUser} setUserType={setUserType} toast={toast} />}
        {view === 'student-pin' && <StudentPinLogin setView={setView} setToken={setToken} setUser={setUser} setUserType={setUserType} toast={toast} />}
        {view === 'parent-dashboard' && <ParentDashboard user={user} token={token} setView={setView} handleLogout={handleLogout} toast={toast} />}
        {view === 'student-home' && <StudentHome user={user} token={token} setView={setView} handleLogout={handleLogout} toast={toast} />}
        {view === 'onboarding' && <OnboardingFlow user={user} token={token} setView={setView} toast={toast} />}
        {view === 'diagnostic' && <DiagnosticTest user={user} token={token} setView={setView} toast={toast} />}
        {view === 'learning-session' && <LearningSession user={user} token={token} setView={setView} toast={toast} />}
      </AnimatePresence>
    </div>
  )
}