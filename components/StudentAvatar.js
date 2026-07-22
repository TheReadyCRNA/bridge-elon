'use client'

import { User } from 'lucide-react'

export default function StudentAvatar({ avatar, size = 'md', className = '' }) {
  const sizes = { sm: 'w-10 h-10', md: 'w-16 h-16', lg: 'w-24 h-24', xl: 'w-32 h-32' }
  const iconSizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' }
  const isPhoto = avatar && (avatar.startsWith('data:image') || avatar.startsWith('http'))
  const emojiMap = { 'avatar1': '🦸', 'avatar2': '🧙', 'avatar3': '🏀', 'avatar4': '🎨', 'avatar5': '🔬', 'avatar6': '🎮', 'avatar7': '📚', 'avatar8': '🚀' }

  return (
    <div className={`relative ${sizes[size]} ${className}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-teal-500 to-amber-500 p-0.5">
        <div className="w-full h-full rounded-full bg-white p-0.5">
          {isPhoto ? (
            <img src={avatar} alt="Student avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
              <span className="text-4xl" style={{ fontSize: size === 'sm' ? '1.5rem' : size === 'md' ? '2rem' : size === 'lg' ? '3rem' : '4rem' }}>
                {emojiMap[avatar] || '👤'}
              </span>
            </div>
          )}
        </div>
      </div>
      {isPhoto && (
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
          <User className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  )
}
