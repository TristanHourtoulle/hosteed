#!/usr/bin/env tsx

/**
 * Script to test Brevo email configuration for Hosteed
 * Usage: npx tsx scripts/test-emails.ts your-email@example.com
 */

import { config } from 'dotenv'

// Load env BEFORE any imports that depend on it
config({ path: '.env' })
config({ path: '.env.local' })

// Now we can dynamically import after env is loaded
async function main() {
  const { emailService, sendEmail, sendTemplateEmail } = await import(
    '../src/lib/services/email/index'
  )
  const { emailConfig } = await import('../src/lib/config/email.config')

  const testEmail = process.argv[2]

  if (!testEmail) {
    console.log('❌ Usage: npx tsx scripts/test-emails.ts your-email@example.com')
    console.log('📧 Replace "your-email@example.com" with your actual email address')
    process.exit(1)
  }

  console.log('🏠 HOSTEED - Brevo Email Configuration Test\n')
  console.log(`🎯 Test email: ${testEmail}\n`)

  // Check configuration
  console.log('🔍 Checking Brevo configuration...\n')

  const requiredVars = ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'BREVO_SENDER_NAME']
  const optionalVars = ['BREVO_WEBHOOK_SECRET', 'NEXT_PUBLIC_SEND_MAIL']

  let configIssues = 0

  console.log('📋 Required variables:')
  requiredVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      const displayValue = varName === 'BREVO_API_KEY' ? value.substring(0, 20) + '...' : value
      console.log(`✅ ${varName}: ${displayValue}`)
    } else {
      console.log(`❌ ${varName}: MISSING`)
      configIssues++
    }
  })

  console.log('\n📋 Optional variables:')
  optionalVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      console.log(`✅ ${varName}: ${value}`)
    } else {
      console.log(`⚠️  ${varName}: Not configured`)
    }
  })

  console.log('')
  console.log(`📋 Email sending enabled: ${emailConfig.sendingEnabled}`)
  console.log('')

  if (configIssues > 0) {
    console.log(`🚨 ${configIssues} required variable(s) missing - tests will fail`)
    return
  }

  if (!emailConfig.sendingEnabled) {
    console.log('⚠️  Email sending is DISABLED. Set NEXT_PUBLIC_SEND_MAIL=true in .env')
    return
  }

  console.log('✅ Brevo configuration OK - starting tests...\n')

  // Run tests
  console.log('🧪 Starting Brevo email tests...\n')

  const results: Array<{ type: string; success: boolean; error?: string }> = []

  // Test 1: Direct email send
  try {
    console.log('📧 Test 1: Direct HTML email...')
    const result = await sendEmail({
      to: { email: testEmail },
      subject: 'Test Direct - Hosteed Brevo Configuration',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #4F46E5;">Test Email Direct</h1>
          <p>This is a direct HTML email to verify Brevo API configuration.</p>
          <p><strong>Sent from:</strong> ${emailConfig.senderEmail}</p>
          <p><strong>Date:</strong> ${new Date().toISOString()}</p>
          <p><strong>Recipient:</strong> ${testEmail}</p>
        </div>
      `,
    })
    if (result.success) {
      results.push({ type: 'Direct HTML', success: true })
      console.log(`✅ Direct email sent (messageId: ${result.messageId})\n`)
    } else {
      results.push({ type: 'Direct HTML', success: false, error: result.error })
      console.log('❌ Direct email failed:', result.error, '\n')
    }
  } catch (error) {
    results.push({ type: 'Direct HTML', success: false, error: String(error) })
    console.log('❌ Direct email error:', error, '\n')
  }

  // Test 2: Template email - Welcome
  try {
    console.log('📧 Test 2: Welcome template email...')
    const result = await sendTemplateEmail(
      'welcome-hosteed',
      { email: testEmail },
      'Bienvenue sur Hosteed - Test',
      {
        userName: 'Test User',
        loginUrl: 'https://hosteed.com/auth',
      }
    )
    if (result.success) {
      results.push({ type: 'Welcome Template', success: true })
      console.log(`✅ Welcome template email sent (messageId: ${result.messageId})\n`)
    } else {
      results.push({ type: 'Welcome Template', success: false, error: result.error })
      console.log('❌ Welcome template failed:', result.error, '\n')
    }
  } catch (error) {
    results.push({ type: 'Welcome Template', success: false, error: String(error) })
    console.log('❌ Welcome template error:', error, '\n')
  }

  // Test 3: Booking confirmation email
  try {
    console.log('📧 Test 3: Booking confirmation email...')
    const result = await emailService.sendBookingConfirmation(testEmail, 'Test User', {
      bookingId: 'test-booking-123',
      listingTitle: 'Test Property - Villa de Luxe',
      checkInDate: new Date().toLocaleDateString('fr-FR'),
      checkOutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      totalPrice: '500',
      hostName: 'Test Host',
      hostPhone: '+33 1 23 45 67 89',
      listingAddress: '123 Rue de Test, 75001 Paris',
      bookingUrl: 'https://hosteed.com/reservation/test-123',
    })
    if (result.success) {
      results.push({ type: 'Booking Confirmation', success: true })
      console.log(`✅ Booking confirmation sent (messageId: ${result.messageId})\n`)
    } else {
      results.push({ type: 'Booking Confirmation', success: false, error: result.error })
      console.log('❌ Booking confirmation failed:', result.error, '\n')
    }
  } catch (error) {
    results.push({ type: 'Booking Confirmation', success: false, error: String(error) })
    console.log('❌ Booking confirmation error:', error, '\n')
  }

  // Test 4: Password reset email
  try {
    console.log('📧 Test 4: Password reset email...')
    const result = await emailService.sendPasswordReset(
      testEmail,
      'Test User',
      'https://hosteed.com/reset-password?token=test-reset-token'
    )
    if (result.success) {
      results.push({ type: 'Password Reset', success: true })
      console.log(`✅ Password reset email sent (messageId: ${result.messageId})\n`)
    } else {
      results.push({ type: 'Password Reset', success: false, error: result.error })
      console.log('❌ Password reset failed:', result.error, '\n')
    }
  } catch (error) {
    results.push({ type: 'Password Reset', success: false, error: String(error) })
    console.log('❌ Password reset error:', error, '\n')
  }

  // Test 5: Generic template email using sendFromTemplate
  try {
    console.log('📧 Test 5: Generic template email (sendFromTemplate)...')
    const result = await emailService.sendFromTemplate(
      'checkEmail',
      testEmail,
      'Vérification Email - Test Hosteed',
      {
        userName: 'Test User',
        verificationUrl: 'https://hosteed.com/verify/test-token',
      }
    )
    if (result.success) {
      results.push({ type: 'Email Verification', success: true })
      console.log(`✅ Email verification sent (messageId: ${result.messageId})\n`)
    } else {
      results.push({ type: 'Email Verification', success: false, error: result.error })
      console.log('❌ Email verification failed:', result.error, '\n')
    }
  } catch (error) {
    results.push({ type: 'Email Verification', success: false, error: String(error) })
    console.log('❌ Email verification error:', error, '\n')
  }

  // Results summary
  console.log('='.repeat(50))
  console.log('📊 EMAIL TEST RESULTS')
  console.log('='.repeat(50))

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`✅ Passed: ${successful}/${results.length}`)
  console.log(`❌ Failed: ${failed}/${results.length}\n`)

  if (failed > 0) {
    console.log('🔍 FAILURE DETAILS:')
    results
      .filter(r => !r.success)
      .forEach(result => {
        console.log(`• ${result.type}: ${result.error}`)
      })
    console.log('')
  }

  // Recommendations
  if (successful === results.length) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('✨ Brevo email configuration is ready for production!')
  } else if (successful > 0) {
    console.log('⚠️  TESTS PARTIALLY PASSED')
    console.log('🔧 Check configuration for failed email types')
  } else {
    console.log('🚨 ALL TESTS FAILED')
    console.log('❗ Check your Brevo API key and configuration (.env)')
  }

  console.log('')
  console.log('📋 Suggested actions:')
  console.log('1. Check your spam/junk folder for test emails')
  console.log('2. Verify emails on mail-tester.com for deliverability score')
  console.log('3. Check Brevo dashboard for email logs and errors')
}

main().catch(console.error)
