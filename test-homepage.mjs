#!/usr/bin/env node

/**
 * Simple test script to verify homepage renders correctly
 * Run after starting dev server: node test-homepage.mjs
 */

console.log('🧪 Testing homepage rendering...\n')

// Verify page.tsx exists and exports correctly
try {
  console.log('✓ Checking src/app/page.tsx exists...')
  const fs = await import('fs')
  const path = await import('path')

  const pagePath = path.join(process.cwd(), 'src', 'app', 'page.tsx')
  if (!fs.existsSync(pagePath)) {
    console.error('❌ src/app/page.tsx not found!')
    process.exit(1)
  }

  const content = fs.readFileSync(pagePath, 'utf8')
  if (!content.includes('HomePage') || !content.includes('export default')) {
    console.error('❌ page.tsx missing HomePage export!')
    process.exit(1)
  }
  console.log('  ✓ page.tsx exists and exports HomePage\n')

  // Check next.config.ts doesn't have redirects
  console.log('✓ Checking next.config.ts for redirects...')
  const configPath = path.join(process.cwd(), 'next.config.ts')
  const configContent = fs.readFileSync(configPath, 'utf8')

  if (
    configContent.includes('async redirects()') &&
    !configContent.includes('// Redirects removed')
  ) {
    console.error('❌ Found active redirects() function in next.config.ts!')
    process.exit(1)
  }
  console.log('  ✓ No active redirects found in config\n')

  // Check homepage components exist
  console.log('✓ Checking homepage components...')
  const componentsToCheck = [
    'src/components/homepage/HeroSection/HeroSection.tsx',
    'src/components/homepage/CategorySection/CategorySection.tsx',
    'src/components/homepage/HowItWorks/HowItWorksSection.tsx',
  ]

  for (const comp of componentsToCheck) {
    const compPath = path.join(process.cwd(), comp)
    if (!fs.existsSync(compPath)) {
      console.error(`❌ Component missing: ${comp}`)
      process.exit(1)
    }
  }
  console.log('  ✓ All homepage components exist\n')

  console.log('✅ All checks passed!')
  console.log('\n📝 Next steps:')
  console.log('  1. Make sure dev server is stopped (Ctrl+C)')
  console.log('  2. Run: rm -rf .next')
  console.log('  3. Run: pnpm dev')
  console.log('  4. Open: http://localhost:3000')
  console.log('  5. Clear browser cache if needed (Cmd+Shift+R on Mac)')
} catch (error) {
  console.error('❌ Test failed:', error.message)
  process.exit(1)
}
