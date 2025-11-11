import {
  HeroSection,
  CategorySection,
  HowItWorksSection,
  SponsoredSection,
  SpecialOffersSection,
} from '@/components/homepage'

export default function HomePage() {
  return (
    <main className='min-h-screen'>
      <HeroSection />
      <SponsoredSection />
      <SpecialOffersSection />
      <CategorySection />
      <HowItWorksSection />
    </main>
  )
}
