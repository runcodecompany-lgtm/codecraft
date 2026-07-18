import React from 'react'
import Link from 'next/link'
import { Clock, Users, Star, BookOpen } from 'lucide-react'
import Card from './card'
import Button from './button'

export interface Course {
  id: string
  title: string
  description: string
  slug: string
  priceInCoins: number
  coverImage?: string
  teacher: { name: string }
  rating?: number
  studentsCount?: number
  duration?: string
  modules?: { lessons: { id: string }[] }[]
  level?: 'مبتدئ' | 'متوسط' | 'متقدم'
  category?: string
}

interface CourseCardProps {
  course: Course
  className?: string
  variant?: 'default' | 'featured' | 'compact'
}

const CourseCard = ({ course, className = '', variant = 'default' }: CourseCardProps) => {
  const totalLessons = course.modules?.reduce(
    (acc, m) => acc + m.lessons.length,
    0
  ) || 0

  const baseClasses = 'group'
  const variantClasses = {
    default: '',
    featured: 'transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300',
    compact: 'h-full'
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim()

  return (
    <Card className={classes} hover={variant !== 'compact'}>
      <Link href={`/courses/${course.slug}`}>
        <div className="flex flex-col h-full">
          {/* Cover Image */}
          <div className="relative h-40 overflow-hidden rounded-t-xl">
            {course.coverImage ? (
              <img
                src={course.coverImage}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-indigo-900/20 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-blue-600/35 dark:text-blue-400/40" />
              </div>
            )}

            {/* Price Badge */}
            <div className="absolute top-3 left-3">
              {course.priceInCoins === 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-full">
                  مجاناً
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-2.5 py-1 rounded-full">
                  <span className="text-amber-500">💰</span>
                  {course.priceInCoins} CC
                </span>
              )}
            </div>

            {/* Level Badge */}
            {course.level && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-2.5 py-1 rounded-full">
                  {course.level}
                </span>
              </div>
            )}

            {/* Category Badge */}
            {course.category && (
              <div className="absolute bottom-3 left-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 px-2.5 py-1 rounded-full">
                  {course.category}
                </span>
              </div>
            )}
          </div>

          <Card.Body className="flex-1">
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {course.title}
              </h3>

              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2">
                {course.description}
              </p>

              {/* Teacher Info */}
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                <span className="flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {course.teacher.name?.[0]?.toUpperCase()}
                  </span>
                  <span>{course.teacher.name}</span>
                </span>

                <div className="flex items-center gap-3">
                  {course.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                      <span>{course.rating}</span>
                    </div>
                  )}

                  {course.studentsCount && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span>{course.studentsCount.toLocaleString()}</span>
                    </div>
                  )}

                  {course.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{course.duration}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card.Body>

          {variant !== 'compact' && (
            <Card.Footer className="pt-0">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
              >
                {course.priceInCoins === 0 ? 'ابدأ التعلم' : 'اشترِ الآن'}
              </Button>
            </Card.Footer>
          )}
        </div>
      </Link>
    </Card>
  )
}

export default CourseCard
