import * as LucideIcons from 'lucide-react'

const emojiMap = {
  '🍔': 'Utensils',
  '🚗': 'Car',
  '💡': 'Lightbulb',
  '🛍️': 'ShoppingBag',
  '🛒': 'ShoppingCart',
  '🏠': 'Home',
  '❤️': 'HeartPulse',
  '🎮': 'Gamepad2',
  '💸': 'Banknote',
  '💼': 'Briefcase',
  '🏛️': 'Landmark'
}

export default function CategoryIcon({ emoji, className = "w-5 h-5", strokeWidth = 1.5 }) {
  // If the passed 'emoji' is actually a valid Lucide icon name, use it.
  // Otherwise, fall back to mapping or a default icon.
  const iconName = LucideIcons[emoji] ? emoji : (emojiMap[emoji] || 'CircleDot')
  const IconComponent = LucideIcons[iconName] || LucideIcons.CircleDot

  return <IconComponent className={className} strokeWidth={strokeWidth} />
}
