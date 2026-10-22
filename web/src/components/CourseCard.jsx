import React from 'react'
import sanitizeDisplay from '../utils/textSanitize'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const CourseCard = ({ item, className = '', variant = 'course' }) => {
  const { t } = useLanguage()

  const CardContent = (
    <div className={`catalog-card bg-white border border-slate-200/80 hover:border-[#3498db]/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6 flex flex-col h-full group relative overflow-hidden ${className}`}>
      {/* Image Wrapper */}
      <div className="relative overflow-hidden mb-6 aspect-[16/10] bg-slate-100 rounded-xl shrink-0">
        <img
          src={item.image}
          alt={sanitizeDisplay(item.title)}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/banner.png';
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {item.isNew && (
          <div className="absolute top-3 right-3 bg-[#3498db] text-white px-2.5 py-0.5 font-inter text-[10px] font-bold tracking-wider rounded-md shadow-sm z-10 uppercase">
            {t('newBadge') || 'NEW'}
          </div>
        )}
      </div>

      {/* Content Metadata */}
      <div className="flex flex-col flex-grow gap-3">
        <span className="font-inter text-[11px] text-[#3498db] tracking-wider font-bold uppercase">
          {item.category}
        </span>

        <h3 className="font-inter text-lg md:text-xl text-slate-900 group-hover:text-[#3498db] transition-colors duration-300 font-bold tracking-tight leading-snug line-clamp-2">
          {sanitizeDisplay(item.title)}
        </h3>

        <p className="font-inter text-xs text-slate-600 leading-relaxed mb-4 flex-grow line-clamp-2 font-normal">
          {item.description}
        </p>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          {variant === 'course' ? (
            <>
              <span className="font-inter text-base text-slate-900 tracking-tight font-extrabold">
                {item.price}
              </span>
              <div className="w-9 h-9 flex items-center justify-center border border-[#3498db]/30 bg-[#3498db]/10 group-hover:bg-[#3498db] group-hover:border-[#3498db] rounded-full transition-all duration-300 shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-all duration-300 stroke-[#3498db] group-hover:stroke-white">
                  <path d="M7 17L17 7M17 7H7M17 7V17" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </>
          ) : (
            <button className="w-full py-3 bg-[#3498db] text-white rounded-full font-inter text-xs font-bold tracking-wider uppercase hover:bg-[#2980b9] shadow-sm transition-all duration-300">
              {item.buttonText || t('registerNow') || 'Register Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (variant === 'course') {
    return (
      <Link to={`/course-detail/${item.id}`} className="block h-full">
        {CardContent}
      </Link>
    )
  }

  return CardContent
}

export default CourseCard
