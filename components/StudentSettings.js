'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { X, Sun, Moon, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import StudentAvatar from '@/components/StudentAvatar'

export default function StudentSettings({ user, token, onClose, toast }) {
  const [theme, setTheme] = useState('light')
  const [textSize, setTextSize] = useState('medium')
  const [avatar, setAvatar] = useState(user?.avatar || 'avatar1')
  const [photoPreview, setPhotoPreview] = useState(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    const savedSize = localStorage.getItem('textSize') || 'medium'
    setTheme(savedTheme)
    setTextSize(savedSize)
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    document.documentElement.style.fontSize = 
      savedSize === 'small' ? '14px' : 
      savedSize === 'large' ? '18px' : '16px'
  }, [])

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    toast({ title: `Switched to ${newTheme === 'light' ? 'Light' : 'Dark'} Mode`, description: 'Theme updated!' })
  }

  const handleSizeChange = (size) => {
    setTextSize(size)
    localStorage.setItem('textSize', size)
    document.documentElement.style.fontSize = 
      size === 'small' ? '14px' : 
      size === 'large' ? '18px' : '16px'
    toast({ title: 'Size Updated', description: `Text size set to ${size}` })
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Photo too large', description: 'Please choose a photo under 2MB', variant: 'destructive' })
      return
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Wrong file type', description: 'Please choose an image file', variant: 'destructive' })
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result
      setPhotoPreview(base64String)
      setAvatar(base64String)
      try {
        await fetch('/api/students/update-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ avatar: base64String })
        })
        toast({ title: 'Photo Updated!', description: 'Your new photo looks great!' })
        const userData = JSON.parse(localStorage.getItem('user') || '{}')
        userData.avatar = base64String
        localStorage.setItem('user', JSON.stringify(userData))
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to save photo', variant: 'destructive' })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl">
        <Card className="border-2 border-blue-200 shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">My Settings</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="w-6 h-6" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Card className="border-2 border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {theme === 'light' ? (
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center"><Sun className="w-8 h-8 text-amber-600" /></div>
                    ) : (
                      <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center"><Moon className="w-8 h-8 text-blue-300" /></div>
                    )}
                    <div>
                      <Label className="text-xl font-semibold">Theme</Label>
                      <p className="text-sm text-slate-600 mt-1">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</p>
                    </div>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={handleThemeToggle} className="scale-150" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-200">
              <CardContent className="p-6">
                <Label className="text-xl font-semibold mb-4 block">Size</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button onClick={() => handleSizeChange('small')} variant={textSize === 'small' ? 'default' : 'outline'} className="h-20 text-sm font-semibold">Small</Button>
                  <Button onClick={() => handleSizeChange('medium')} variant={textSize === 'medium' ? 'default' : 'outline'} className="h-20 text-base font-semibold">Medium</Button>
                  <Button onClick={() => handleSizeChange('large')} variant={textSize === 'large' ? 'default' : 'outline'} className="h-20 text-lg font-semibold">Large</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-200">
              <CardContent className="p-6">
                <Label className="text-xl font-semibold mb-4 block">Photo</Label>
                <div className="flex items-center gap-6">
                  <StudentAvatar avatar={photoPreview || avatar} size="xl" />
                  <div className="flex-1">
                    <Button type="button" size="lg" className="w-full h-16 text-lg bg-gradient-to-r from-blue-600 to-teal-500 cursor-pointer" onClick={() => document.getElementById('photo-upload').click()}>
                      <Upload className="w-5 h-5 mr-2" />{avatar && avatar.startsWith('data:') ? 'Change Photo' : 'Add Photo'}
                    </Button>
                    <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <p className="text-sm text-slate-600 mt-3 text-center">Max 2MB - JPG, PNG, or GIF</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button onClick={onClose} variant="outline" size="lg" className="w-full h-14 text-lg">Done</Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
