import { useState } from 'react'

export default function StarRatingInput({ value, onChange, size = 'md' }) {
  const [hoverValue, setHoverValue] = useState(0)

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  return (
    <div className={`flex items-center gap-1 ${sizeClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className={`focus:outline-none transition-colors ${
            star <= (hoverValue || value) ? 'text-amber-400' : 'text-gray-300'
          }`}
          aria-label={`Rate ${star} out of 5`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
