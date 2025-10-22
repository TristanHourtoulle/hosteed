import { HeroSection, CategorySection, HowItWorksSection } from '@/components/homepage'

export default function HomePage() {
  return (
    <main className='min-h-screen'>
      <HeroSection />
      <CategorySection />
      <HowItWorksSection />
    </main>
  )
}
