import Hero from '../components/Hero'
import HeroHighlights from '../components/HeroHighlights'
import ProgramsWeOffer from '../components/ProgramsWeOffer'
import WhyChooseUs from '../components/WhyChooseUs'
import MentorsSection from '../components/MentorsSection'
import PlacementStoriesSection from '../components/PlacementStoriesSection'
import ProvenResultsSection from '../components/ProvenResultsSection'
import ConsultationBanner from '../components/consultation/ConsultationBanner'
import AboutSnapshot from '../components/AboutSnapshot'
import LogoMarquee from '../components/LogoMarquee'
import GrowthSection from '../components/GrowthSection'
import CourseSlider from '../components/CourseSlider'
import TestimonialsSection from '../components/TestimonialsSection'
import FloatingSocialButtons from '../components/FloatingSocialButtons'

const Home = ({ isLoaded }) => {
  return (
    <div className="w-full">
      <FloatingSocialButtons />
      <Hero isLoaded={isLoaded} />
      <HeroHighlights />
      <PlacementStoriesSection />
      <ProgramsWeOffer />
      <ProvenResultsSection />
      <TestimonialsSection />
      <WhyChooseUs />
      <AboutSnapshot />
      <MentorsSection />
      <CourseSlider />
      <LogoMarquee />
      <GrowthSection />
      <ConsultationBanner />
    </div>
  )
}

export default Home

