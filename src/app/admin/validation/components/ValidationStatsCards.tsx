'use client'

import { Clock, Edit3, FileText, CheckCircle2, XCircle, LayoutGrid } from 'lucide-react'

interface ValidationStats {
  pending: number
  approved: number
  rejected: number
  recheckRequest: number
  modificationPending: number
  drafts: number
  total: number
}

interface ValidationStatsCardsProps {
  stats: ValidationStats
}

interface PrimaryCardProps {
  label: string
  value: number
  hint: string
  icon: React.ReactNode
  accent: {
    bg: string
    text: string
    ring: string
    iconBg: string
  }
}

function PrimaryStatCard({ label, value, hint, icon, accent }: PrimaryCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:${accent.ring}`}
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1'>
          <p className='text-sm font-medium text-slate-500'>{label}</p>
          <p className={`text-4xl font-bold tracking-tight ${accent.text}`}>{value}</p>
          <p className='text-xs text-slate-500'>{hint}</p>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent.bg} ${accent.text}`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

interface SecondaryMetricProps {
  label: string
  value: number
  icon: React.ReactNode
  tone: 'slate' | 'green' | 'red'
}

function SecondaryMetric({ label, value, icon, tone }: SecondaryMetricProps) {
  const tones = {
    slate: 'text-slate-600',
    green: 'text-emerald-600',
    red: 'text-red-600',
  } as const
  return (
    <div className='flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 backdrop-blur-sm'>
      <div className={`${tones[tone]}`}>{icon}</div>
      <div className='flex items-baseline gap-2'>
        <span className={`text-2xl font-semibold tabular-nums ${tones[tone]}`}>{value}</span>
        <span className='text-sm font-medium text-slate-600'>{label}</span>
      </div>
    </div>
  )
}

export function ValidationStatsCards({ stats }: ValidationStatsCardsProps) {
  const actionable = stats.pending + stats.recheckRequest
  const modifications = stats.modificationPending + stats.drafts

  return (
    <div className='space-y-4'>
      {/* Primary — actionable items */}
      <div className='grid gap-4 md:grid-cols-3'>
        <PrimaryStatCard
          label='À traiter'
          value={actionable}
          hint={actionable === 0 ? 'Rien en attente' : 'annonces en attente d’action'}
          icon={<Clock className='h-6 w-6' />}
          accent={{
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            ring: 'ring-amber-200',
            iconBg: 'bg-amber-50',
          }}
        />
        <PrimaryStatCard
          label='Révisions demandées'
          value={stats.recheckRequest}
          hint='à corriger par l’hôte'
          icon={<Edit3 className='h-6 w-6' />}
          accent={{
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            ring: 'ring-blue-200',
            iconBg: 'bg-blue-50',
          }}
        />
        <PrimaryStatCard
          label='Modifications'
          value={modifications}
          hint='changements en attente de revue'
          icon={<FileText className='h-6 w-6' />}
          accent={{
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            ring: 'ring-purple-200',
            iconBg: 'bg-purple-50',
          }}
        />
      </div>

      {/* Secondary — resolved / total metrics */}
      <div className='grid gap-3 sm:grid-cols-3'>
        <SecondaryMetric
          label='annonces au total'
          value={stats.total}
          icon={<LayoutGrid className='h-5 w-5' />}
          tone='slate'
        />
        <SecondaryMetric
          label='validées'
          value={stats.approved}
          icon={<CheckCircle2 className='h-5 w-5' />}
          tone='green'
        />
        <SecondaryMetric
          label='refusées'
          value={stats.rejected}
          icon={<XCircle className='h-5 w-5' />}
          tone='red'
        />
      </div>
    </div>
  )
}
