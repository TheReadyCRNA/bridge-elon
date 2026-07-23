import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, User, CheckCircle2, Target } from 'lucide-react'
import { format } from 'date-fns'

export default function ParentDashboard({ user, token, setView, handleLogout, toast }) {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [mastery, setMastery] = useState(null)
  const [sessions, setSessions] = useState([])
  const [showCreateStudent, setShowCreateStudent] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: '', pin: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setStudents(data.students || [])
      if (data.students && data.students.length > 0) {
        loadStudentData(data.students[0].id)
        setSelectedStudent(data.students[0])
      }
    } catch (error) {
      console.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const loadStudentData = async (studentId) => {
    try {
      const [masteryRes, sessionsRes] = await Promise.all([
        fetch(`/api/dashboard/mastery?studentId=${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/dashboard/sessions?studentId=${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      
      const masteryData = await masteryRes.json()
      const sessionsData = await sessionsRes.json()
      
      setMastery(masteryData)
      setSessions(sessionsData.sessions || [])
    } catch (error) {
      console.error('Failed to load student data')
    }
  }

  const createStudent = async (e) => {
    e.preventDefault()
    
    if (newStudent.pin.length !== 4) {
      toast({ title: 'Error', description: 'PIN must be 4 digits', variant: 'destructive' })
      return
    }

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStudent)
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Success!', description: `${newStudent.name} has been added` })
        setShowCreateStudent(false)
        setNewStudent({ name: '', pin: '' })
        loadStudents()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create student', variant: 'destructive' })
    }
  }

  const selectStudent = (student) => {
    setSelectedStudent(student)
    loadStudentData(student.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-600">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Parent Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome back, {user?.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>

        <div className="mb-6 flex gap-3 flex-wrap">
          {students.map(student => (
            <Button
              key={student.id}
              onClick={() => selectStudent(student)}
              variant={selectedStudent?.id === student.id ? 'default' : 'outline'}
              className="h-12"
            >
              <User className="w-4 h-4 mr-2" />
              {student.name}
            </Button>
          ))}
          <Button
            onClick={() => setShowCreateStudent(!showCreateStudent)}
            variant="outline"
            className="h-12 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>

        {showCreateStudent && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Student</CardTitle>
              <CardDescription>Create a profile and PIN for your child</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createStudent} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Student Name</Label>
                    <Input
                      id="name"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin">4-Digit PIN</Label>
                    <Input
                      id="pin"
                      type="text"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      value={newStudent.pin}
                      onChange={(e) => setNewStudent({ ...newStudent, pin: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit">Create Student</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateStudent(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {students.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold mb-2">No Students Yet</h3>
              <p className="text-slate-600 mb-4">Add a student to get started with Bridge</p>
              <Button onClick={() => setShowCreateStudent(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Student
              </Button>
            </CardContent>
          </Card>
        ) : selectedStudent ? (
          <div className="space-y-6">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Executive Vital Signs</CardTitle>
                    <CardDescription>At-a-glance performance metrics</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                    <div className="text-sm font-medium text-blue-700 mb-2">Total XP</div>
                    <div className="text-4xl font-bold text-blue-600 mb-1">2,450</div>
                    <div className="text-sm text-blue-600">Level 5 • Top 20%</div>
                  </div>
                  
                  <div className="text-center p-5 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border-2 border-teal-200">
                    <div className="text-sm font-medium text-teal-700 mb-2">Sessions</div>
                    <div className="text-4xl font-bold text-teal-600 mb-1">{sessions.length}</div>
                    <div className="text-sm text-teal-600">Completed • 14 hrs total</div>
                  </div>
                  
                  <div className="text-center p-5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200">
                    <div className="text-sm font-medium text-amber-700 mb-2">Streak</div>
                    <div className="text-4xl font-bold text-amber-600 mb-1">7 🔥</div>
                    <div className="text-sm text-amber-600">Days • Current week</div>
                  </div>
                  
                  <div className="text-center p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                    <div className="text-sm font-medium text-green-700 mb-2">Accuracy</div>
                    <div className="text-4xl font-bold text-green-600 mb-1">78%</div>
                    <div className="text-sm text-green-600">Overall • Strong</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <strong>Status Summary:</strong> {selectedStudent.name} is maintaining excellent consistency with a 7-day streak. 
                    Performance is strong across most subjects, with targeted practice recommended in areas marked below 70% mastery.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">Total XP</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">2,450</div>
                    <p className="text-sm text-slate-600 mt-1">Level 5</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-teal-600">{sessions.length}</div>
                    <p className="text-sm text-slate-600 mt-1">Completed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">Streak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">7</div>
                    <p className="text-sm text-slate-600 mt-1">Days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">Avg Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">78%</div>
                    <p className="text-sm text-slate-600 mt-1">Overall</p>
                  </CardContent>
                </Card>
              </div>

              {mastery && (
                <Card>
                  <CardHeader>
                    <CardTitle Subject Mastery</CardTitle>
                    <CardDescription>Overall progress across all subjects</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mastery.subjects?.map(subject => {
                      const subjectMastery = mastery.mastery?.filter(m => {
                        const skill = mastery.skills?.find(s => s.id === m.skillId)
                        return skill?.subjectId === subject.id
                      })
                      const avgMastery = subjectMastery?.length > 0
                        ? Math.round(subjectMastery.reduce((sum, m) => sum + m.mastery, 0) / subjectMastery.length)
                        : 0

                      return (
                        <div key={subject.id}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{subject.icon} {subject.name}</span>
                            <span className="text-sm font-bold text-blue-600">{avgMastery}%</span>
                          </div>
                          <Progress value={avgMastery} className="h-3" />
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="skills" className="space-y-6">
              {mastery && mastery.subjects?.map(subject => {
                const subjectSkills = mastery.skills?.filter(s => s.subjectId === subject.id) || []
                
                return (
                  <Card key={subject.id}>
                    <CardHeader>
                      <CardTitle>{subject.icon} {subject.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {subjectSkills.map(skill => {
                          const masteryItem = mastery.mastery?.find(m => m.skillId === skill.id)
                          const masteryScore = masteryItem?.mastery || 0
                          
                          return (
                            <div key={skill.id}>
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="font-medium">{skill.name}</div>
                                  <div className="text-sm text-slate-600">{skill.description}</div>
                                </div>
                                <Badge variant={masteryScore >= 70 ? 'default' : 'secondary'}>
                                  {masteryScore}%
                                </Badge>
                              </div>
                              <Progress value={masteryScore} className="h-2" />
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="sessions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                  <CardDescription>Learning session history</CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-600">
                      No sessions completed yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map(session => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">Learning Session</div>
                              <div className="text-sm text-slate-600">
                                {session.completedAt && format(new Date(session.completedAt), 'MMM d, yyyy')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">{session.xpEarned} XP</div>
                            <div className="text-sm text-slate-600">{session.duration} min</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        ) : null}
      </div>
    </div>
  )
}
