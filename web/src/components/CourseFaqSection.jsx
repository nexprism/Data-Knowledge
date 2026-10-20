import React, { useState, useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import { getApiBaseUrl } from '../utils/apiConfig';
import sanitizeDisplay, { sanitizeParagraph } from '../utils/textSanitize';

gsap.registerPlugin(ScrollTrigger);

const CourseFaqSection = ({ course = {} }) => {
  const containerRef = useRef(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(0); // first FAQ open by default

  const courseId = course?._id || course?.id;

  // Fallback defaults if course has no configured FAQs yet
  const defaultFaqs = useMemo(
    () => [
      {
        question: 'Who is this course designed for?',
        answer: 'This program is tailored for aspiring data analysts, product managers, engineers, entrepreneurs, and working professionals who want to develop actionable, real-world data literacy and decision-making skills.',
        category: 'Curriculum'
      },
      {
        question: 'Do I need prior coding or advanced math experience?',
        answer: 'No prior experience is necessary. We start from foundational fundamentals and build practical mastery step-by-step using guided case studies and accessible real-world exercises.',
        category: 'Curriculum'
      },
      {
        question: 'How long do I have access to the course content and updates?',
        answer: 'You receive full access to all curriculum modules, downloadable resources, future updates, and community discussion boards based on your chosen access plan.',
        category: 'Admissions & Pricing'
      },
      {
        question: 'Will I receive a verified certificate upon completion?',
        answer: 'Yes! Upon completing the curriculum and submitting assignments, you will be issued a verifiable digital certificate of completion that you can share on LinkedIn and resume portfolios.',
        category: 'Certification'
      },
      {
        question: 'What kind of support is available if I get stuck?',
        answer: 'You have direct access to the course Q&A forums, instructor review on assignments, and dedicated academic advisor support for any technical or conceptual doubts.',
        category: 'Support'
      }
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;

    async function loadFaqs() {
      // Collect FAQs from course object
      const courseDirectFaqs = [];
      if (Array.isArray(course.faq)) {
        course.faq.forEach((f) => {
          if (f?.question) {
            courseDirectFaqs.push({
              question: sanitizeParagraph(f.question),
              answer: sanitizeParagraph(f.answer),
              category: f.category || 'General'
            });
          }
        });
      }
      if (Array.isArray(course.faqs)) {
        course.faqs.forEach((f) => {
          if (f?.question) {
            courseDirectFaqs.push({
              question: sanitizeParagraph(f.question),
              answer: sanitizeParagraph(f.answer),
              category: f.category || 'General'
            });
          }
        });
      }

      // If valid ObjectId, attempt to fetch from endpoint
      if (courseId && /^[a-f\d]{24}$/i.test(String(courseId))) {
        try {
          setLoading(true);
          const baseUrl = getApiBaseUrl();
          const res = await fetch(`${baseUrl}/faqs/course/${courseId}`);
          if (res.ok) {
            const json = await res.json();
            const apiFaqs = json.data || json.faqs || [];
            if (Array.isArray(apiFaqs)) {
              apiFaqs.forEach((f) => {
                if (f?.question) {
                  courseDirectFaqs.push({
                    question: sanitizeParagraph(f.question),
                    answer: sanitizeParagraph(f.answer),
                    category: f.category || 'General'
                  });
                }
              });
            }
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('Could not fetch course FAQs from API, using local FAQs:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
      }

      // Deduplicate by normalized question
      const seen = new Set();
      const uniqueFaqs = [];
      courseDirectFaqs.forEach((f) => {
        const key = f.question.toLowerCase().trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueFaqs.push(f);
        }
      });

      if (isMounted) {
        if (uniqueFaqs.length > 0) {
          setFaqs(uniqueFaqs);
        } else {
          setFaqs(defaultFaqs);
        }
      }
    }

    loadFaqs();

    return () => {
      isMounted = false;
    };
  }, [courseId, course.faq, course.faqs, defaultFaqs]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.faq-reveal',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [faqs]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(['All']);
    faqs.forEach((f) => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats);
  }, [faqs]);

  // Filter FAQs based on active category and search query
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCat = activeCategory === 'All' || faq.category?.toLowerCase() === activeCategory.toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery = !query || faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);
      return matchesCat && matchesQuery;
    });
  }, [faqs, activeCategory, searchQuery]);

  const toggleFaq = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const scrollToHeroInquiry = () => {
    const el = document.getElementById('inquiry-form-card') || document.getElementById('hero-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={containerRef}
      id="faq-section"
      className="max-w-7xl mx-auto py-14 sm:py-20 px-4 sm:px-6 md:px-0 scroll-mt-32"
    >
      {/* SECTION HEADER */}
      <div className="faq-reveal text-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 text-[#3498db] text-xs font-semibold tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#3498db] animate-pulse" />
          <span>Frequently Asked Questions</span>
        </div>

        <h2 className="font-inter text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-slate-900 tracking-tight leading-tight">
          Everything You Need to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3498db] via-blue-600 to-[#1a5276]">
            Know Before Enrolling
          </span>
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Clear answers about curriculum, class structures, eligibility, certifications, and career scope.
        </p>
      </div>

      {/* SEARCH & CATEGORY FILTER */}
      <div className="faq-reveal max-w-3xl mx-auto mb-10 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions by keyword (e.g., certificate, pricing, pre-requisites)..."
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white border border-slate-200/90 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3498db] focus:ring-4 focus:ring-blue-100/60 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Categories Tabs */}
        {categories.length > 2 && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {categories.map((cat) => {
              const active = activeCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                    active
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ACCORDION LIST */}
      <div className="faq-reveal max-w-3xl mx-auto space-y-3.5">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <p className="text-slate-600 font-medium text-sm">No questions found matching "{searchQuery}".</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className="text-xs font-bold text-[#3498db] hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = expandedIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl transition-all duration-300 border ${
                  isOpen
                    ? 'bg-white border-blue-200 shadow-md ring-2 ring-blue-100/60'
                    : 'bg-white border-slate-200/90 shadow-sm hover:border-[#3498db]/40 hover:shadow-md'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-inter text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOpen
                        ? 'bg-[#3498db] border-[#3498db] text-white rotate-180'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-0 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100/80 mt-1">
                    <p className="pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* "STILL HAVE QUESTIONS?" CARD */}
      <div className="faq-reveal max-w-3xl mx-auto mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-inter text-lg sm:text-xl font-bold text-slate-900">
            Still Have Questions?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md">
            Speak directly with our academic mentors to get personalized advice about the curriculum and career opportunities.
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToHeroInquiry}
          className="shrink-0 px-6 py-3 rounded-full bg-slate-900 hover:bg-[#3498db] text-white text-xs sm:text-sm font-bold tracking-wide shadow-md transition-all duration-300 flex items-center gap-2"
        >
          <span>Talk to an Advisor</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default CourseFaqSection;
