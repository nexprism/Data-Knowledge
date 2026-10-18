import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/all'

import { getApiBaseUrl } from '../utils/apiConfig.js'

gsap.registerPlugin(ScrollTrigger)

const staticTestimonials = [
  { name: "Julian R.", role: "Agency Owner", text: "The blueprint literally saved my sanity. I went from burned out to $3.5k/mo in 90 days.", rating: 5 },
  { name: "Sarah M.", role: "Freelance Designer", text: "Most courses are fluff. This is an architectural manual for freedom. Best investment of my career.", rating: 5 },
  { name: "Marcus L.", role: "Content Creator", text: "Clean, professional, and brutally honest. It's a paradigm shift, not just a course.", rating: 5 },
  { name: "Priya K.", role: "Digital Marketer", text: "I finally understand how to price my services correctly. Doubled my rates in 3 weeks.", rating: 5 },
  { name: "James T.", role: "Startup Founder", text: "The AI tools module alone was worth the price. I automated 80% of my client work.", rating: 5 },
  { name: "Ananya S.", role: "Consultant", text: "Sahil's clarity is unmatched. From zero to 2 retainer clients in under 60 days.", rating: 5 },
  { name: "Ryan O.", role: "E-Commerce Expert", text: "The solopreneur mindset is what was missing from my life. Revenue tripled in one quarter.", rating: 4 },
  { name: "Divya P.", role: "Social Media Manager", text: "The mentorship sessions changed how I think about business. Highly recommend to anyone serious.", rating: 5 },
  { name: "Chris W.", role: "Video Producer", text: "I scaled to $5k/mo following exactly what was taught. No fluff, all execution.", rating: 5 },
  { name: "Meera T.", role: "UX Designer", text: "This gave me a framework to productize my skill. It's the playbook I always needed.", rating: 5 },
  { name: "Ravi N.", role: "Growth Hacker", text: "Best structured program I've taken. Each module builds on the last — total progression.", rating: 5 },
  { name: "Leila H.", role: "Brand Strategist", text: "The program doesn't just teach — it transforms. My entire client acquisition changed.", rating: 5 },
  { name: "Tom B.", role: "Web Developer", text: "Went from hourly billing to $3k retainers in 6 weeks. The pricing module is pure gold.", rating: 5 },
  { name: "Nina G.", role: "Photographer", text: "I was skeptical but the ROI was immediate. Booked out 3 months within the first week of applying.", rating: 4 },
  { name: "Arjun M.", role: "Marketing Analyst", text: "Sahil's no-filler approach is what makes this worth every rupee. I've recommended it to 12 people.", rating: 5 },
  { name: "Sophia L.", role: "Copywriter", text: "The blueprint removed all my uncertainty. I now know exactly what to do every single day.", rating: 5 },
  { name: "Diego C.", role: "Business Coach", text: "This is the system behind every 7-figure solopreneur. Now I understand the architecture.", rating: 5 },
  { name: "Zara A.", role: "Life Coach", text: "Beyond expectations. The community alone is worth joining. Real results, real support.", rating: 5 },
  { name: "Karan V.", role: "SEO Specialist", text: "From struggling freelancer to agency owner — this program was the catalyst for my transformation.", rating: 5 },
  { name: "Emma S.", role: "Product Manager", text: "I implemented one strategy and made back 3x the course fee in a single month.", rating: 5 },
]

const StarRating = ({ rating }) => (
  <div className="flex gap-1 mb-4">
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < rating ? 'bg-accent' : 'bg-white/15'}`} />
    ))}
  </div>
)

const TestimonialsScroll = ({ reviews = [] }) => {
  const ref = useRef(null)
  const colRefs = useRef([])
  const [columns, setColumns] = React.useState([])
  const [colCount, setColCount] = React.useState(3)

  // Memoize the dynamic testimonials
  const displayTestimonials = React.useMemo(() => {
    const reviewsArray = Array.isArray(reviews) && reviews.length > 0 ? reviews : staticTestimonials;
    
    // Filter out nulls/undefined and invalid objects
    const validReviews = reviewsArray.filter(r => r !== null && typeof r === 'object' && (r.message || r.reviewText || r.text));

    return validReviews.map(r => {
      let avatar = null;
      if (r.image) {
        if (r.image.startsWith('http')) {
          avatar = r.image;
        } else {
          const baseUrl = getApiBaseUrl();
          const cleanPath = r.image.replace(/\\/g, '/').replace(/^\/+/, '');
          avatar = `${baseUrl}/${cleanPath}`;
        }
      }
      return {
        name: r.name || (r.userId && r.userId.fullName) || "Student",
        role: r.designation || r.role || "Data Analytics Alum",
        text: r.message || r.reviewText || r.text || "",
        rating: Number(r.rating) || 5,
        image: avatar
      };
    });
  }, [reviews]);

  useEffect(() => {
    if (displayTestimonials.length === 0) return;

    const handleResize = () => {
      const width = window.innerWidth
      let count = 3
      if (width < 768) count = 1
      else if (width < 1024) count = 2

      setColCount(count)

      // Split displayTestimonials into columns
      const base = Array.from({ length: count }, (_, ci) =>
        displayTestimonials.filter((_, i) => i % count === ci)
      )

      // Repeat columns for infinite scroll effect only if we have enough items
      // If items are very few, we don't repeat as much to avoid "same review" look
      const repeated = base.map(col => {
        if (col.length === 0) return [];
        const arr = []
        // Only repeat if we have at least 3 reviews per column to make it look decent
        const repeatTimes = displayTestimonials.length > 3 ? 6 : 1;
        for (let i = 0; i < repeatTimes; i++) arr.push(...col)
        return arr
      })

      setColumns(repeated)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [displayTestimonials])

  useEffect(() => {
    if (columns.length === 0 || columns.every(c => c.length === 0)) return

    const ctx = gsap.context(() => {
      // Heading reveal
      gsap.fromTo('.ts-heading',
        { opacity: 0, y: 50, filter: 'blur(14px)' },
        {
          opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4, ease: 'power4.out', stagger: 0.12,
          scrollTrigger: { trigger: '.ts-heading', start: 'top 87%' }
        }
      )

      // Parallax each column - only if we have enough items to actually scroll
      if (displayTestimonials.length > 3) {
        const configs = [
          { y: -380, scrub: 1.2 },
          { y: 320, scrub: 0.8 },
          { y: -350, scrub: 1.0 },
        ]

        colRefs.current.forEach((col, i) => {
          if (!col || !configs[i]) return
          gsap.to(col, {
            y: configs[i].y,
            ease: 'none',
            scrollTrigger: {
              trigger: ref.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: configs[i].scrub,
            },
          })
        })
      }

    }, ref)
    return () => ctx.revert()
  }, [columns, displayTestimonials.length])

  // If no dynamic reviews, hide the whole section
  if (displayTestimonials.length === 0) return null;

  const isLowCount = displayTestimonials.length <= 3;

  return (
    <section ref={ref} className="max-w-full mx-auto py-20 relative">

      {/* Heading */}
      <div className="text-center mb-10 md:mb-20">
        <span className="ts-heading block font-jetbrains text-[9px] text-accent tracking-[0.4em] md:tracking-[0.7em] uppercase font-bold opacity-70 mb-4">
          Verified / Testimonials
        </span>
        <h2 className="ts-heading font-inter text-[clamp(2rem,6vw,5rem)] text-normal font-extralight leading-tight">
          What Our Students <span className="text-accent underline-lime">Say</span>
        </h2>
      </div>

      {/* Clipped viewport */}
      <div className={`relative overflow-hidden border border-white/5 bg-white/[0.01] ${isLowCount ? 'h-auto py-20' : ''}`}
        style={{ height: isLowCount ? 'auto' : (colCount === 1 ? '600px' : '800px') }}>

        {/* Edge fades - only show if scrolling */}
        {!isLowCount && (
          <>
            <div className="absolute top-0 left-0 right-0 h-24 md:h-40 bg-gradient-to-b from-dark to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-24 md:h-40 bg-gradient-to-t from-dark to-transparent z-20 pointer-events-none" />
          </>
        )}

        {/* Grid of columns */}
        <div className={`flex gap-4 md:gap-6 px-4 md:px-6 items-start ${isLowCount ? 'relative inset-0' : 'absolute inset-0 top-auto'}`}
          style={{ top: isLowCount ? '0' : '-400px' }}>
          {columns.map((col, ci) => (
            <div
              key={`${ci}-${columns.length}`}
              ref={el => colRefs.current[ci] = el}
              className="flex flex-col gap-4 flex-1 min-w-0"
              style={{ marginTop: (!isLowCount && ci === 1) ? '-80px' : '0px' }}
            >
              {col.map((t, ti) => (
                <div
                  key={ti}
                  className="group relative border border-white/8 bg-white/[0.015] p-5 backdrop-blur-xl cursor-pointer transition-all duration-400 hover:border-accent/40 hover:bg-accent/[0.03] hover:-translate-y-1 hover:scale-[1.015] active:scale-[0.98]"
                >
                  {/* Left accent bar */}
                  <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />

                  {/* Watermark index */}
                  <div className="absolute bottom-2 right-3 font-jetbrains text-[42px] md:text-[52px] font-black text-white/[0.03] leading-none pointer-events-none select-none group-hover:text-accent/[0.05] transition-colors duration-700">
                    {String((ti % displayTestimonials.length) + 1).padStart(2, '0')}
                  </div>

                  {/* Avatar + meta */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-accent/20 border border-accent/20 overflow-hidden flex items-center justify-center shrink-0 font-jetbrains text-[8px] text-accent font-black group-hover:bg-accent/30 transition-colors duration-400">
                      {t.image ? (
                        <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        t.name.split(' ').map(n => n[0]).join('')
                      )}
                    </div>
                    <div>
                      <p className="font-jetbrains text-[9px] text-description font-bold tracking-[0.2em] uppercase">{t.name}</p>
                      <p className="font-jetbrains text-[7px] text-description/80 tracking-widest">{t.role}</p>
                    </div>
                  </div>

                  <StarRating rating={t.rating} />

                  <p className="font-jetbrains text-[10px] md:text-[9px] leading-[1.8] md:leading-[1.9] text-description tracking-wide">
                    "{t.text}"
                  </p>

                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}

export default TestimonialsScroll
