'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shadcnui/avatar'
import {
  User as UserIcon,
  Mail,
  Calendar,
  ShieldCheck,
  MailCheck,
  MailX,
  BadgeCheck,
  Phone,
} from 'lucide-react'
import type { ExtendedUser } from '../types'
import { getUserAvatarUrl } from '@/lib/utils/userAvatar'

/**
 * Ordered list of roles with Lucide icons and accent tones.
 * Kept in sync with the list page `RolePill`.
 */
const ROLE_CONFIG: Record<
  string,
  { label: string; accent: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ADMIN: {
    label: 'Administrateur',
    accent: 'bg-purple-50 text-purple-700 ring-purple-200',
    icon: ShieldCheck,
  },
  HOST_MANAGER: {
    label: 'Gestionnaire Hôtes',
    accent: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    icon: ShieldCheck,
  },
  BLOGWRITER: {
    label: 'Rédacteur Blog',
    accent: 'bg-blue-50 text-blue-700 ring-blue-200',
    icon: BadgeCheck,
  },
  HOST_VERIFIED: {
    label: 'Hôte Vérifié',
    accent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: BadgeCheck,
  },
  HOST: {
    label: 'Hôte',
    accent: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: UserIcon,
  },
  USER: {
    label: 'Utilisateur',
    accent: 'bg-slate-100 text-slate-700 ring-slate-200',
    icon: UserIcon,
  },
}

interface InfoRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  tone?: 'slate' | 'emerald' | 'amber'
}

function InfoRow({ icon: Icon, label, value, tone = 'slate' }: InfoRowProps) {
  const toneClass: Record<NonNullable<InfoRowProps['tone']>, string> = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className='flex items-start gap-3'>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClass[tone]}`}
      >
        <Icon className='h-4 w-4' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-xs font-medium uppercase tracking-wide text-slate-400'>{label}</p>
        <div className='mt-0.5 text-sm font-medium text-slate-900'>{value}</div>
      </div>
    </div>
  )
}

interface UserPersonalInfoProps {
  user: ExtendedUser
}

export function UserPersonalInfo({ user }: UserPersonalInfoProps) {
  const displayName =
    user.name || user.lastname
      ? `${user.name || ''} ${user.lastname || ''}`.trim()
      : 'Utilisateur sans nom'

  const role = ROLE_CONFIG[user.roles] ?? ROLE_CONFIG.USER
  const RoleIcon = role.icon

  return (
    <div className='space-y-4'>
      {/* Profile header card */}
      <div className='overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm'>
        <div className='relative h-24 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500'>
          <div className='absolute inset-0 bg-black/10' />
        </div>
        <div className='relative -mt-12 flex flex-col items-center px-6 pb-6 text-center'>
          <Avatar className='h-24 w-24 border-4 border-white shadow-lg'>
            <AvatarImage src={getUserAvatarUrl(user)} alt={displayName} />
            <AvatarFallback className='bg-gradient-to-br from-indigo-500 to-purple-500 text-2xl font-bold text-white'>
              {(user.name?.[0] || user.email[0]).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className='mt-4 text-xl font-bold text-slate-900'>{displayName}</h2>
          <p className='mt-0.5 flex items-center gap-1.5 text-sm text-slate-500'>
            <Mail className='h-3.5 w-3.5' />
            <span className='truncate max-w-[220px]'>{user.email}</span>
          </p>
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${role.accent}`}
          >
            <RoleIcon className='h-3 w-3' />
            {role.label}
          </span>
        </div>
      </div>

      {/* Info card */}
      <div className='rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm'>
        <h3 className='mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500'>
          Informations
        </h3>
        <div className='space-y-4'>
          <InfoRow
            icon={Calendar}
            label='Inscrit le'
            value={new Date(user.createdAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
          <InfoRow
            icon={user.emailVerified ? MailCheck : MailX}
            label='Email'
            tone={user.emailVerified ? 'emerald' : 'amber'}
            value={
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  user.emailVerified
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                }`}
              >
                {user.emailVerified ? 'Vérifié' : 'Non vérifié'}
              </span>
            }
          />
          {user.info && <InfoRow icon={Phone} label='Bio' value={user.info} />}
        </div>
      </div>
    </div>
  )
}
