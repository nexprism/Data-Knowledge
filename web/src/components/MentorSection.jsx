import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import { getImageBaseUrl } from '../utils/apiConfig';
import sanitizeDisplay, { sanitizeParagraph } from '../utils/textSanitize';

gsap.registerPlugin(ScrollTrigger);

const MentorSection = ({ course = {} }) => {
  const containerRef = useRef(null);

  // Check direct mentor properties on course or inside contentSections
  const contentSectionMentor = course.contentSections?.find(
    (s) => s.sectionType === 'mentor' || s.sectionType === 'instructor'
  )?.mentorData;

  const mentorName = sanitizeDisplay(course.mentorName || contentSectionMentor?.name || '');
  const mentorTitle = sanitizeParagraph(course.mentorTitle || contentSectionMentor?.title || 'Lead Mentor & Industry Specialist');
  const mentorDescription = sanitizeParagraph(course.mentorDescription || contentSectionMentor?.bio || course.mentorBio || '');
  const rawImage = course.mentorImage || contentSectionMentor?.image || '';

  // Parse achievements
  let achievements = course.mentorAchievements || contentSectionMentor?.achievements || [];
  if (typeof achievements === 'string') {
    try {
      achievements = JSON.parse(achievements);
    } catch {
      achievements = achievements.split('\n').filter(Boolean);
    }
  }
  if (!Array.isArray(achievements)) {
    achievements = [];
  }
  achievements = achievements.map(sanitizeParagraph).filter(Boolean);

  // Parse social links
  let socialLinks = course.mentorSocialLinks || {};
  if (typeof socialLinks === 'string') {
    try {
      socialLinks = JSON.parse(socialLinks);
    } catch {
      socialLinks = {};
    }
  }

  // Resolve mentor image URL
  let mentorImageUrl = '';
  if (rawImage) {
    let clean = rawImage;
    if (clean.includes('\\uploads\\') || clean.includes('/uploads/')) {
      const parts = clean.split(/[\\/]uploads[\\/]/);
      clean = '/uploads/' + parts[parts.length - 1];
    }
    if (clean.startsWith('http') || clean.startsWith('blob:')) {
      mentorImageUrl = clean;
    } else {
      const baseUrl = getImageBaseUrl();
      mentorImageUrl = `${baseUrl}${clean.startsWith('/') ? '' : '/'}${clean}`;
    }
  }

  // If no mentor info is configured, do not render an empty section
  if (!mentorName && !rawImage && !mentorDescription && achievements.length === 0) {
    return null;
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.mentor-reveal',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [mentorName]);

  const initials = mentorName
    ? mentorName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'M';

  return (
    <section
      ref={containerRef}
      id="mentor-section"
      className="max-w-7xl mx-auto py-14 sm:py-20 px-4 sm:px-6 md:px-0 scroll-mt-32"
    >
      {/* SECTION HEADER */}
      <div className="mentor-reveal text-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#3498db] text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#3498db] animate-pulse" />
          <span>Faculty & Mentorship</span>
        </div>

        <h2 className="font-inter text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-slate-900 tracking-tight leading-tight">
          Learn Directly from an{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3498db] via-blue-600 to-[#1a5276]">
            Industry Veteran
          </span>
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Get direct access to real-world experience, enterprise case studies, and tailored career mentorship.
        </p>
      </div>

      {/* MENTOR CARD */}
      <div className="mentor-reveal relative rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 lg:p-12 transition-all duration-300 hover:border-[#3498db]/30">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/40 via-[#3498db]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-sky-100/50 to-transparent rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT: AVATAR / IMAGE */}
          <div className="lg:col-span-5 flex flex-col items-center text-center">
            <div className="relative group/avatar">
              {/* Outer decorative ring */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#3498db] via-blue-500 to-indigo-600 rounded-3xl opacity-20 blur-md group-hover/avatar:opacity-40 transition-opacity duration-500" />
              
              <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-2xl flex items-center justify-center">
                {mentorImageUrl ? (
                  <img
                    src={mentorImageUrl}
                    alt={mentorName}
                    className="w-full h-full object-cover object-center group-hover/avatar:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full bg-gradient-to-br from-[#1a5276] via-[#3498db] to-blue-400 text-white font-extrabold text-5xl sm:text-6xl items-center justify-center tracking-wider"
                  style={{ display: mentorImageUrl ? 'none' : 'flex' }}
                >
                  {initials}
                </div>
              </div>

              {/* Verified Badge */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold shadow-lg border border-slate-700 whitespace-nowrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Verified Faculty</span>
              </div>
            </div>

            {/* Social Links */}
            {(socialLinks.linkedin || socialLinks.youtube || socialLinks.twitter || socialLinks.website) && (
              <div className="mt-7 flex items-center gap-2.5">
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin.startsWith('http') ? socialLinks.linkedin : `https://${socialLinks.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#0077b5] hover:border-[#0077b5] transition-all duration-300 shadow-sm"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.762-2.76-5-2.76zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                )}

                {socialLinks.youtube && (
                  <a
                    href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://${socialLinks.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#ff0000] hover:border-[#ff0000] transition-all duration-300 shadow-sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}

                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter.startsWith('http') ? socialLinks.twitter : `https://${socialLinks.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter / X"
                    className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-white hover:bg-slate-900 hover:border-slate-900 transition-all duration-300 shadow-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}

                {socialLinks.website && (
                  <a
                    href={socialLinks.website.startsWith('http') ? socialLinks.website : `https://${socialLinks.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Website"
                    className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#3498db] hover:border-[#3498db] transition-all duration-300 shadow-sm"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: DETAILS, BIO & ACHIEVEMENTS */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#3498db] text-xs font-bold uppercase tracking-wider">
                {mentorTitle || 'Lead Instructor'}
              </span>
              <h3 className="font-inter text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                {mentorName || 'Course Mentor'}
              </h3>
            </div>

            {mentorDescription && (
              <div className="text-slate-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>{mentorDescription}</p>
              </div>
            )}

            {/* Achievements Grid */}
            {achievements.length > 0 && (
              <div className="pt-2 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3498db]" />
                  <span>Key Career Milestones & Credentials</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achievements.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-[#3498db]/40 hover:shadow-sm transition-all"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default MentorSection;
