'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Shield,
  CalendarDays,
  UserCircle2,
  AlertTriangle,
  Loader2,
  Crown,
  PenLine,
} from 'lucide-react'

import { useBlogAuth } from '@/hooks/useMultiRoleAuth'
import { Button } from '@/components/ui/shadcnui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcnui/dialog'
import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { KpiCard } from '@/components/admin/ui/KpiCard'
import { FilterBar } from '@/components/admin/ui/FilterBar'
import {
  DataTable,
  type DataTableColumn,
  type DataTableSort,
} from '@/components/admin/ui/DataTable'

interface Post {
  id: string
  title: string
  slug?: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string | null
    email: string
    roles: string
  }
}

const INFO_TILE_TONE: Record<
  'blue' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'slate',
  { bg: string; text: string }
> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600' },
}

function InfoTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'slate',
  loading = false,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: keyof typeof INFO_TILE_TONE
  loading?: boolean
}) {
  const toneClass = INFO_TILE_TONE[tone]
  if (loading) {
    return (
      <div className='relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1 space-y-2'>
            <div className='h-4 w-24 animate-pulse rounded bg-slate-200' />
            <div className='h-6 w-32 animate-pulse rounded bg-slate-200' />
            <div className='h-3 w-32 animate-pulse rounded bg-slate-200' />
          </div>
          <div className='h-10 w-10 animate-pulse rounded-xl bg-slate-200' />
        </div>
      </div>
    )
  }
  return (
    <div className='rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 space-y-1'>
          <p className='text-sm font-medium text-slate-500'>{label}</p>
          <p
            className={`text-lg font-semibold leading-tight ${toneClass.text}`}
          >
            {value}
          </p>
          {hint && <p className='text-xs text-slate-500'>{hint}</p>}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass.bg} ${toneClass.text}`}
        >
          <Icon className='h-5 w-5' />
        </div>
      </div>
    </div>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function BlogManagementPage() {
  const { isAuthorized, isLoading, session } = useBlogAuth()

  const [posts, setPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [sort, setSort] = useState<DataTableSort | null>({
    key: 'createdAt',
    direction: 'desc',
  })

  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = session?.user?.roles === 'ADMIN'

  const fetchPosts = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      setIsLoadingPosts(true)
      const authorParam = isAdmin ? '' : `?authorId=${session.user.id}`
      const response = await fetch(`/api/posts${authorParam}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des articles')
      }
      const data = await response.json()
      const normalized = Array.isArray(data)
        ? data
        : Array.isArray((data as { posts?: unknown }).posts)
          ? (data as { posts: Post[] }).posts
          : []
      setPosts(normalized)
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Erreur lors du chargement des articles')
    } finally {
      setIsLoadingPosts(false)
    }
  }, [session, isAdmin])

  useEffect(() => {
    if (isAuthorized && session?.user?.id) {
      fetchPosts()
    }
  }, [isAuthorized, session, fetchPosts])

  const filteredPosts = useMemo(() => {
    const q = searchValue.trim().toLowerCase()
    if (!q) return posts
    return posts.filter(
      post =>
        post.title.toLowerCase().includes(q) ||
        (post.author.name ?? '').toLowerCase().includes(q) ||
        post.author.email.toLowerCase().includes(q) ||
        (post.slug ?? '').toLowerCase().includes(q)
    )
  }, [posts, searchValue])

  const stats = useMemo(() => {
    const total = posts.length
    const now = new Date()
    const thisMonth = posts.filter(post => {
      const date = new Date(post.createdAt)
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      )
    }).length
    const authors = new Set(posts.map(p => p.author.id)).size
    const lastPublished = posts.length > 0
      ? posts.reduce((latest, p) =>
          new Date(p.createdAt) > new Date(latest.createdAt) ? p : latest
        ).createdAt
      : null
    return { total, thisMonth, authors, lastPublished }
  }, [posts])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      const response = await fetch(`/api/posts/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }
      const result = await response.json()
      toast.success(result.message || 'Article supprimé')
      setPosts(prev => prev.filter(p => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error("Erreur lors de la suppression de l'article")
    } finally {
      setDeleting(false)
    }
  }

  const columns: Array<DataTableColumn<Post>> = [
    {
      key: 'title',
      header: 'Article',
      sortable: true,
      sortAccessor: post => post.title.toLowerCase(),
      render: post => (
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600'>
            <BookOpen className='h-4 w-4' />
          </div>
          <div className='min-w-0 max-w-[420px]'>
            <p
              className='truncate text-sm font-semibold text-slate-900'
              title={post.title}
            >
              {post.title}
            </p>
            {post.slug && (
              <p
                className='truncate font-mono text-xs text-slate-500'
                title={`/${post.slug}`}
              >
                /{post.slug}
              </p>
            )}
          </div>
        </div>
      ),
      cellClassName: 'max-w-[460px]',
    },
    ...(isAdmin
      ? [
          {
            key: 'author',
            header: 'Auteur',
            sortable: true,
            sortAccessor: (post: Post) =>
              (post.author.name || post.author.email).toLowerCase(),
            render: (post: Post) => {
              const isAuthorAdmin = post.author.roles === 'ADMIN'
              const AuthorIcon = isAuthorAdmin ? Crown : PenLine
              return (
                <div className='flex items-center gap-2 min-w-0'>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                      isAuthorAdmin
                        ? 'bg-purple-50 text-purple-700 ring-purple-200'
                        : 'bg-blue-50 text-blue-700 ring-blue-200'
                    }`}
                  >
                    <AuthorIcon className='h-3 w-3' />
                    {isAuthorAdmin ? 'Admin' : 'Rédacteur'}
                  </span>
                  <span className='truncate text-sm text-slate-600'>
                    {post.author.name || post.author.email}
                  </span>
                </div>
              )
            },
          } as DataTableColumn<Post>,
        ]
      : []),
    {
      key: 'createdAt',
      header: 'Créé',
      sortable: true,
      sortAccessor: post => new Date(post.createdAt),
      render: post => (
        <p className='whitespace-nowrap text-sm text-slate-600'>
          {formatDate(post.createdAt)}
        </p>
      ),
      cellClassName: 'whitespace-nowrap',
    },
    {
      key: 'updatedAt',
      header: 'Modifié',
      sortable: true,
      sortAccessor: post => new Date(post.updatedAt),
      render: post => (
        <p className='whitespace-nowrap text-sm text-slate-600'>
          {formatDate(post.updatedAt)}
        </p>
      ),
      cellClassName: 'whitespace-nowrap',
    },
  ]

  if (isLoading || !isAuthorized) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
        <div className='mx-auto max-w-7xl space-y-8 p-6'>
          <div className='space-y-3'>
            <div className='h-4 w-40 animate-pulse rounded bg-slate-200' />
            <div className='h-10 w-80 animate-pulse rounded bg-slate-200' />
            <div className='h-4 w-96 animate-pulse rounded bg-slate-200' />
          </div>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className='h-32 animate-pulse rounded-2xl border border-slate-200/80 bg-white'
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40'>
      <motion.div
        className='mx-auto max-w-7xl space-y-8 p-6'
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          backHref='/admin'
          backLabel='Retour au panel admin'
          eyebrow='Espace administrateur'
          eyebrowIcon={Shield}
          title='Gestion du blog'
          subtitle={
            isAdmin
              ? 'Consultez, modifiez et supprimez tous les articles publiés sur le blog.'
              : 'Consultez, modifiez et supprimez vos propres articles.'
          }
          actions={
            <Button asChild className='gap-2'>
              <Link href='/createPost'>
                <Plus className='h-4 w-4' />
                Créer un article
              </Link>
            </Button>
          }
        />

        {/* KPI row */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <KpiCard
            label='Total articles'
            value={stats.total}
            hint={isAdmin ? 'tous auteurs confondus' : 'de votre publication'}
            icon={BookOpen}
            tone='blue'
            loading={isLoadingPosts}
          />
          <KpiCard
            label='Publiés ce mois'
            value={stats.thisMonth}
            hint='nouveaux articles'
            icon={CalendarDays}
            tone='emerald'
            loading={isLoadingPosts}
          />
          <KpiCard
            label={isAdmin ? 'Auteurs actifs' : 'Votre activité'}
            value={isAdmin ? stats.authors : stats.total}
            hint={isAdmin ? 'ont publié au moins 1 article' : 'articles rédigés'}
            icon={UserCircle2}
            tone='purple'
            loading={isLoadingPosts}
          />
          <InfoTile
            label='Dernière publication'
            value={stats.lastPublished ? formatDate(stats.lastPublished) : '—'}
            hint='article le plus récent'
            icon={Clock}
            tone='indigo'
            loading={isLoadingPosts}
          />
        </div>

        {/* Search */}
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder='Rechercher un article par titre, auteur ou slug…'
        />

        {/* Data table */}
        <DataTable<Post>
          columns={columns}
          rows={filteredPosts}
          getRowId={post => post.id}
          loading={isLoadingPosts}
          sort={sort}
          onSortChange={setSort}
          rowActions={post => (
            <div className='flex items-center justify-end gap-1'>
              <Button
                variant='ghost'
                size='sm'
                asChild
                className='text-slate-600 hover:text-slate-900'
              >
                <Link
                  href={`/posts/article/${post.slug || post.id}`}
                  target='_blank'
                  title='Voir en ligne'
                >
                  <Eye className='h-4 w-4' />
                </Link>
              </Button>
              <Button
                variant='ghost'
                size='sm'
                asChild
                className='text-slate-600 hover:text-slate-900'
              >
                <Link href={`/admin/blog/edit/${post.id}`} title='Modifier'>
                  <Edit className='h-4 w-4' />
                </Link>
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setDeleteTarget(post)}
                className='text-red-600 hover:bg-red-50 hover:text-red-700'
                title='Supprimer'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          )}
          emptyState={{
            icon: BookOpen,
            title: searchValue
              ? 'Aucun article trouvé'
              : 'Aucun article pour l’instant',
            subtitle: searchValue
              ? 'Essayez d’ajuster votre recherche.'
              : 'Commencez par rédiger votre premier article.',
          }}
        />
      </motion.div>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => !open && !deleting && setDeleteTarget(null)}
      >
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <div className='flex items-start gap-3'>
              <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100'>
                <AlertTriangle className='h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1 space-y-1'>
                <DialogTitle className='text-lg'>
                  Supprimer l&apos;article
                </DialogTitle>
                <DialogDescription className='text-sm text-slate-600'>
                  {deleteTarget ? (
                    <>
                      Cette action supprimera définitivement{' '}
                      <span className='font-semibold text-slate-900'>
                        {deleteTarget.title}
                      </span>
                      . Elle est <strong>irréversible</strong>.
                    </>
                  ) : null}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteTarget && (
            <div className='space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm'>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-slate-500'>Auteur</span>
                <span className='truncate font-medium text-slate-900'>
                  {deleteTarget.author.name || deleteTarget.author.email}
                </span>
              </div>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-slate-500'>Créé le</span>
                <span className='font-medium text-slate-900'>
                  {formatDateTime(deleteTarget.createdAt)}
                </span>
              </div>
              {deleteTarget.slug && (
                <div className='flex items-center justify-between gap-4'>
                  <span className='text-slate-500'>Slug</span>
                  <span className='truncate font-mono text-xs text-slate-900'>
                    /{deleteTarget.slug}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className='gap-2'>
            <Button
              variant='outline'
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={deleting}
              className='gap-2'
            >
              {deleting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Suppression…
                </>
              ) : (
                <>
                  <Trash2 className='h-4 w-4' />
                  Supprimer définitivement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
