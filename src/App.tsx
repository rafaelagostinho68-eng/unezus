import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { HashRouter, Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import * as Icons from 'lucide-react'
import clsx from 'clsx'
import {
  adminAiActions,
  calendarEvents as initialCalendarEvents,
  caseStudies as initialCaseStudies,
  certificates as initialCertificates,
  lessonComments as initialLessonComments,
  lessons as initialLessons,
  reportTemplates as initialReportTemplates,
  specialties as initialSpecialties,
  students as initialStudents,
  supportTickets,
  teachers as initialTeachers,
  type AdminStatus,
  type CalendarEvent,
  type CaseStudy,
  type Certificate,
  type Lesson,
  type LessonComment,
  type LessonStatus,
  type ReportTemplate,
  type Specialty,
  type Student,
  type Teacher,
  type VideoSource,
} from './data'
import { deleteLessonVideoAsset, getLessonVideoAsset, saveLessonVideoAsset } from './mediaStore'

type IconType = React.ComponentType<{ className?: string }>

const iconSet = Icons as unknown as Record<string, IconType>

const storagePrefix = 'unezus-academy-preview'
const unezusSymbolUrl = 'https://unezus.com.br/wp-content/webp-express/webp-images/uploads/2025/02/unezus_transparente_01.png.webp'
const unezusWordmarkUrl = 'https://unezus.com.br/wp-content/uploads/2025/02/Group-77-1.webp'

const lessonStatusLabels: Record<LessonStatus, string> = {
  novo: 'Novo',
  'em andamento': 'Em andamento',
  concluido: 'Concluído',
  'em breve': 'Em breve',
}

const adminStatusLabels: Record<AdminStatus, string> = {
  publicada: 'Publicada',
  rascunho: 'Rascunho',
  'em breve': 'Em breve',
}

const eventTypes: CalendarEvent['type'][] = [
  'Aula liberada',
  'Live',
  'Encontro presencial',
  'Estudo de caso',
  'Prova/simulado',
  'Prazo de certificado',
]

const reportCategories = ['Abdome total', 'Tireoide', 'Mama', 'Obstétrico', 'Doppler', 'Pélvico', 'Partes moles']

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`${storagePrefix}:${key}`)
      return stored ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setStoredValue: typeof setValue = useCallback((nextValue) => {
    setValue((currentValue) => {
      const resolved = typeof nextValue === 'function' ? (nextValue as (value: T) => T)(currentValue) : nextValue
      localStorage.setItem(`${storagePrefix}:${key}`, JSON.stringify(resolved))
      return resolved
    })
  }, [key])

  return [value, setStoredValue] as const
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function makeId(prefix: string, value: string) {
  const base = normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return `${prefix}-${base || Date.now()}`
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function getTodayKey() {
  const today = new Date()
  return getDateKeyFromDate(today)
}

function getDateKeyFromDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDaysToDateKey(days: number) {
  const nextDate = new Date(`${getTodayKey()}T12:00:00`)
  nextDate.setDate(nextDate.getDate() + days)
  return getDateKeyFromDate(nextDate)
}

function getMonthShortLabel(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '')
}

function getDateDistance(date: string) {
  const target = new Date(`${date}T12:00:00`).getTime()
  const today = new Date(`${getTodayKey()}T12:00:00`).getTime()
  return Math.round((target - today) / 86400000)
}

function isLessonReleased(lesson: Lesson) {
  return lesson.adminStatus === 'publicada' && lesson.releaseDate <= getTodayKey()
}

function isLessonVisibleToStudent(lesson: Lesson) {
  return lesson.adminStatus !== 'rascunho'
}

function isLessonLocked(lesson: Lesson) {
  return !isLessonReleased(lesson)
}

function getReleaseLabel(lesson: Lesson) {
  if (lesson.adminStatus === 'rascunho') return 'Conteúdo em revisão'
  if (isLessonReleased(lesson)) return 'Disponível agora'
  const days = getDateDistance(lesson.releaseDate)
  if (days <= 0) return 'Liberação programada'
  if (days === 1) return 'Libera amanhã'
  return `Libera em ${formatDate(lesson.releaseDate)}`
}

function getVideoSourceLabel(source?: VideoSource) {
  if (source === 'upload') return 'Upload direto'
  if (source === 'youtube') return 'YouTube'
  return 'Prévia'
}

function getIcon(name: string) {
  return iconSet[name] ?? iconSet.BookOpen
}

function IconByName({ name, className }: { name: string; className?: string }) {
  return React.createElement(getIcon(name), { className })
}

const benefitIconNames = ['MonitorPlay', 'FileSearch', 'FileText', 'CalendarDays', 'Download', 'MessageCircle']

function getTeacher(teacherId: string, teachers: Teacher[]) {
  return teachers.find((teacher) => teacher.id === teacherId) ?? teachers[0]
}

function getSpecialty(slug: string, specialties: Specialty[]) {
  return specialties.find((specialty) => specialty.slug === slug) ?? specialties[0]
}

function getLessonProgress(lesson: Lesson, completedIds: string[]) {
  if (isLessonLocked(lesson)) return 0
  return completedIds.includes(lesson.id) ? 100 : lesson.progress
}

function getLessonStatus(lesson: Lesson, completedIds: string[]): LessonStatus {
  if (completedIds.includes(lesson.id)) return 'concluido'
  if (isLessonLocked(lesson)) return 'em breve'
  return lesson.status
}

function statusTone(status: LessonStatus | AdminStatus | string) {
  if (status === 'concluido' || status === 'publicada' || status === 'respondido' || status === 'disponível') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  }
  if (status === 'novo' || status === 'ativo') return 'bg-sky-50 text-sky-700 ring-sky-200'
  if (status === 'em andamento' || status === 'em análise') return 'bg-amber-50 text-amber-700 ring-amber-200'
  if (status === 'em breve' || status === 'rascunho' || status === 'pendente') return 'bg-slate-100 text-slate-650 ring-slate-200'
  return 'bg-slate-100 text-slate-650 ring-slate-200'
}

type DataContextType = {
  lessons: Lesson[]
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>
  certificates: Certificate[]
  setCertificates: React.Dispatch<React.SetStateAction<Certificate[]>>
  specialties: Specialty[]
  setSpecialties: React.Dispatch<React.SetStateAction<Specialty[]>>
  teachers: Teacher[]
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>
  reports: ReportTemplate[]
  setReports: React.Dispatch<React.SetStateAction<ReportTemplate[]>>
  cases: CaseStudy[]
  setCases: React.Dispatch<React.SetStateAction<CaseStudy[]>>
  events: CalendarEvent[]
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>
  students: Student[]
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>
  comments: LessonComment[]
  setComments: React.Dispatch<React.SetStateAction<LessonComment[]>>
  completedLessonIds: string[]
  setCompletedLessonIds: React.Dispatch<React.SetStateAction<string[]>>
}

const DataContext = React.createContext<DataContextType | null>(null)

function useData() {
  const context = React.useContext(DataContext)
  if (!context) throw new Error('DataContext indisponível')
  return context
}

function DataProvider({ children }: { children: ReactNode }) {
  const [lessons, setLessons] = useLocalStorageState('lessons', initialLessons)
  const [certificates, setCertificates] = useLocalStorageState('certificates', initialCertificates)
  const [specialties, setSpecialties] = useLocalStorageState('specialties', initialSpecialties)
  const [teachers, setTeachers] = useLocalStorageState('teachers', initialTeachers)
  const [reports, setReports] = useLocalStorageState('reports', initialReportTemplates)
  const [cases, setCases] = useLocalStorageState('cases', initialCaseStudies)
  const [events, setEvents] = useLocalStorageState('events', initialCalendarEvents)
  const [students, setStudents] = useLocalStorageState('students', initialStudents)
  const [comments, setComments] = useLocalStorageState('comments', initialLessonComments)
  const [completedLessonIds, setCompletedLessonIds] = useLocalStorageState<string[]>('completed', [])

  useEffect(() => {
    setLessons((current) =>
      current.map((lesson) => {
        const seeded = initialLessons.find((item) => item.id === lesson.id)
        if (!seeded) return lesson
        return {
          ...lesson,
          videoSource: lesson.videoSource ?? seeded.videoSource ?? (getYouTubeId(seeded.videoUrl ?? lesson.videoUrl) ? 'youtube' : 'placeholder'),
          videoUrl: lesson.videoSource === 'upload' ? '' : lesson.videoUrl ?? seeded.videoUrl,
        }
      }),
    )
    setCertificates((current) =>
      current.map((certificate) => {
        const seeded = initialCertificates.find((item) => item.id === certificate.id)
        return seeded ? { ...seeded, ...certificate } : certificate
      }),
    )
    setTeachers((current) =>
      current.map((teacher) => {
        const seeded = initialTeachers.find((item) => item.id === teacher.id)
        if (!seeded) return teacher
        return {
          ...teacher,
          bio: seeded.bio,
          title: seeded.title,
          photo: seeded.photo,
          lattes: seeded.lattes,
          credentials: seeded.credentials,
        }
      }),
    )
  }, [setCertificates, setLessons, setTeachers])

  return (
    <DataContext.Provider
      value={{
        lessons,
        setLessons,
        certificates,
        setCertificates,
        specialties,
        setSpecialties,
        teachers,
        setTeachers,
        reports,
        setReports,
        cases,
        setCases,
        events,
        setEvents,
        students,
        setStudents,
        comments,
        setComments,
        completedLessonIds,
        setCompletedLessonIds,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

function BrandMark({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <span
        className={clsx(
          'grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border bg-white p-1 shadow-sm',
          light ? 'border-white/20' : 'border-sky-100',
        )}
      >
        <img src={unezusSymbolUrl} alt="UNEZUS" className="h-full w-full object-contain" />
      </span>
      <span
        className={clsx(
          'min-w-0',
          light && 'rounded-xl bg-white/95 px-2.5 py-1.5 shadow-sm',
          compact && 'hidden sm:block',
        )}
      >
        <img
          src={unezusWordmarkUrl}
          alt="UNEZUS"
          className={clsx('h-6 w-28 object-contain object-left sm:w-36', compact && 'sm:h-6')}
        />
        {!compact && (
          <span className={clsx('mt-0.5 block text-xs font-semibold leading-none', light ? 'text-slate-600' : 'text-slate-500')}>
            Academy
          </span>
        )}
      </span>
    </Link>
  )
}

function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'sky' | 'emerald' | 'amber' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-650 ring-slate-200',
    sky: 'bg-sky-50 text-sky-700 ring-sky-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  }
  return <span className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1', tones[tone])}>{children}</span>
}

function StatusBadge({ status }: { status: LessonStatus | AdminStatus | string }) {
  const label = lessonStatusLabels[status as LessonStatus] ?? adminStatusLabels[status as AdminStatus] ?? status
  return <span className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1', statusTone(status))}>{label}</span>
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={clsx('h-2 overflow-hidden rounded-full bg-slate-100', className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-400" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
      {action}
    </div>
  )
}

function MedicalThumb({ tone = 'doppler', label }: { tone?: string; label?: string }) {
  const tones: Record<string, string> = {
    doppler: 'from-sky-950 via-sky-700 to-cyan-500',
    vascular: 'from-slate-950 via-blue-800 to-sky-500',
    mama: 'from-sky-900 via-cyan-700 to-teal-400',
    gineco: 'from-blue-950 via-sky-700 to-indigo-400',
    obstetrico: 'from-sky-950 via-blue-700 to-emerald-400',
    tireoide: 'from-cyan-950 via-sky-700 to-blue-400',
    abdome: 'from-slate-950 via-sky-800 to-cyan-500',
    pocus: 'from-teal-950 via-emerald-700 to-cyan-400',
    partes: 'from-slate-900 via-cyan-800 to-sky-400',
  }

  return (
    <div className={clsx('relative h-full min-h-36 overflow-hidden rounded-xl bg-gradient-to-br', tones[tone] ?? tones.doppler)}>
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_22%_28%,white_0_1px,transparent_1px),linear-gradient(110deg,transparent_0_20%,rgba(255,255,255,.25)_21%,transparent_23%_100%)] [background-size:18px_18px,100%_100%]" />
      <div className="absolute left-4 top-4 rounded-full bg-white/12 px-2.5 py-1 text-xs font-black uppercase tracking-[0.2em] text-white/90 ring-1 ring-white/20">
        US
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
        <span className="text-sm font-bold text-white/95">{label}</span>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/16 text-white ring-1 ring-white/25">
          <Icons.Play className="h-4 w-4 fill-current" />
        </span>
      </div>
      <svg className="absolute bottom-7 left-4 right-4 h-8 w-[calc(100%-2rem)] text-white/35" viewBox="0 0 280 40" aria-hidden="true">
        <path
          d="M0 24 C18 4 28 4 42 24 S70 44 86 22 S114 3 132 22 S164 44 180 24 S210 5 230 24 S258 42 280 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
    </div>
  )
}

function getYouTubeId(url?: string) {
  if (!url) return null
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

function LessonVideoPlayer({ lesson, progress }: { lesson: Lesson; progress: number }) {
  const youtubeId = getYouTubeId(lesson.videoUrl)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('')

  useEffect(() => {
    let active = true
    let objectUrl = ''

    if (lesson.videoSource !== 'upload' || !lesson.videoAssetId) {
      return
    }

    getLessonVideoAsset(lesson.videoAssetId)
      .then((asset) => {
        if (!active || !asset) {
          setUploadedVideoUrl('')
          return
        }
        objectUrl = URL.createObjectURL(asset.blob)
        setUploadedVideoUrl(objectUrl)
      })
      .catch(() => {
        if (active) setUploadedVideoUrl('')
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [lesson.videoAssetId, lesson.videoSource])

  if (youtubeId) {
    return (
      <div className="relative aspect-video bg-slate-950">
        <iframe
          title={lesson.title}
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-slate-950/72 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white backdrop-blur">
          Replay YouTube
        </div>
      </div>
    )
  }

  if (lesson.videoSource === 'upload' && uploadedVideoUrl) {
    return (
      <div className="relative aspect-video bg-slate-950">
        <video controls className="absolute inset-0 h-full w-full bg-slate-950 object-contain" preload="metadata" src={uploadedVideoUrl} />
        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-slate-950/72 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white backdrop-blur">
          Upload direto
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-video">
      <MedicalThumb tone={lesson.thumbnail} label={lesson.title} />
      <div className="absolute inset-0 grid place-items-center bg-slate-950/18">
        <button className="grid h-20 w-20 place-items-center rounded-full bg-white/92 text-sky-950 shadow-2xl shadow-black/25">
          <Icons.Play className="h-8 w-8 fill-current" />
        </button>
      </div>
      <div className="absolute bottom-5 left-5 right-5">
        <ProgressBar value={progress} className="bg-white/20" />
      </div>
    </div>
  )
}

function TeacherAvatar({ teacher, size = 'md' }: { teacher: Teacher; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: 'h-10 w-10 rounded-xl text-xs',
    md: 'h-14 w-14 rounded-2xl text-sm',
    lg: 'h-20 w-20 rounded-2xl text-base',
    xl: 'h-52 w-52 rounded-[2rem] text-xl',
  }

  return (
    <span className={clsx('grid shrink-0 place-items-center overflow-hidden bg-sky-50 font-black text-sky-900 ring-1 ring-sky-100', sizes[size])}>
      {teacher.photo ? (
        <img src={teacher.photo} alt={teacher.name} className="h-full w-full object-contain" />
      ) : (
        teacher.avatar
      )}
    </span>
  )
}

function LessonCard({ lesson, compact = false }: { lesson: Lesson; compact?: boolean }) {
  const { teachers, specialties, completedLessonIds } = useData()
  const teacher = getTeacher(lesson.teacherId, teachers)
  const specialty = getSpecialty(lesson.specialtySlug, specialties)
  const progress = getLessonProgress(lesson, completedLessonIds)
  const status = getLessonStatus(lesson, completedLessonIds)
  const locked = isLessonLocked(lesson)

  return (
    <Link
      to={`/app/aulas/${lesson.id}`}
      className={clsx(
        'group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-950/8',
        compact ? 'min-w-72' : '',
      )}
    >
      <div className={clsx(compact ? 'h-36' : 'h-44', 'relative')}>
        <MedicalThumb tone={lesson.thumbnail} label={specialty.name} />
        {locked && (
          <div className="absolute inset-0 flex items-start justify-between bg-slate-950/42 p-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-900">
              <Icons.Lock className="h-3.5 w-3.5" />
              Em liberação
            </span>
            <span className="rounded-full bg-slate-950/72 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/15">
              {formatDate(lesson.releaseDate)}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-black leading-snug text-slate-950">{lesson.title}</h3>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span>{teacher.name.replace('Profª ', '').replace('Prof. ', '')}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{lesson.duration}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{specialty.name}</span>
        </div>
        <div className="space-y-2">
          <ProgressBar value={progress} />
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>{locked ? getReleaseLabel(lesson) : `${progress}% concluído`}</span>
            <span>{locked ? 'Trilha gradual' : formatDate(lesson.releaseDate)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function CertificateCard({
  certificate,
  downloaded,
  onOpen,
}: {
  certificate: Certificate
  downloaded: boolean
  onOpen: (certificate: Certificate) => void
}) {
  const { teachers, specialties } = useData()
  const teacher = getTeacher(certificate.teacherId, teachers)
  const specialty = getSpecialty(certificate.specialtySlug, specialties)

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-950 via-sky-600 to-cyan-400" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{certificate.module}</p>
          <h3 className="mt-2 text-lg font-black leading-tight text-slate-950">{certificate.title}</h3>
        </div>
        <StatusBadge status={certificate.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="sky">{specialty.name}</Badge>
        <Badge tone="slate">{certificate.hours}</Badge>
        {downloaded && <Badge tone="emerald">Baixado</Badge>}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{certificate.summary}</p>
      <div className="mt-5">
        <ProgressBar value={certificate.progress} />
        <div className="mt-2 flex justify-between text-xs font-bold text-slate-400">
          <span>{certificate.progress}% da trilha concluída</span>
          <span>{certificate.status === 'disponível' ? 'Emissão liberada' : 'Em progresso'}</span>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Responsável</p>
          <p className="text-sm font-black text-slate-900">{teacher.name}</p>
        </div>
        <button onClick={() => onOpen(certificate)} className="rounded-2xl bg-sky-950 px-4 py-2.5 text-sm font-black text-white">
          {certificate.status === 'disponível' ? 'Visualizar' : 'Ver critérios'}
        </button>
      </div>
    </div>
  )
}

function CertificatesShowcase({ compact = false }: { compact?: boolean }) {
  const { certificates, students, teachers, specialties } = useData()
  const [selected, setSelected] = useState<Certificate | null>(null)
  const [downloadedIds, setDownloadedIds] = useLocalStorageState<string[]>('certificate-downloads', [])
  const student = students.find((item) => item.id === 'joao-mendes') ?? students[0]

  const downloadCertificate = (certificate: Certificate) => {
    const teacher = getTeacher(certificate.teacherId, teachers)
    const specialty = getSpecialty(certificate.specialtySlug, specialties)
    const documentHtml = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${certificate.title}</title>
    <style>
      body { margin: 0; background: #e2e8f0; font-family: "Georgia", serif; }
      .sheet { width: 1120px; min-height: 790px; margin: 24px auto; background: linear-gradient(135deg, #f8fbff 0%, #ffffff 58%, #eff6ff 100%); border: 12px solid #082f49; padding: 64px; box-sizing: border-box; color: #0f172a; }
      .eyebrow { letter-spacing: .28em; text-transform: uppercase; font-size: 12px; font-family: Arial, sans-serif; color: #0f6b9f; font-weight: 700; }
      h1 { margin: 24px 0 12px; font-size: 52px; line-height: 1; }
      h2 { margin: 18px 0 0; font-size: 42px; color: #075985; }
      p { font-size: 20px; line-height: 1.7; margin: 16px 0; font-family: Arial, sans-serif; }
      .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-top: 36px; }
      .box { border: 1px solid #bfdbfe; background: rgba(255,255,255,.78); padding: 18px; border-radius: 18px; }
      .label { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: #64748b; font-weight: 700; }
      .value { margin-top: 8px; font-size: 18px; font-weight: 700; color: #0f172a; }
      .footer { display: flex; justify-content: space-between; gap: 24px; margin-top: 56px; align-items: flex-end; }
      .signature { border-top: 1px solid #94a3b8; padding-top: 12px; min-width: 320px; }
      .code { text-align: right; font-family: Arial, sans-serif; font-size: 14px; color: #475569; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="eyebrow">UNEZUS Academy</div>
      <h1>Certificado de Conclusão</h1>
      <p>Certificamos que</p>
      <h2>${student.name}</h2>
      <p>concluiu o módulo <strong>${certificate.title}</strong>, da especialidade de <strong>${specialty.name}</strong>, com carga horária de <strong>${certificate.hours}</strong>.</p>
      <div class="meta">
        <div class="box"><div class="label">Módulo</div><div class="value">${certificate.module}</div></div>
        <div class="box"><div class="label">Situação</div><div class="value">${certificate.status}</div></div>
        <div class="box"><div class="label">Emitido em</div><div class="value">${certificate.issueDate ? formatDate(certificate.issueDate) : 'Disponível na plataforma'}</div></div>
        <div class="box"><div class="label">Código</div><div class="value">${certificate.certificateCode}</div></div>
      </div>
      <div class="footer">
        <div class="signature">
          <div style="font-size:24px;font-weight:700;">${teacher.name}</div>
          <div style="margin-top:6px;font-family:Arial,sans-serif;color:#475569;">${teacher.title}</div>
        </div>
        <div class="code">Documento demonstrativo gerado na prévia da plataforma UNEZUS Academy.</div>
      </div>
    </div>
  </body>
</html>`
    const file = new Blob([documentHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${makeId('certificado', certificate.title)}.html`
    anchor.click()
    URL.revokeObjectURL(url)
    setDownloadedIds((current) => (current.includes(certificate.id) ? current : [...current, certificate.id]))
  }

  return (
    <>
      <div className={clsx('grid gap-5', compact ? 'lg:grid-cols-2' : 'lg:grid-cols-3')}>
        {certificates.map((certificate) => (
          <CertificateCard
            key={certificate.id}
            certificate={certificate}
            downloaded={downloadedIds.includes(certificate.id)}
            onOpen={setSelected}
          />
        ))}
      </div>
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          {selected.status === 'disponível' ? (
            <div>
              <div className="overflow-hidden rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,.22),transparent_28%),linear-gradient(135deg,#f8fbff_0%,#ffffff_55%,#eff6ff_100%)] p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">UNEZUS Academy</p>
                <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Certificado de conclusão</h3>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Aluno certificado</p>
                <p className="mt-2 text-4xl font-black text-sky-900">{student.name}</p>
                <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
                  Conclusão confirmada do módulo <strong>{selected.title}</strong>, com emissão liberada para download imediato dentro da biblioteca premium da UNEZUS.
                </p>
                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <InfoLine label="Módulo" value={selected.module} />
                  <InfoLine label="Carga horária" value={selected.hours} />
                  <InfoLine label="Emissão" value={selected.issueDate ? formatDate(selected.issueDate) : 'Disponível agora'} />
                  <InfoLine label="Código" value={selected.certificateCode} />
                </div>
                <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-sky-100 bg-white/85 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Assinatura responsável</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{getTeacher(selected.teacherId, teachers).name}</p>
                    <p className="text-sm font-semibold text-slate-500">{getTeacher(selected.teacherId, teachers).title}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => downloadCertificate(selected)} className="rounded-2xl bg-sky-950 px-5 py-3 text-sm font-black text-white">
                  Baixar certificado fake
                </button>
                <button onClick={() => setSelected(null)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Certificado em construção</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{selected.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{selected.summary}</p>
                <ProgressBar value={selected.progress} className="mt-5" />
                <p className="mt-2 text-xs font-bold text-slate-500">{selected.progress}% concluído para emissão automática</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoLine label="Módulo" value={selected.module} />
                <InfoLine label="Carga horária" value={selected.hours} />
                <InfoLine label="Responsável" value={getTeacher(selected.teacherId, teachers).name} />
                <InfoLine label="Código reservado" value={selected.certificateCode} />
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  dark = false,
}: {
  icon: string
  label: string
  value: string
  detail?: string
  dark?: boolean
}) {
  return (
    <div className={clsx('rounded-2xl border p-5 shadow-sm', dark ? 'border-white/10 bg-white/7 text-white' : 'border-slate-200 bg-white')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={clsx('text-xs font-black uppercase tracking-[0.16em]', dark ? 'text-sky-100' : 'text-slate-400')}>{label}</p>
          <p className={clsx('mt-2 text-2xl font-black tracking-tight', dark ? 'text-white' : 'text-slate-950')}>{value}</p>
          {detail && <p className={clsx('mt-1 text-sm font-semibold', dark ? 'text-sky-100/80' : 'text-slate-500')}>{detail}</p>}
        </div>
        <span className={clsx('grid h-11 w-11 place-items-center rounded-xl', dark ? 'bg-white/10 text-cyan-100' : 'bg-sky-50 text-sky-700')}>
          <IconByName name={icon} className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function SearchResults({ query, onNavigate }: { query: string; onNavigate?: () => void }) {
  const { lessons, teachers, specialties, reports, cases } = useData()
  const visibleLessons = lessons.filter(isLessonVisibleToStudent)
  const results = useMemo(() => {
    const q = normalize(query)
    if (!q.trim()) return []

    const match = (...fields: string[]) => fields.some((field) => normalize(field).includes(q))
    const lessonResults = visibleLessons
      .filter((lesson) => match(lesson.title, lesson.description, lesson.tags.join(' '), lesson.module, lesson.specialtySlug))
      .map((lesson) => ({
        id: `lesson-${lesson.id}`,
        type: 'Aula',
        title: lesson.title,
        subtitle: `${getSpecialty(lesson.specialtySlug, specialties).name} · ${getReleaseLabel(lesson)}`,
        to: `/app/aulas/${lesson.id}`,
      }))

    const teacherResults = teachers
      .filter((teacher) => match(teacher.name, teacher.title, teacher.bio, teacher.specialties.join(' ')))
      .map((teacher) => ({
        id: `teacher-${teacher.id}`,
        type: 'Professor',
        title: teacher.name,
        subtitle: teacher.title,
        to: '/app',
      }))

    const reportResults = reports
      .filter((report) => match(report.title, report.category, report.description, report.content))
      .map((report) => ({
        id: `report-${report.id}`,
        type: 'Laudo',
        title: report.title,
        subtitle: report.category,
        to: '/app/laudos',
      }))

    const caseResults = cases
      .filter((caseStudy) => match(caseStudy.title, caseStudy.description, caseStudy.findings, caseStudy.hypothesis))
      .map((caseStudy) => ({
        id: `case-${caseStudy.id}`,
        type: 'Caso',
        title: caseStudy.title,
        subtitle: getSpecialty(caseStudy.specialtySlug, specialties).name,
        to: `/app/casos/${caseStudy.slug}`,
      }))

    const specialtyResults = specialties
      .filter((specialty) => match(specialty.name, specialty.description))
      .map((specialty) => ({
        id: `specialty-${specialty.id}`,
        type: 'Especialidade',
        title: specialty.name,
        subtitle: `${visibleLessons.filter((lesson) => lesson.specialtySlug === specialty.slug).length} aulas`,
        to: `/app/especialidades/${specialty.slug}`,
      }))

    return [...lessonResults, ...teacherResults, ...reportResults, ...caseResults, ...specialtyResults].slice(0, 8)
  }, [cases, query, reports, specialties, teachers, visibleLessons])

  if (!query.trim()) return null

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15">
      {results.length === 0 ? (
        <div className="p-5 text-sm font-semibold text-slate-500">Nenhum resultado encontrado.</div>
      ) : (
        <div className="max-h-96 overflow-auto p-2">
          {results.map((result) => (
            <Link
              key={result.id}
              to={result.to}
              onClick={onNavigate}
              className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition hover:bg-sky-50"
            >
              <span>
                <span className="block text-sm font-black text-slate-950">{result.title}</span>
                <span className="block text-xs font-semibold text-slate-500">{result.subtitle}</span>
              </span>
              <Badge tone="sky">{result.type}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function GlobalSearch({ prominent = false, onNavigate }: { prominent?: boolean; onNavigate?: () => void }) {
  const [query, setQuery] = useState('')
  return (
    <div className="relative w-full">
      <Icons.Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar aulas, laudos, BI-RADS, endometriose, Doppler..."
        className={clsx(
          'w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100',
          prominent ? 'h-14 text-base shadow-xl shadow-sky-950/8' : 'h-11 text-sm',
        )}
      />
      <SearchResults
        query={query}
        onNavigate={() => {
          setQuery('')
          onNavigate?.()
        }}
      />
    </div>
  )
}

function MobileBottomNav({
  items,
  admin = false,
}: {
  items: [string, string, string][]
  admin?: boolean
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/94 px-3 pb-[calc(0.7rem+env(safe-area-inset-bottom))] pt-2 shadow-2xl shadow-slate-950/16 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.slice(0, 5).map(([label, to, icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === (admin ? '/admin' : '/app')}
            className={({ isActive }) =>
              clsx(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-black leading-none transition',
                isActive
                  ? admin
                    ? 'bg-sky-950 text-white'
                    : 'bg-sky-50 text-sky-800'
                  : 'text-slate-500 hover:bg-slate-50',
              )
            }
          >
            <IconByName name={icon} className="h-4 w-4" />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function LandingPage() {
  const scientificLead = initialTeachers.find((teacher) => teacher.id === 'antonio-gadelha') ?? initialTeachers[0]
  const benefits = [
    ['Aulas por especialidade', 'Trilhas organizadas para revisão contínua por área.'],
    ['Estudos de caso', 'Casos clínicos comentados com achados e discussão.'],
    ['Modelos de laudos', 'Biblioteca prática para padronizar a rotina.'],
    ['Calendário de novas aulas', 'Liberação gradual para manter recorrência.'],
    ['Materiais complementares', 'PDFs, mapas mentais, checklists e resumos.'],
    ['Comunidade e dúvidas', 'Comentários moderados e respostas de professores.'],
  ]
  const plans = [
    {
      name: 'Aluno individual',
      badge: 'Mais flexível',
      description: 'Para médicos que querem evolução contínua com assinatura enxuta e acesso imediato às trilhas liberadas.',
      items: ['Aulas liberadas por especialidade', 'Laudos, casos e comunidade', 'Calendário mensal e certificados'],
      accent: 'sky' as const,
    },
    {
      name: 'Turma presencial',
      badge: 'Pós-curso',
      description: 'Extensão premium do curso presencial para manter revisão, engajamento e relacionamento com a escola.',
      items: ['Replay das aulas presenciais', 'Biblioteca complementar da turma', 'Cronograma progressivo após o curso'],
      accent: 'emerald' as const,
    },
    {
      name: 'Assinatura mensal',
      badge: 'Recorrência',
      description: 'Modelo ideal para educação continuada, com novas aulas, biblioteca viva e retenção de alunos por assinatura.',
      items: ['Liberação gradual automática', 'Novas aulas todos os meses', 'Gamificação e ranking'],
      accent: 'amber' as const,
    },
    {
      name: 'Acesso vitalício',
      badge: 'Ticket premium',
      description: 'Produto de maior valor percebido para módulos específicos, bibliotecas temáticas e pacotes estratégicos.',
      items: ['Acesso permanente ao acervo contratado', 'Certificados por módulo', 'Biblioteca de laudos e materiais'],
      accent: 'slate' as const,
    },
    {
      name: 'Professor/Admin',
      badge: 'Operação simples',
      description: 'Painel para publicar por YouTube ou upload direto, organizar datas e operar a escola sem depender de programador.',
      items: ['Cadastro rápido de aulas', 'Agendamento de liberação', 'Gestão de alunos, laudos e casos'],
      accent: 'sky' as const,
    },
  ]
  const authorityProof = [
    'Coordenação científica liderada pelo Prof. Dr. Antônio Gadelha.',
    'Credenciais acadêmicas destacadas com acesso ao currículo Lattes.',
    'Curadoria pensada para manter a marca UNEZUS associada à prática médica séria e atualizada.',
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-5">
          <BrandMark />
          <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 md:flex">
            <a href="#conteudos">Conteúdos</a>
            <a href="#professores">Especialistas</a>
            <a href="#plataforma">Preview</a>
          </nav>
          <Link
            to="/login"
            className="rounded-full bg-sky-950 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-950/20 transition hover:bg-sky-800"
          >
            Acessar plataforma
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-sky-950 text-white">
          <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(120deg,rgba(14,165,233,.24),transparent_48%),radial-gradient(circle_at_70%_22%,rgba(34,211,238,.28),transparent_28%),linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:100%_100%,100%_100%,48px_48px,48px_48px]" />
          <div className="relative mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-5 lg:grid-cols-[1.03fr_.97fr] lg:py-20">
            <div className="max-w-3xl">
              <Badge tone="sky">UNEZUS Academy</Badge>
              <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
                A plataforma de educação continuada em ultrassonografia da UNEZUS
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-sky-50/86">
                Aulas, casos clínicos, modelos de laudos e conteúdos exclusivos em um ambiente moderno para médicos que querem evoluir na prática.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-sky-950 shadow-xl shadow-black/20 transition hover:-translate-y-0.5"
                >
                  Acessar plataforma <Icons.ChevronRight className="h-4 w-4" />
                </Link>
                <a
                  href="#conteudos"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Conhecer conteúdos
                </a>
              </div>
              <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
                {[
                  ['42', 'aulas publicadas'],
                  ['8', 'especialidades'],
                  ['74%', 'conclusão média'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                    <p className="text-2xl font-black">{value}</p>
                    <p className="mt-1 text-xs font-bold text-sky-100/80">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="plataforma" className="relative pb-10">
              <div className="rounded-[2rem] border border-white/12 bg-white/10 p-3 shadow-2xl shadow-black/30 backdrop-blur-md">
                <div className="overflow-hidden rounded-[1.5rem] bg-slate-50 text-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">UNEZUS Academy</p>
                      <p className="text-sm font-black text-slate-950">Continue assistindo</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Ao vivo</span>
                  </div>
                  <div className="grid gap-4 p-5">
                    {initialLessons.slice(0, 3).map((lesson) => (
                      <div key={lesson.id} className="grid grid-cols-[112px_1fr] gap-4 rounded-2xl border border-slate-200 bg-white p-3">
                        <MedicalThumb tone={lesson.thumbnail} label="Aula" />
                        <div className="self-center">
                          <p className="text-sm font-black text-slate-950">{lesson.title}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">{lesson.duration} · {lesson.module}</p>
                          <ProgressBar value={lesson.progress || 22} className="mt-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 right-8 hidden rounded-2xl border border-white/12 bg-white/12 p-4 shadow-2xl shadow-black/30 backdrop-blur lg:block">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Direção científica</p>
                <p className="mt-1 text-sm font-bold text-white">Curadoria do Prof. Dr. Antônio Gadelha</p>
              </div>
            </div>
          </div>
        </section>

        <section id="conteudos" className="mx-auto max-w-7xl px-4 py-20 sm:px-5">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">Conteúdo recorrente</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Uma plataforma vendável para manter alunos ativos depois do curso presencial.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map(([title, detail], index) => {
              return (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-sky-50 text-sky-700">
                    <IconByName name={benefitIconNames[index]} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{detail}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-5 lg:grid-cols-[420px_1fr]">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute inset-8 rounded-[2rem] bg-sky-100 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-2xl shadow-slate-950/10">
                <img src={scientificLead.photo} alt={scientificLead.name} className="mx-auto aspect-square w-full object-contain" />
              </div>
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">Direção científica</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{scientificLead.name}</h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{scientificLead.bio}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {scientificLead.credentials?.map((credential) => (
                  <div key={credential} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <Icons.CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="text-sm font-bold leading-6 text-slate-700">{credential}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={scientificLead.lattes} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-sky-950 px-5 py-3 text-sm font-black text-white">
                  Ver currículo Lattes
                </a>
                <Link to="/login" className="inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">
                  Acessar aulas da demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-5">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/18">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100">Autoridade institucional</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">A UNEZUS aparece como escola séria, atualizada e liderada por um nome forte da ultrassonografia.</h2>
              <div className="mt-6 space-y-3">
                {authorityProof.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 text-sm font-semibold leading-6 text-sky-50/86">
                    <Icons.CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-100" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">Dr. Antônio Gadelha</p>
              <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Mais do que professor: âncora de autoridade da plataforma.</h3>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Na demo, a presença dele foi organizada para sustentar a percepção premium da UNEZUS desde a landing, passando pela direção científica, cards de professores, páginas de aula e certificados.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoLine label="Titulação" value="Mestre, Doutor e Pós-Doutor pela USP" />
                <InfoLine label="Destaque" value="Especialista em Ultrassonografia e GO" />
                <InfoLine label="Entidade" value="Presidente da APBUS" />
                <InfoLine label="Prova social" value="Currículo Lattes visível na apresentação" />
              </div>
            </div>
          </div>
        </section>

        <section id="professores" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-5">
            <SectionTitle title="Professores e especialistas" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {initialTeachers.map((teacher) => (
                <div key={teacher.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-4">
                    <TeacherAvatar teacher={teacher} />
                    <div>
                      <h3 className="font-black text-slate-950">{teacher.name}</h3>
                      <p className="text-sm font-semibold text-slate-500">{teacher.title}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{teacher.bio}</p>
                  {teacher.credentials && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {teacher.credentials.slice(0, 2).map((credential) => (
                        <Badge key={credential} tone="sky">{credential}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-5">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-700">Planos e acessos</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Modelos comerciais claros para assinatura, pós-curso e biblioteca premium.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              A prévia agora mostra melhor como a UNEZUS pode vender acessos diferentes sem confundir o aluno nem complicar a operação.
            </p>
          </div>
          <div className="mt-10 grid gap-4 xl:grid-cols-5 md:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.name} className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Plano</p>
                    <h3 className="mt-2 text-xl font-black text-slate-950">{plan.name}</h3>
                  </div>
                  <Badge tone={plan.accent}>{plan.badge}</Badge>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>
                <div className="mt-5 space-y-3">
                  {plan.items.map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                      <Icons.Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-5">
          <div className="overflow-hidden rounded-[2rem] bg-sky-950 p-8 text-white shadow-2xl shadow-sky-950/20 md:p-12">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100">Nova experiência</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight">Entre para a nova experiência de ensino da UNEZUS</h2>
                <p className="mt-3 max-w-2xl text-sky-50/80">Uma prévia navegável para demonstrar assinatura, recorrência, biblioteca premium e operação administrativa sem depender de programador.</p>
              </div>
              <Link to="/login" className="rounded-full bg-white px-6 py-3 text-center text-sm font-black text-sky-950">
                Entrar na demo
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const enterAs = (role: 'student' | 'admin') => {
    localStorage.setItem(`${storagePrefix}:role`, role)
    navigate(role === 'student' ? '/app' : '/admin')
  }

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_.85fr]">
      <div className="relative hidden overflow-hidden bg-sky-950 p-10 text-white lg:block">
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_22%_18%,rgba(34,211,238,.36),transparent_30%),linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:100%_100%,42px_42px,42px_42px]" />
        <div className="relative flex h-full flex-col justify-between">
          <BrandMark light />
          <div>
            <Badge tone="sky">Demo comercial</Badge>
            <h1 className="mt-5 max-w-xl text-5xl font-black leading-tight tracking-tight">Uma plataforma premium para a escola continuar ensinando todos os meses.</h1>
            <p className="mt-5 max-w-lg text-lg font-medium leading-8 text-sky-50/80">
              Entre como aluno ou administrador e percorra a experiência completa de conteúdo, laudos, casos, calendário e gestão.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard icon="UsersRound" label="Alunos ativos" value="186" dark />
            <MetricCard icon="MonitorPlay" label="Aulas" value="42" dark />
            <MetricCard icon="Trophy" label="Conclusão" value="74%" dark />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-950/8">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Entrar na UNEZUS Academy</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">Use os botões demo para navegar pela prévia.</p>
            <form className="mt-7 space-y-4" onSubmit={(event) => event.preventDefault()}>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">E-mail</span>
                <input className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" defaultValue="joao.mendes@unezusdemo.com" />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Senha</span>
                <input type="password" className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" defaultValue="demo1234" />
              </label>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 font-semibold text-slate-500">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-sky-700" defaultChecked /> Lembrar acesso
                </label>
                <a className="font-bold text-sky-700" href="#recuperar">Esqueci senha</a>
              </div>
              <button type="button" onClick={() => enterAs('student')} className="h-12 w-full rounded-2xl bg-sky-950 font-black text-white shadow-lg shadow-sky-950/20">
                Entrar
              </button>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => enterAs('student')} className="h-12 rounded-2xl border border-sky-200 bg-sky-50 font-black text-sky-800">
                  Entrar como aluno demo
                </button>
                <button type="button" onClick={() => enterAs('admin')} className="h-12 rounded-2xl border border-slate-200 bg-slate-950 font-black text-white">
                  Entrar como administrador demo
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navItems = [
    ['Dashboard', '/app', 'LayoutDashboard'],
    ['Calendário', '/app/calendario', 'CalendarDays'],
    ['Modelos de laudos', '/app/laudos', 'FileText'],
    ['Estudos de caso', '/app/casos', 'FileSearch'],
    ['Ranking', '/app/ranking', 'Trophy'],
    ['Perfil', '/app/perfil', 'UserRound'],
    ['Suporte', '/app/suporte', 'LifeBuoy'],
  ]

  const nav = (
    <>
      {navItems.map(([label, to, icon]) => {
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition',
                isActive ? 'bg-sky-50 text-sky-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
              )
            }
          >
            <IconByName name={icon} className="h-4 w-4" />
            {label}
          </NavLink>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-slate-200 bg-white p-5 lg:block">
        <BrandMark />
        <nav className="mt-8 space-y-1">{nav}</nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-sky-950 p-4 text-white">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Acesso</p>
          <p className="mt-1 text-sm font-bold">Turma presencial + biblioteca premium</p>
        </div>
      </aside>

      <div>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/90 px-4 py-4 backdrop-blur-xl sm:px-5">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <button className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
              <Icons.Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1 md:hidden">
              <BrandMark />
            </div>
            <div className="hidden lg:block">
              <BrandMark compact />
            </div>
            <div className="hidden min-w-0 flex-1 md:block">
              <GlobalSearch />
            </div>
            <button
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 md:hidden"
              onClick={() => setSearchOpen(true)}
              aria-label="Abrir busca"
            >
              <Icons.Search className="h-5 w-5" />
            </button>
            <Link to="/login" className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 md:flex">
              <Icons.LogOut className="h-4 w-4" /> Sair
            </Link>
          </div>
        </header>
        {searchOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/45 md:hidden" onMouseDown={() => setSearchOpen(false)}>
            <div className="rounded-b-[2rem] bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Busca global</p>
                  <p className="text-lg font-black text-slate-950">Encontre aulas, laudos e casos</p>
                </div>
                <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100" onClick={() => setSearchOpen(false)} aria-label="Fechar busca">
                  <Icons.X className="h-5 w-5" />
                </button>
              </div>
              <GlobalSearch prominent onNavigate={() => setSearchOpen(false)} />
              <div className="mt-4 flex flex-wrap gap-2">
                {['BI-RADS', 'endometriose', 'Doppler'].map((item) => (
                  <span key={item} className="rounded-full bg-sky-50 px-3 py-2 text-xs font-black text-sky-800">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        {open && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)}>
            <aside className="h-full w-80 max-w-[85vw] bg-white p-5" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between">
                <BrandMark />
                <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100" onClick={() => setOpen(false)} aria-label="Fechar menu">
                  <Icons.X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-8 space-y-1">{nav}</nav>
            </aside>
          </div>
        )}
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-5 lg:py-8">{children}</main>
        <MobileBottomNav
          items={[
            ['Início', '/app', 'LayoutDashboard'],
            ['Agenda', '/app/calendario', 'CalendarDays'],
            ['Laudos', '/app/laudos', 'FileText'],
            ['Casos', '/app/casos', 'FileSearch'],
            ['Perfil', '/app/perfil', 'UserRound'],
          ]}
        />
      </div>
    </div>
  )
}

function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const navItems = [
    ['Dashboard', '/admin', 'LayoutDashboard'],
    ['Aulas', '/admin/aulas', 'MonitorPlay'],
    ['Especialidades', '/admin/especialidades', 'Library'],
    ['Professores', '/admin/professores', 'GraduationCap'],
    ['Alunos', '/admin/alunos', 'UsersRound'],
    ['Calendário', '/admin/calendario', 'CalendarPlus'],
    ['Laudos', '/admin/laudos', 'FileText'],
    ['Casos', '/admin/casos', 'FileSearch'],
    ['Comentários', '/admin/comentarios', 'MessageCircle'],
    ['Configurações', '/admin/configuracoes', 'Settings'],
  ]

  const nav = (
    <>
      {navItems.map(([label, to, icon]) => {
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition',
                isActive ? 'bg-white text-sky-950' : 'text-sky-100/78 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <IconByName name={icon} className="h-4 w-4" />
            {label}
          </NavLink>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[292px_1fr]">
      <aside className="sticky top-0 hidden h-screen overflow-auto bg-sky-950 p-5 text-white lg:block">
        <BrandMark light />
        <nav className="mt-8 space-y-1">{nav}</nav>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">Operação</p>
          <p className="mt-1 text-sm font-bold">Gestão de conteúdo sem depender de programador</p>
        </div>
      </aside>
      <div>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-5">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <button className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
              <Icons.Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Administrador</p>
              <p className="truncate text-lg font-black text-slate-950">UNEZUS Academy</p>
            </div>
            <Link to="/app" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
              <Icons.Eye className="h-4 w-4" />
              <span className="sm:hidden">Aluno</span>
              <span className="hidden sm:inline">Ver área do aluno</span>
            </Link>
          </div>
        </header>
        {open && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden" onClick={() => setOpen(false)}>
            <aside className="h-full w-80 max-w-[85vw] bg-sky-950 p-5 text-white" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between">
                <BrandMark light />
                <button className="grid h-10 w-10 place-items-center rounded-xl bg-white/10" onClick={() => setOpen(false)} aria-label="Fechar menu">
                  <Icons.X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-8 space-y-1">{nav}</nav>
            </aside>
          </div>
        )}
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-5 lg:py-8">{children}</main>
        <MobileBottomNav
          admin
          items={[
            ['Admin', '/admin', 'LayoutDashboard'],
            ['Aulas', '/admin/aulas', 'MonitorPlay'],
            ['Alunos', '/admin/alunos', 'UsersRound'],
            ['Laudos', '/admin/laudos', 'FileText'],
            ['Config', '/admin/configuracoes', 'Settings'],
          ]}
        />
      </div>
    </div>
  )
}

function LessonRail({ title, lessons }: { title: string; lessons: Lesson[] }) {
  if (lessons.length === 0) return null
  return (
    <section className="mt-9">
      <SectionTitle title={title} />
      <div className="flex gap-4 overflow-x-auto pb-2">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="w-[310px] shrink-0">
            <LessonCard lesson={lesson} compact />
          </div>
        ))}
      </div>
    </section>
  )
}

function StudentDashboard() {
  const { lessons, specialties, students, events, completedLessonIds, reports } = useData()
  const student = students.find((item) => item.id === 'joao-mendes') ?? students[0]
  const [aiQuery, setAiQuery] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const visibleLessons = lessons.filter(isLessonVisibleToStudent)
  const releasedLessons = visibleLessons.filter(isLessonReleased)
  const upcomingLessons = [...visibleLessons].filter(isLessonLocked).sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
  const averageProgress = Math.round(
    releasedLessons.reduce((sum, lesson) => sum + getLessonProgress(lesson, completedLessonIds), 0) / Math.max(releasedLessons.length, 1),
  )

  const askAi = (value = aiQuery) => {
    if (!value.trim()) return
    const q = normalize(value)
    const recommended = visibleLessons
      .filter((lesson) => normalize(`${lesson.title} ${lesson.tags.join(' ')} ${lesson.description}`).includes(q.split(' ')[0] ?? q))
      .slice(0, 3)
    const relatedReports = reports.filter((report) => normalize(`${report.title} ${report.category} ${report.content}`).includes(q.split(' ')[0] ?? q)).slice(0, 2)
    setAiAnswer(
      JSON.stringify({
        summary:
          q.includes('birads') || q.includes('bi-rads')
            ? 'BI-RADS na ultrassonografia depende da combinação entre forma, margem, orientação, ecogenicidade e achados associados. Na prática, a margem costuma ser um dos descritores que mais muda conduta.'
            : q.includes('endometriose')
              ? 'Para endometriose, pense em avaliação compartimental: útero, ovários, compartimento posterior, mobilidade e sinais indiretos de aderência.'
              : q.includes('doppler')
                ? 'Doppler exige técnica antes da interpretação: ângulo adequado, PRF ajustado, ganho sem ruído excessivo e espectro representativo.'
                : 'Resumo prático gerado para revisão rápida, com foco em achados, armadilhas e próximos conteúdos recomendados.',
        lessons: recommended.length ? recommended.map((lesson) => lesson.title) : visibleLessons.slice(0, 3).map((lesson) => lesson.title),
        reports: relatedReports.length ? relatedReports.map((report) => report.title) : reports.slice(0, 2).map((report) => report.title),
      }),
    )
  }

  const parsedAnswer = aiAnswer ? JSON.parse(aiAnswer) as { summary: string; lessons: string[]; reports: string[] } : null

  return (
    <div>
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-[2rem] bg-sky-950 p-6 text-white shadow-2xl shadow-sky-950/16">
          <div className="grid gap-7 md:grid-cols-[1fr_260px]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100">Área do aluno</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Olá, Dr. João</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-sky-50/82">
                Continue suas trilhas de ultrassonografia, revise laudos e acompanhe as próximas liberações da UNEZUS.
              </p>
              <div className="mt-6">
                <GlobalSearch prominent />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-black text-white">Progresso geral</p>
              <p className="mt-3 text-5xl font-black">{Math.max(student.progress, averageProgress)}%</p>
              <ProgressBar value={Math.max(student.progress, averageProgress)} className="mt-4 bg-white/14" />
              <p className="mt-3 text-xs font-bold text-sky-100/82">{student.completedLessons} aulas concluídas · {student.points} pontos</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Próximas liberações" />
          <div className="space-y-3">
            {events.slice(0, 4).map((event) => (
              <div key={event.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sm font-black text-sky-800">
                  {new Date(`${event.date}T12:00:00`).getDate()}
                </span>
                <div>
                  <p className="text-sm font-black text-slate-950">{event.title}</p>
                  <p className="text-xs font-semibold text-slate-500">{event.type} · {formatDate(event.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon="MonitorPlay" label="Em andamento" value={`${releasedLessons.filter((lesson) => getLessonStatus(lesson, completedLessonIds) === 'em andamento').length}`} detail="aulas retomáveis" />
        <MetricCard icon="CalendarDays" label="Próximas liberações" value={`${upcomingLessons.length}`} detail="conteúdos programados" />
        <MetricCard icon="FileText" label="Laudos" value={`${reports.length}`} detail="modelos prontos" />
        <MetricCard icon="Trophy" label="Ranking" value="#3" detail="na comunidade" />
      </section>

      <section className="mt-9 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Liberação gradual da trilha" action={<Badge tone="sky">Assinatura ativa</Badge>} />
          <div className="space-y-3">
            {upcomingLessons.slice(0, 4).map((lesson) => (
              <div key={lesson.id} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[84px_1fr_auto] md:items-center">
                <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Libera</p>
                  <p className="mt-2 text-2xl font-black text-sky-900">{new Date(`${lesson.releaseDate}T12:00:00`).getDate()}</p>
                  <p className="text-xs font-bold text-slate-500">{getMonthShortLabel(lesson.releaseDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">{lesson.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{lesson.module} · {getReleaseLabel(lesson)}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">{getVideoSourceLabel(lesson.videoSource)}</p>
                </div>
                <StatusBadge status="em breve" />
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/14">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100">Experiência contínua</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">A plataforma acompanha a evolução do aluno semana a semana.</h2>
          <div className="mt-6 space-y-3">
            {[
              'Aulas já liberadas continuam disponíveis para revisão.',
              'Novos módulos entram automaticamente por data.',
              'Cada liberação alimenta ranking, certificados e biblioteca prática.',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/8 p-3 text-sm font-semibold text-sky-50/85">
                <Icons.CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-100" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-9 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-sky-700">Assistente de Estudos IA</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Revise temas com recomendações conectadas ao acervo.</h2>
            <div className="mt-5 flex gap-2">
              <input
                value={aiQuery}
                onChange={(event) => setAiQuery(event.target.value)}
                placeholder="Digite um tema para revisar"
                className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
              <button onClick={() => askAi()} className="rounded-2xl bg-sky-950 px-5 font-black text-white">
                Revisar
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Explique BI-RADS de forma prática', 'Quais achados sugerem endometriose?', 'Resumo de Doppler obstétrico'].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setAiQuery(example)
                    askAi(example)
                  }}
                  className="rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            {parsedAnswer ? (
              <div>
                <p className="text-sm font-black text-slate-950">Resposta simulada</p>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{parsedAnswer.summary}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Aulas recomendadas</p>
                    <ul className="mt-2 space-y-2 text-sm font-bold text-slate-700">
                      {parsedAnswer.lessons.map((lesson) => <li key={lesson}>• {lesson}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Laudos relacionados</p>
                    <ul className="mt-2 space-y-2 text-sm font-bold text-slate-700">
                      {parsedAnswer.reports.map((report) => <li key={report}>• {report}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-44 items-center justify-center text-center">
                <div>
                  <Icons.Sparkles className="mx-auto h-8 w-8 text-sky-700" />
                  <p className="mt-3 text-sm font-bold text-slate-500">Digite um tema para ver resumo, aulas e laudos recomendados.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <LessonRail title="Continue assistindo" lessons={releasedLessons.filter((lesson) => getLessonProgress(lesson, completedLessonIds) > 0 && getLessonProgress(lesson, completedLessonIds) < 100)} />
      <LessonRail title="Novas aulas liberadas" lessons={releasedLessons.filter((lesson) => lesson.status === 'novo')} />
      <LessonRail title="Mais assistidas" lessons={[...releasedLessons].sort((a, b) => b.views - a.views).slice(0, 8)} />

      {specialties.map((specialty) => (
        <LessonRail key={specialty.id} title={specialty.name} lessons={visibleLessons.filter((lesson) => lesson.specialtySlug === specialty.slug)} />
      ))}

      <section className="mt-9">
        <SectionTitle title="Certificados e trilhas concluídas" action={<Badge tone="emerald">Emissão premium</Badge>} />
        <CertificatesShowcase />
      </section>
    </div>
  )
}

function SpecialtyPage() {
  const { slug } = useParams()
  const { lessons, specialties, teachers, completedLessonIds } = useData()
  const specialty = specialties.find((item) => item.slug === slug)
  const [filter, setFilter] = useState('todas')

  if (!specialty) return <Navigate to="/app" replace />

  const specialtyLessons = lessons.filter((lesson) => lesson.specialtySlug === specialty.slug && isLessonVisibleToStudent(lesson))
  const filteredLessons = specialtyLessons.filter((lesson) => {
    const status = getLessonStatus(lesson, completedLessonIds)
    if (filter === 'todas') return true
    if (filter === 'com PDF') return lesson.materials.some((material) => material.type.includes('PDF') || material.type.includes('Modelo'))
    if (filter === 'estudos de caso') return lesson.tags.some((tag) => normalize(tag).includes('caso'))
    return status === filter
  })
  const modules = Array.from(new Set(specialtyLessons.map((lesson) => lesson.module)))

  return (
    <div>
      <section className="overflow-hidden rounded-[2rem] bg-sky-950 text-white shadow-2xl shadow-sky-950/16">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_320px]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100">Especialidade</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{specialty.name}</h1>
            <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-sky-50/82">{specialty.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge tone="sky">{specialtyLessons.length} aulas</Badge>
              <Badge tone="sky">{modules.length} módulos</Badge>
              <Badge tone="sky">{specialty.teacherIds.length} professores</Badge>
            </div>
          </div>
          <MedicalThumb tone={specialty.slug.includes('mama') ? 'mama' : specialty.slug.includes('doppler') ? 'doppler' : 'gineco'} label={specialty.name} />
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-slate-950">Professores envolvidos</p>
            <div className="mt-4 space-y-3">
              {specialty.teacherIds.map((id) => {
                const teacher = getTeacher(id, teachers)
                return (
                  <div key={id} className="flex items-center gap-3">
                    <TeacherAvatar teacher={teacher} size="sm" />
                    <div>
                      <p className="text-sm font-black text-slate-950">{teacher.name}</p>
                      <p className="text-xs font-semibold text-slate-500">{teacher.title}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-slate-950">Cronograma da trilha</p>
            <div className="mt-4 space-y-3">
              {[...specialtyLessons].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate)).slice(0, 5).map((lesson) => (
                <div key={lesson.id} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{lesson.title}</p>
                    <StatusBadge status={getLessonStatus(lesson, completedLessonIds)} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{lesson.module}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-700">{getReleaseLabel(lesson)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black text-slate-950">Trilhas e módulos</p>
            <div className="mt-4 space-y-2">
              {modules.map((module) => (
                <div key={module} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">{module}</div>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap gap-2">
            {['todas', 'novo', 'concluido', 'em breve', 'com PDF', 'estudos de caso'].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={clsx('rounded-full px-4 py-2 text-sm font-black', filter === item ? 'bg-sky-950 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200')}
              >
                {item === 'novo' ? 'novas' : item === 'concluido' ? 'concluídas' : item}
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)}
          </div>
        </div>
      </section>
    </div>
  )
}

function LessonPage() {
  const { id } = useParams()
  const { lessons, setLessons, certificates, setCertificates, teachers, specialties, reports, comments, setComments, completedLessonIds, setCompletedLessonIds } = useData()
  const lesson = lessons.find((item) => item.id === id)
  const [message, setMessage] = useState('')

  if (!lesson || !isLessonVisibleToStudent(lesson)) return <Navigate to="/app" replace />

  const teacher = getTeacher(lesson.teacherId, teachers)
  const specialty = getSpecialty(lesson.specialtySlug, specialties)
  const related = lessons.filter((item) => item.specialtySlug === lesson.specialtySlug && item.id !== lesson.id && isLessonVisibleToStudent(item)).slice(0, 4)
  const lessonComments = comments.filter((comment) => comment.lessonId === lesson.id)
  const progress = getLessonProgress(lesson, completedLessonIds)
  const status = getLessonStatus(lesson, completedLessonIds)
  const locked = isLessonLocked(lesson)

  const completeLesson = () => {
    if (locked) return
    setCompletedLessonIds((ids) => (ids.includes(lesson.id) ? ids : [...ids, lesson.id]))
    setLessons((current) => current.map((item) => (item.id === lesson.id ? { ...item, status: 'concluido', progress: 100 } : item)))
    if (certificates.some((certificate) => certificate.specialtySlug === lesson.specialtySlug)) {
      setCertificates((current) =>
        current.map((certificate) => {
          if (certificate.specialtySlug !== lesson.specialtySlug) return certificate
          const nextProgress = Math.min(100, certificate.progress + 12)
          return {
            ...certificate,
            progress: nextProgress,
            status: nextProgress >= 100 ? 'disponível' : 'em andamento',
            issueDate: nextProgress >= 100 ? certificate.issueDate ?? getTodayKey() : certificate.issueDate,
          }
        }),
      )
    }
  }

  const sendComment = (event: FormEvent) => {
    event.preventDefault()
    if (!message.trim()) return
    setComments((current) => [
      ...current,
      {
        id: `comment-${Date.now()}`,
        lessonId: lesson.id,
        author: 'Dr. João Mendes',
        role: 'aluno',
        status: 'pendente',
        date: 'agora',
        message,
      },
    ])
    setMessage('')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-2xl shadow-sky-950/16">
          {locked ? (
            <div className="flex aspect-video flex-col justify-between bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,.18),transparent_22%),linear-gradient(135deg,#020617_0%,#082f49_62%,#0f172a_100%)] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 ring-1 ring-white/15">
                  <Icons.Lock className="h-4 w-4" />
                  Conteúdo agendado
                </span>
                <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15">
                  {getVideoSourceLabel(lesson.videoSource)}
                </span>
              </div>
              <div className="max-w-2xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100">Liberação gradual</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight">{getReleaseLabel(lesson)}</h2>
                <p className="mt-4 text-sm leading-6 text-sky-50/82">
                  A aula já está preparada no painel da UNEZUS, mas aparece para o aluno apenas na data programada. Isso ajuda a manter recorrência, cronograma e percepção de continuidade.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoLine label="Data de liberação" value={formatDate(lesson.releaseDate)} />
                <InfoLine label="Módulo" value={lesson.module} />
                <InfoLine label="Duração" value={lesson.duration} />
              </div>
            </div>
          ) : (
            <LessonVideoPlayer lesson={lesson} progress={progress} />
          )}
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="sky">{specialty.name}</Badge>
                <StatusBadge status={status} />
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{lesson.title}</h1>
              <p className="mt-3 text-sm font-semibold text-slate-500">{teacher.name} · {lesson.duration} · {lesson.module}</p>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">{lesson.description}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 md:min-w-56 md:grid-cols-1">
              <button onClick={completeLesson} disabled={locked} className={clsx('rounded-2xl px-5 py-3 text-sm font-black', locked ? 'cursor-not-allowed bg-slate-200 text-slate-500' : 'bg-sky-950 text-white')}>
                {locked ? 'Aguardando liberação' : 'Marcar como concluída'}
              </button>
              <button disabled={locked} className={clsx('rounded-2xl border px-5 py-3 text-sm font-black', locked ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 text-slate-700')}>
                {locked ? 'Material libera junto' : 'Baixar material'}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle title="O que você vai aprender" />
            <div className="space-y-3">
              {lesson.learning.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                  <Icons.CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle title="Materiais" />
            <div className="space-y-3">
              {lesson.materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700">
                      <Icons.FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-slate-950">{material.title}</p>
                      <p className="text-xs font-semibold text-slate-500">{material.type}</p>
                    </div>
                  </div>
                  <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600" title="Baixar">
                    <Icons.Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle title={locked ? 'Comentários e aquecimento da turma' : 'Comentários e dúvidas'} />
          <div className="space-y-4">
            {lessonComments.map((comment) => (
              <div key={comment.id} className={clsx('rounded-2xl p-4', comment.role === 'professor' ? 'bg-sky-50' : 'bg-slate-50')}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{comment.author}</p>
                  <div className="flex items-center gap-2">
                    <Badge tone={comment.role === 'professor' ? 'sky' : 'slate'}>{comment.role}</Badge>
                    <span className="text-xs font-bold text-slate-400">{comment.date}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{comment.message}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendComment} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={locked ? 'Deixe uma dúvida para entrar na aula com contexto' : 'Envie sua dúvida para o professor'}
              className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
            <button className="rounded-2xl bg-sky-950 px-5 font-black text-white">Enviar dúvida</button>
          </form>
        </section>
        {locked && (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle title="Como esta aula será liberada" />
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['1. Aula cadastrada', 'Vídeo, materiais e professor já estão prontos no admin.'],
                ['2. Data programada', `A abertura acontece em ${formatDate(lesson.releaseDate)} de forma automática.`],
                ['3. Certificado alimentado', 'A conclusão desta aula conta para progresso, ranking e certificado do módulo.'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-5">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <TeacherAvatar teacher={teacher} size="lg" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">Professor</p>
              <h2 className="mt-1 text-lg font-black leading-tight text-slate-950">{teacher.name}</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">{teacher.title}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{teacher.bio}</p>
          {teacher.credentials && (
            <div className="mt-4 space-y-2">
              {teacher.credentials.slice(0, 3).map((credential) => (
                <div key={credential} className="flex gap-2 text-xs font-bold leading-5 text-slate-600">
                  <Icons.CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {credential}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Aulas relacionadas" />
          <div className="space-y-4">
            {related.map((item) => <LessonCard key={item.id} lesson={item} compact />)}
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Laudos conectados" />
          <div className="space-y-3">
            {reports.slice(0, 3).map((report) => (
              <Link key={report.id} to="/app/laudos" className="block rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-black text-slate-950">{report.title}</p>
                <p className="text-xs font-semibold text-slate-500">{report.category}</p>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

function CalendarPage() {
  const { events, teachers } = useData()
  const [filter, setFilter] = useState<CalendarEvent['type'] | 'Todos'>('Todos')
  const [selected, setSelected] = useState<CalendarEvent | null>(null)
  const filteredEvents = filter === 'Todos' ? events : events.filter((event) => event.type === filter)
  const days = Array.from({ length: 31 }, (_, index) => index + 1)
  const firstDay = new Date('2026-05-01T12:00:00').getDay()

  return (
    <div>
      <SectionTitle title="Calendário de conteúdos" />
      <div className="mb-5 flex flex-wrap gap-2">
        {(['Todos', ...eventTypes] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={clsx('rounded-full px-4 py-2 text-sm font-black', filter === type ? 'bg-sky-950 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200')}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="grid gap-3 md:hidden">
        {filteredEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => setSelected(event)}
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
          >
            <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-sky-50 text-center font-black text-sky-800">
              <span className="text-sm">{new Date(`${event.date}T12:00:00`).getDate()}</span>
              <span className="text-[10px] uppercase text-sky-600">mai</span>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-slate-950">{event.title}</span>
              <span className="mt-1 block text-xs font-bold text-slate-500">{event.type} · {formatDate(event.date)}</span>
              <span className="mt-2 block text-xs leading-5 text-slate-500">{event.description}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm md:block">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <div key={day} className="p-3">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} className="min-h-32 border-b border-r border-slate-100 bg-slate-50/50" />)}
          {days.map((day) => {
            const date = `2026-05-${String(day).padStart(2, '0')}`
            const dayEvents = filteredEvents.filter((event) => event.date === date)
            return (
              <div key={day} className="min-h-32 border-b border-r border-slate-100 p-2">
                <span className="text-sm font-black text-slate-500">{day}</span>
                <div className="mt-2 space-y-1.5">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelected(event)}
                      className="block w-full rounded-lg bg-sky-50 px-2 py-1.5 text-left text-[11px] font-black leading-tight text-sky-800"
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)} title={selected.title}>
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">{selected.description}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoLine label="Data" value={formatDate(selected.date)} />
              <InfoLine label="Tipo" value={selected.type} />
              <InfoLine label="Professor" value={selected.teacherId ? getTeacher(selected.teacherId, teachers).name : 'Equipe UNEZUS'} />
            </div>
            <Link to={selected.lessonId ? `/app/aulas/${selected.lessonId}` : '/app'} className="inline-flex rounded-2xl bg-sky-950 px-5 py-3 text-sm font-black text-white">
              Ver aula
            </Link>
          </div>
        </Modal>
      )}
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-slate-950">{value}</p>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 p-0 sm:place-items-center sm:p-4" onMouseDown={onClose}>
      <div className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-t-[2rem] bg-white p-6 shadow-2xl sm:rounded-[2rem]" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">{title}</h2>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100">
            <Icons.X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ReportsPage() {
  const { reports } = useData()
  const [category, setCategory] = useState('Todos')
  const [selected, setSelected] = useState<ReportTemplate | null>(null)
  const [copied, setCopied] = useState('')
  const filtered = category === 'Todos' ? reports : reports.filter((report) => report.category === category)

  const copyReport = async (report: ReportTemplate) => {
    await navigator.clipboard?.writeText(report.content)
    setCopied(report.id)
    setTimeout(() => setCopied(''), 1600)
  }

  return (
    <div>
      <SectionTitle title="Biblioteca de modelos de laudos" />
      <div className="mb-5 flex flex-wrap gap-2">
        {['Todos', ...reportCategories].map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={clsx('rounded-full px-4 py-2 text-sm font-black', category === item ? 'bg-sky-950 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200')}>
            {item}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((report) => (
          <div key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Badge tone="sky">{report.category}</Badge>
            <h3 className="mt-4 text-lg font-black text-slate-950">{report.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{report.description}</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <button onClick={() => setSelected(report)} className="rounded-xl bg-sky-950 py-2 text-xs font-black text-white">Visualizar</button>
              <button onClick={() => copyReport(report)} className="rounded-xl border border-slate-200 py-2 text-xs font-black text-slate-700">{copied === report.id ? 'Copiado' : 'Copiar'}</button>
              <button className="rounded-xl border border-slate-200 py-2 text-xs font-black text-slate-700">PDF fake</button>
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)}>
          <Badge tone="sky">{selected.category}</Badge>
          <div className="mt-4 whitespace-pre-line rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">{selected.content}</div>
          <div className="mt-5 flex gap-2">
            <button onClick={() => copyReport(selected)} className="rounded-2xl bg-sky-950 px-5 py-3 text-sm font-black text-white">Copiar texto</button>
            <button className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">Baixar PDF fake</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function CasesPage() {
  const { cases, specialties } = useData()
  const [level, setLevel] = useState('Todos')
  const filtered = level === 'Todos' ? cases : cases.filter((caseStudy) => caseStudy.level === level)
  return (
    <div>
      <SectionTitle title="Estudos de caso" />
      <div className="mb-5 flex flex-wrap gap-2">
        {['Todos', 'básico', 'intermediário', 'avançado'].map((item) => (
          <button key={item} onClick={() => setLevel(item)} className={clsx('rounded-full px-4 py-2 text-sm font-black', level === item ? 'bg-sky-950 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200')}>
            {item}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((caseStudy) => (
          <div key={caseStudy.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-44"><MedicalThumb tone={caseStudy.thumbnail} label={getSpecialty(caseStudy.specialtySlug, specialties).name} /></div>
            <div className="p-5">
              <div className="flex gap-2">
                <Badge tone="sky">{getSpecialty(caseStudy.specialtySlug, specialties).name}</Badge>
                <Badge tone={caseStudy.level === 'avançado' ? 'amber' : 'slate'}>{caseStudy.level}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950">{caseStudy.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{caseStudy.description}</p>
              <Link to={`/app/casos/${caseStudy.slug}`} className="mt-5 inline-flex rounded-2xl bg-sky-950 px-5 py-3 text-sm font-black text-white">
                Ver caso
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CaseDetailPage() {
  const { slug } = useParams()
  const { cases, specialties, comments } = useData()
  const [studied, setStudied] = useLocalStorageState<string[]>('studied-cases', [])
  const caseStudy = cases.find((item) => item.slug === slug)
  if (!caseStudy) return <Navigate to="/app/casos" replace />
  const specialty = getSpecialty(caseStudy.specialtySlug, specialties)
  const isStudied = studied.includes(caseStudy.id)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="h-72"><MedicalThumb tone={caseStudy.thumbnail} label={specialty.name} /></div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              <Badge tone="sky">{specialty.name}</Badge>
              <Badge tone={caseStudy.level === 'avançado' ? 'amber' : 'slate'}>{caseStudy.level}</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">{caseStudy.title}</h1>
            <p className="mt-3 text-slate-600">{caseStudy.description}</p>
          </div>
        </section>
        {[
          ['História clínica', caseStudy.history],
          ['Achados ultrassonográficos', caseStudy.findings],
          ['Hipótese diagnóstica', caseStudy.hypothesis],
          ['Conduta e discussão', caseStudy.discussion],
        ].map(([title, content]) => (
          <section key={title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{content}</p>
          </section>
        ))}
      </div>
      <aside className="space-y-5">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <button
            onClick={() => setStudied((current) => (current.includes(caseStudy.id) ? current : [...current, caseStudy.id]))}
            className="w-full rounded-2xl bg-sky-950 px-5 py-3 text-sm font-black text-white"
          >
            {isStudied ? 'Caso estudado' : 'Marcar como estudado'}
          </button>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle title="Comentários" />
          {comments.slice(0, 3).map((comment) => (
            <div key={comment.id} className="mb-3 rounded-2xl bg-slate-50 p-3">
              <p className="text-sm font-black text-slate-950">{comment.author}</p>
              <p className="mt-1 text-sm leading-5 text-slate-600">{comment.message}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

function RankingPage() {
  const { students } = useData()
  const ranked = [...students].sort((a, b) => b.points - a.points)
  return (
    <div>
      <SectionTitle title="Ranking e gamificação" />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            {ranked.map((student, index) => (
              <div key={student.id} className="grid items-center gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-[56px_1fr_auto]">
                <span className={clsx('grid h-12 w-12 place-items-center rounded-2xl font-black', index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-700')}>
                  #{index + 1}
                </span>
                <div>
                  <p className="font-black text-slate-950">{student.name}</p>
                  <p className="text-sm font-semibold text-slate-500">{student.completedLessons} aulas concluídas · {student.comments} comentários</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {student.badges.map((badge) => <Badge key={badge} tone="sky">{badge}</Badge>)}
                  </div>
                </div>
                <p className="text-xl font-black text-sky-800">{student.points.toLocaleString('pt-BR')} pontos</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] bg-sky-950 p-6 text-white shadow-2xl shadow-sky-950/16">
          <Icons.Trophy className="h-10 w-10 text-cyan-100" />
          <h2 className="mt-4 text-2xl font-black">Pontos de engajamento</h2>
          <div className="mt-5 space-y-3 text-sm font-bold text-sky-50/85">
            <p>+30 por aula concluída</p>
            <p>+15 por comentário útil</p>
            <p>+50 por estudo de caso finalizado</p>
            <p>+120 por módulo certificado</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfilePage() {
  const { students, specialties, lessons, completedLessonIds, certificates } = useData()
  const student = students.find((item) => item.id === 'joao-mendes') ?? students[0]
  const availableCertificates = certificates.filter((certificate) => certificate.status === 'disponível')
  return (
    <div>
      <SectionTitle title="Perfil do aluno" />
      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <span className="mx-auto grid h-24 w-24 place-items-center rounded-[2rem] bg-sky-950 text-2xl font-black text-white">JM</span>
          <h1 className="mt-4 text-2xl font-black text-slate-950">{student.name}</h1>
          <p className="text-sm font-semibold text-slate-500">{student.email}</p>
          <p className="mt-3 text-sm font-bold text-sky-700">{student.interest}</p>
          <button className="mt-6 w-full rounded-2xl bg-sky-950 px-5 py-3 text-sm font-black text-white">Editar perfil</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard icon="CheckCircle2" label="Aulas concluídas" value={`${Math.max(student.completedLessons, completedLessonIds.length)}`} />
          <MetricCard icon="Award" label="Certificados" value={`${certificates.length}`} detail={`${availableCertificates.length} disponíveis agora`} />
          <MetricCard icon="Clock3" label="Último acesso" value={student.lastAccess} />
          <MetricCard icon="WalletCards" label="Plano" value={student.plan} />
        </div>
      </section>
      <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <SectionTitle title="Biblioteca de certificados" action={<Badge tone="emerald">Baixar na hora</Badge>} />
        <CertificatesShowcase compact />
      </section>
      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle title="Progresso por área" />
          <div className="space-y-4">
            {specialties.slice(0, 6).map((specialty, index) => {
              const value = Math.min(100, Math.round((lessons.filter((lesson) => lesson.specialtySlug === specialty.slug && getLessonProgress(lesson, completedLessonIds) > 0).length / Math.max(lessons.filter((lesson) => lesson.specialtySlug === specialty.slug).length, 1)) * 100) + index * 4)
              return (
                <div key={specialty.id}>
                  <div className="mb-2 flex justify-between text-sm font-bold">
                    <span className="text-slate-700">{specialty.name}</span>
                    <span className="text-slate-400">{value}%</span>
                  </div>
                  <ProgressBar value={value} />
                </div>
              )
            })}
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle title="Histórico de acesso" />
          {['Assistiu BI-RADS na Ultrassonografia Mamária', 'Baixou modelo de laudo tireoidiano', 'Comentou em Fundamentos do Doppler', 'Concluiu Morfológico do Primeiro Trimestre'].map((item, index) => (
            <div key={item} className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-50 text-xs font-black text-sky-800">{index + 1}</span>
              <p className="text-sm font-semibold text-slate-600">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SupportPage() {
  const [tickets, setTickets] = useState(supportTickets)
  const [form, setForm] = useState({ subject: '', category: 'Acesso', message: '' })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.subject || !form.message) return
    setTickets((current) => [
      { id: `ticket-${Date.now()}`, subject: form.subject, category: form.category, status: 'aberto', date: 'hoje', message: form.message },
      ...current,
    ])
    setForm({ subject: '', category: 'Acesso', message: '' })
  }
  return (
    <div>
      <SectionTitle title="Suporte" />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Abrir chamado</h2>
          <div className="mt-5 grid gap-4">
            <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Assunto" className="h-12 rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="h-12 rounded-2xl border border-slate-200 px-4 font-semibold outline-none">
              {['Acesso', 'Materiais', 'Certificados', 'Pagamento fake', 'Comunidade'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Mensagem" rows={6} className="rounded-2xl border border-slate-200 p-4 font-semibold outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100" />
            <button className="h-12 rounded-2xl bg-sky-950 font-black text-white">Enviar chamado</button>
          </div>
        </form>
        <aside className="space-y-5">
          <div className="rounded-[2rem] bg-emerald-600 p-6 text-white shadow-lg shadow-emerald-900/15">
            <Icons.MessageCircle className="h-8 w-8" />
            <p className="mt-4 text-lg font-black">WhatsApp suporte</p>
            <p className="mt-1 text-sm font-bold text-emerald-50">+55 85 90000-0000</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle title="Histórico" />
            {tickets.map((ticket) => (
              <div key={ticket.id} className="mb-3 rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">{ticket.subject}</p>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">{ticket.category} · {ticket.date}</p>
                <p className="mt-2 text-sm text-slate-600">{ticket.message}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const { lessons, specialties, teachers, students, comments, reports } = useData()
  const mostWatched = [...lessons].sort((a, b) => b.views - a.views).slice(0, 5)
  return (
    <div>
      <SectionTitle title="Dashboard administrativo" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon="UsersRound" label="Total de alunos" value="214" detail={`${students.filter((student) => student.status === 'ativo').length + 181} ativos`} />
        <MetricCard icon="MonitorPlay" label="Aulas cadastradas" value={`${lessons.length + 30}`} detail={`${lessons.filter((lesson) => lesson.adminStatus === 'publicada').length} publicadas na demo`} />
        <MetricCard icon="GraduationCap" label="Professores" value={`${teachers.length + 6}`} detail="especialistas vinculados" />
        <MetricCard icon="Library" label="Especialidades" value={`${specialties.length}`} detail="cursos ativos" />
        <MetricCard icon="MessageCircle" label="Comentários pendentes" value={`${comments.filter((comment) => comment.status === 'pendente').length}`} detail="aguardando resposta" />
        <MetricCard icon="FileText" label="Materiais" value={`${reports.length + 34}`} detail="PDFs, laudos e checklists" />
        <MetricCard icon="WalletCards" label="Faturamento estimado" value="R$ 72.400" detail="recorrência mensal fake" />
        <MetricCard icon="CheckCircle2" label="Taxa média" value="74%" detail="conclusão dos módulos" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_390px]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle title="Aulas mais assistidas" />
          <div className="space-y-3">
            {mostWatched.map((lesson, index) => (
              <div key={lesson.id} className="grid items-center gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-[42px_1fr_auto]">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white font-black text-slate-700">{index + 1}</span>
                <div>
                  <p className="font-black text-slate-950">{lesson.title}</p>
                  <p className="text-sm font-semibold text-slate-500">{lesson.views.toLocaleString('pt-BR')} visualizações</p>
                </div>
                <StatusBadge status={lesson.adminStatus} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-sky-950 p-6 text-white shadow-2xl shadow-sky-950/16">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100">IA e recomendações</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight">Aceleradores para operação de conteúdo</h2>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/12">
                  <Icons.Upload className="h-5 w-5 text-cyan-100" />
                </span>
                <div>
                  <p className="text-sm font-black text-white">Publicação rápida de aulas</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-sky-100/82">
                    Cole um link do YouTube ou envie vídeo direto, defina a data e deixe a trilha pronta sem suporte técnico.
                  </p>
                </div>
              </div>
              <Link to="/admin/aulas" className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-black text-sky-950">
                Abrir gerenciador de aulas
              </Link>
            </div>
            {adminAiActions.map((action) => (
              <button key={action} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-left text-sm font-bold text-white transition hover:bg-white/14">
                {action}
                <Icons.Sparkles className="h-4 w-4 text-cyan-100" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

const inputClass = 'h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100'
const textareaClass = 'w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100'

function AdminLessonsPage() {
  const { lessons, setLessons, teachers, specialties } = useData()
  const [editingId, setEditingId] = useState('')
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    teacherId: teachers[0]?.id ?? '',
    specialtySlug: specialties[0]?.slug ?? '',
    module: '',
    duration: '',
    adminStatus: 'rascunho' as AdminStatus,
    releaseDate: addDaysToDateKey(7),
    videoSource: 'youtube' as VideoSource,
    videoUrl: '',
    videoAssetId: '',
    videoAssetName: '',
    thumbnail: 'doppler',
    materials: 'Mapa mental, PDF complementar',
  })

  const resetForm = () => {
    setEditingId('')
    setSelectedVideoFile(null)
    setForm({
      title: '',
      description: '',
      teacherId: teachers[0]?.id ?? '',
      specialtySlug: specialties[0]?.slug ?? '',
      module: '',
      duration: '',
      adminStatus: 'rascunho',
      releaseDate: addDaysToDateKey(7),
      videoSource: 'youtube',
      videoUrl: '',
      videoAssetId: '',
      videoAssetName: '',
      thumbnail: 'doppler',
      materials: 'Mapa mental, PDF complementar',
    })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFeedback('')
    const previousLesson = editingId ? lessons.find((lesson) => lesson.id === editingId) : undefined
    let nextVideoAssetId = form.videoAssetId
    let nextVideoAssetName = form.videoAssetName

    if (form.videoSource === 'youtube' && !form.videoUrl.trim()) {
      setFeedback('Cole o link do YouTube para publicar a aula nesse modo.')
      return
    }

    if (form.videoSource === 'upload') {
      if (selectedVideoFile) {
        try {
          nextVideoAssetId = nextVideoAssetId || makeId('video', `${form.title}-${Date.now()}`)
          await saveLessonVideoAsset(nextVideoAssetId, selectedVideoFile)
          nextVideoAssetName = selectedVideoFile.name
        } catch {
          setFeedback('O vídeo direto não pôde ser salvo nesta máquina. Para a demo, use um arquivo menor ou publique por YouTube.')
          return
        }
      }
      if (!nextVideoAssetId) {
        setFeedback('Selecione um arquivo de vídeo para o upload direto ou troque para o modo YouTube.')
        return
      }
    }

    if (previousLesson?.videoSource === 'upload' && previousLesson.videoAssetId && form.videoSource !== 'upload') {
      await deleteLessonVideoAsset(previousLesson.videoAssetId)
    }

    const derivedStatus: LessonStatus =
      form.adminStatus === 'publicada'
        ? form.releaseDate > getTodayKey()
          ? 'em breve'
          : previousLesson?.status === 'em andamento' || previousLesson?.status === 'concluido'
            ? previousLesson.status
            : 'novo'
        : 'em breve'

    const payload: Lesson = {
      id: editingId || makeId('aula', form.title),
      slug: makeId('', form.title).replace(/^-/, ''),
      title: form.title,
      description: form.description,
      teacherId: form.teacherId,
      specialtySlug: form.specialtySlug,
      module: form.module,
      duration: form.duration,
      status: derivedStatus,
      adminStatus: form.adminStatus,
      releaseDate: form.releaseDate,
      progress: previousLesson?.progress ?? 0,
      views: previousLesson?.views ?? 0,
      tags: [getSpecialty(form.specialtySlug, specialties).name, form.module],
      thumbnail: form.thumbnail,
      videoSource: form.videoSource,
      videoUrl: form.videoSource === 'youtube' ? form.videoUrl : '',
      videoAssetId: form.videoSource === 'upload' ? nextVideoAssetId : undefined,
      videoAssetName: form.videoSource === 'upload' ? nextVideoAssetName : undefined,
      materials: form.materials.split(',').map((title, index) => ({
        id: `material-${Date.now()}-${index}`,
        title: title.trim(),
        type: title.toLowerCase().includes('laudo') ? 'Modelo de laudo' : title.toLowerCase().includes('check') ? 'Checklist prático' : 'PDF complementar',
      })),
      learning: ['Objetivo prático da aula', 'Principais achados e armadilhas', 'Aplicação no laudo e na conduta'],
    }
    setLessons((current) => (editingId ? current.map((lesson) => (lesson.id === editingId ? payload : lesson)) : [payload, ...current]))
    setFeedback(
      form.videoSource === 'upload'
        ? 'Aula salva com vídeo direto neste navegador para a demo local.'
        : 'Aula salva com link do YouTube e pronta para entrar na trilha.',
    )
    resetForm()
  }

  const editLesson = (lesson: Lesson) => {
    setEditingId(lesson.id)
    setSelectedVideoFile(null)
    setForm({
      title: lesson.title,
      description: lesson.description,
      teacherId: lesson.teacherId,
      specialtySlug: lesson.specialtySlug,
      module: lesson.module,
      duration: lesson.duration,
      adminStatus: lesson.adminStatus,
      releaseDate: lesson.releaseDate,
      videoSource: lesson.videoSource === 'upload' ? 'upload' : 'youtube',
      videoUrl: lesson.videoUrl ?? '',
      videoAssetId: lesson.videoAssetId ?? '',
      videoAssetName: lesson.videoAssetName ?? '',
      thumbnail: lesson.thumbnail,
      materials: lesson.materials.map((material) => material.title).join(', '),
    })
  }

  return (
    <div>
      <SectionTitle title="Gerenciar aulas" />
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">{editingId ? 'Editar aula' : 'Criar aula'}</h2>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">Fluxo de publicação</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Escolha entre YouTube e upload direto, defina professor e data, depois publique hoje ou programe a liberação.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setForm((current) => ({ ...current, adminStatus: 'publicada', releaseDate: getTodayKey() }))} className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-black text-sky-800">
                Publicar hoje
              </button>
              <button type="button" onClick={() => setForm((current) => ({ ...current, adminStatus: 'publicada', releaseDate: addDaysToDateKey(7) }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                Agendar próxima liberação
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-4">
            <Field label="Título da aula"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></Field>
            <Field label="Descrição"><textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaClass} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Professor"><select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className={inputClass}>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></Field>
              <Field label="Especialidade"><select value={form.specialtySlug} onChange={(e) => setForm({ ...form, specialtySlug: e.target.value })} className={inputClass}>{specialties.map((specialty) => <option key={specialty.id} value={specialty.slug}>{specialty.name}</option>)}</select></Field>
              <Field label="Módulo"><input value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} className={inputClass} /></Field>
              <Field label="Duração"><input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className={inputClass} /></Field>
              <Field label="Status"><select value={form.adminStatus} onChange={(e) => setForm({ ...form, adminStatus: e.target.value as AdminStatus })} className={inputClass}><option value="publicada">Publicada</option><option value="rascunho">Rascunho</option><option value="em breve">Em breve</option></select></Field>
              <Field label="Data de liberação"><input type="date" value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })} className={inputClass} /></Field>
            </div>
            <Field label="Origem do vídeo">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                {([
                  ['youtube', 'YouTube'],
                  ['upload', 'Upload direto'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, videoSource: value }))}
                    className={clsx('rounded-[1rem] px-4 py-3 text-sm font-black transition', form.videoSource === value ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-500')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            {form.videoSource === 'youtube' ? (
              <Field label="Link do vídeo">
                <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className={inputClass} placeholder="https://www.youtube.com/watch?v=..." />
              </Field>
            ) : (
              <Field label="Vídeo direto">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <input
                    type="file"
                    accept="video/*"
                    className={inputClass}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      setSelectedVideoFile(file)
                      setForm((current) => ({ ...current, videoAssetName: file?.name ?? current.videoAssetName }))
                    }}
                  />
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                    Demo local: o vídeo fica salvo neste navegador para apresentação do fluxo de upload direto.
                  </p>
                  {(selectedVideoFile || form.videoAssetName) && (
                    <div className="mt-3 rounded-2xl bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Arquivo selecionado</p>
                      <p className="mt-1 text-sm font-black text-slate-950">{selectedVideoFile?.name ?? form.videoAssetName}</p>
                    </div>
                  )}
                </div>
              </Field>
            )}
            <Field label="Thumbnail"><select value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} className={inputClass}>{['doppler', 'vascular', 'mama', 'gineco', 'obstetrico', 'tireoide', 'abdome', 'pocus', 'partes'].map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Materiais anexos fake"><input type="file" className={inputClass} /></Field>
            <Field label="Materiais listados"><input value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} className={inputClass} /></Field>
            {feedback && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{feedback}</div>}
            <button className="h-12 rounded-2xl bg-sky-950 font-black text-white">{editingId ? 'Salvar edição' : 'Criar aula'}</button>
          </div>
        </form>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2"><StatusBadge status={lesson.adminStatus} />{lesson.featured && <Badge tone="amber">Destaque</Badge>}</div>
                    <h3 className="mt-3 font-black text-slate-950">{lesson.title}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{getTeacher(lesson.teacherId, teachers).name} · {getSpecialty(lesson.specialtySlug, specialties).name}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1">{getVideoSourceLabel(lesson.videoSource)}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">{formatDate(lesson.releaseDate)}</span>
                      {lesson.videoSource === 'upload' && lesson.videoAssetName && <span className="rounded-full bg-slate-100 px-3 py-1">{lesson.videoAssetName}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => editLesson(lesson)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">Editar</button>
                    <button
                      onClick={async () => {
                        if (lesson.videoSource === 'upload' && lesson.videoAssetId) {
                          await deleteLessonVideoAsset(lesson.videoAssetId)
                        }
                        setLessons((current) => current.filter((item) => item.id !== lesson.id))
                      }}
                      className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700"
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() =>
                        setLessons((current) =>
                          current.map((item) =>
                            item.id === lesson.id
                              ? { ...item, adminStatus: 'publicada', status: item.releaseDate > getTodayKey() ? 'em breve' : 'novo' }
                              : item,
                          ),
                        )
                      }
                      className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
                    >
                      Publicar
                    </button>
                    <button onClick={() => setLessons((current) => current.map((item) => item.id === lesson.id ? { ...item, featured: !item.featured } : item))} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Destaque</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminSpecialtiesPage() {
  const { specialties, setSpecialties } = useData()
  const [form, setForm] = useState({ name: '', description: '', color: '#075985', icon: 'BookOpen', order: specialties.length + 1, status: 'ativo' as Specialty['status'] })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const specialty: Specialty = { id: makeId('esp', form.name), slug: makeId('', form.name).replace(/^-/, ''), ...form, teacherIds: [] }
    setSpecialties((current) => [...current, specialty])
    setForm({ ...form, name: '', description: '', order: form.order + 1 })
  }
  return (
    <CrudLayout title="Gerenciar cursos e especialidades">
      <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Criar categoria</h2>
        <div className="mt-5 grid gap-4">
          <Field label="Nome"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></Field>
          <Field label="Descrição"><textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaClass} /></Field>
          <Field label="Cor"><input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-11 w-full rounded-2xl border border-slate-200 p-1" /></Field>
          <Field label="Ícone"><input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputClass} /></Field>
          <Field label="Ordem"><input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className={inputClass} /></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Specialty['status'] })} className={inputClass}><option>ativo</option><option>inativo</option></select></Field>
          <button className="h-12 rounded-2xl bg-sky-950 font-black text-white">Criar especialidade</button>
        </div>
      </form>
      <div className="grid gap-3">
        {specialties.map((specialty) => {
          return (
            <div key={specialty.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ backgroundColor: specialty.color }}><IconByName name={specialty.icon} className="h-5 w-5" /></span>
                  <div>
                    <p className="font-black text-slate-950">{specialty.name}</p>
                    <p className="text-sm font-semibold text-slate-500">Ordem {specialty.order} · {specialty.status}</p>
                  </div>
                </div>
                <button onClick={() => setSpecialties((current) => current.map((item) => item.id === specialty.id ? { ...item, status: item.status === 'ativo' ? 'inativo' : 'ativo' } : item))} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                  Ativar/inativar
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </CrudLayout>
  )
}

function CrudLayout({ title, children }: { title: string; children: ReactNode[] | ReactNode }) {
  const childArray = Array.isArray(children) ? children : [children]
  return (
    <div>
      <SectionTitle title={title} />
      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">{childArray}</div>
    </div>
  )
}

function AdminTeachersPage() {
  const { teachers, setTeachers, specialties, lessons } = useData()
  const [form, setForm] = useState({ name: '', title: '', crm: '', bio: '', avatar: 'DR', specialties: 'Doppler' })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTeachers((current) => [...current, { id: makeId('prof', form.name), ...form, specialties: form.specialties.split(',').map((item) => item.trim()), lessonIds: [] }])
    setForm({ name: '', title: '', crm: '', bio: '', avatar: 'DR', specialties: specialties[0]?.name ?? '' })
  }
  return (
    <CrudLayout title="Gerenciar professores">
      <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Cadastrar professor</h2>
        <div className="mt-5 grid gap-4">
          <Field label="Nome"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></Field>
          <Field label="Título"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></Field>
          <Field label="CRM fake"><input value={form.crm} onChange={(e) => setForm({ ...form, crm: e.target.value })} className={inputClass} /></Field>
          <Field label="Bio"><textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={textareaClass} /></Field>
          <Field label="Foto fake/avatar"><input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} className={inputClass} /></Field>
          <Field label="Especialidades"><input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} className={inputClass} /></Field>
          <button className="h-12 rounded-2xl bg-sky-950 font-black text-white">Cadastrar professor</button>
        </div>
      </form>
      <div className="grid gap-3 lg:grid-cols-2">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <TeacherAvatar teacher={teacher} size="md" />
              <div>
                <p className="font-black text-slate-950">{teacher.name}</p>
                <p className="text-sm font-semibold text-slate-500">{teacher.title} · {teacher.crm}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{teacher.bio}</p>
                {teacher.credentials && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {teacher.credentials.slice(0, 3).map((credential) => (
                      <Badge key={credential} tone="sky">{credential}</Badge>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Aulas vinculadas: {lessons.filter((lesson) => lesson.teacherId === teacher.id).length}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CrudLayout>
  )
}

function AdminStudentsPage() {
  const { students, setStudents } = useData()
  return (
    <div>
      <SectionTitle title="Alunos" />
      <div className="grid gap-3 md:hidden">
        {students.map((student) => (
          <div key={student.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-black text-slate-950">{student.name}</p>
                <p className="truncate text-sm font-semibold text-slate-500">{student.email}</p>
              </div>
              <StatusBadge status={student.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoLine label="Plano" value={student.plan} />
              <InfoLine label="Último acesso" value={student.lastAccess} />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm font-bold">
                <span className="text-slate-700">Progresso</span>
                <span className="text-slate-400">{student.progress}%</span>
              </div>
              <ProgressBar value={student.progress} />
            </div>
            <button
              onClick={() => setStudents((current) => current.map((item) => item.id === student.id ? { ...item, status: item.status === 'ativo' ? 'inativo' : 'ativo' } : item))}
              className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
            >
              Bloquear/liberar acesso
            </button>
          </div>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm md:block">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1.4fr_1fr_.8fr_.8fr_.8fr] bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            <span>Aluno</span><span>Plano</span><span>Status</span><span>Progresso</span><span>Ação</span>
          </div>
          {students.map((student) => (
            <div key={student.id} className="grid grid-cols-[1.4fr_1fr_.8fr_.8fr_.8fr] items-center border-t border-slate-100 px-5 py-4">
              <div><p className="font-black text-slate-950">{student.name}</p><p className="text-sm font-semibold text-slate-500">{student.email}</p></div>
              <p className="text-sm font-bold text-slate-600">{student.plan}</p>
              <StatusBadge status={student.status} />
              <div><p className="text-sm font-black text-slate-700">{student.progress}%</p><ProgressBar value={student.progress} className="mt-1" /></div>
              <button onClick={() => setStudents((current) => current.map((item) => item.id === student.id ? { ...item, status: item.status === 'ativo' ? 'inativo' : 'ativo' } : item))} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                Bloquear/liberar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminCalendarPage() {
  const { events, setEvents, teachers, lessons } = useData()
  const [form, setForm] = useState({ title: '', date: '2026-06-01', type: 'Aula liberada' as CalendarEvent['type'], teacherId: teachers[0]?.id ?? '', lessonId: '', description: '' })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setEvents((current) => [{ id: `ev-${Date.now()}`, ...form }, ...current])
    setForm({ ...form, title: '', description: '' })
  }
  return (
    <CrudLayout title="Admin - calendário">
      <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Adicionar evento</h2>
        <div className="mt-5 grid gap-4">
          <Field label="Título"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></Field>
          <Field label="Data"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} /></Field>
          <Field label="Tipo"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CalendarEvent['type'] })} className={inputClass}>{eventTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
          <Field label="Professor"><select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className={inputClass}>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></Field>
          <Field label="Aula vinculada"><select value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: e.target.value })} className={inputClass}><option value="">Sem aula</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></Field>
          <Field label="Descrição"><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaClass} /></Field>
          <button className="h-12 rounded-2xl bg-sky-950 font-black text-white">Adicionar evento</button>
        </div>
      </form>
      <div className="grid gap-3">
        {events.map((event) => (
          <div key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div><p className="font-black text-slate-950">{event.title}</p><p className="text-sm font-semibold text-slate-500">{formatDate(event.date)} · {event.type}</p></div>
              <button onClick={() => setEvents((current) => current.filter((item) => item.id !== event.id))} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </CrudLayout>
  )
}

function AdminReportsPage() {
  const { reports, setReports } = useData()
  const [form, setForm] = useState({ title: '', category: reportCategories[0], description: '', content: '', status: 'rascunho' as ReportTemplate['status'] })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setReports((current) => [{ id: makeId('laudo', form.title), ...form }, ...current])
    setForm({ ...form, title: '', description: '', content: '' })
  }
  return (
    <CrudLayout title="Admin - modelos de laudos">
      <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Novo modelo</h2>
        <div className="mt-5 grid gap-4">
          <Field label="Título"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></Field>
          <Field label="Categoria"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>{reportCategories.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Descrição"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} /></Field>
          <Field label="Conteúdo"><textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className={textareaClass} /></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ReportTemplate['status'] })} className={inputClass}><option>rascunho</option><option>publicado</option></select></Field>
          <button className="h-12 rounded-2xl bg-sky-950 font-black text-white">Criar modelo</button>
        </div>
      </form>
      <div className="grid gap-3">
        {reports.map((report) => (
          <div key={report.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div><StatusBadge status={report.status} /><p className="mt-2 font-black text-slate-950">{report.title}</p><p className="text-sm font-semibold text-slate-500">{report.category}</p></div>
              <div className="flex gap-2"><button onClick={() => setReports((current) => current.map((item) => item.id === report.id ? { ...item, status: 'publicado' } : item))} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Publicar</button><button onClick={() => setReports((current) => current.filter((item) => item.id !== report.id))} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">Excluir</button></div>
            </div>
          </div>
        ))}
      </div>
    </CrudLayout>
  )
}

function AdminCasesPage() {
  const { cases, setCases, specialties } = useData()
  const [form, setForm] = useState({ title: '', specialtySlug: specialties[0]?.slug ?? '', level: 'básico' as CaseStudy['level'], description: '', findings: '', discussion: '', image: 'gineco', status: 'rascunho' as CaseStudy['status'] })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setCases((current) => [
      {
        id: makeId('caso', form.title),
        slug: makeId('', form.title).replace(/^-/, ''),
        title: form.title,
        specialtySlug: form.specialtySlug,
        level: form.level,
        description: form.description,
        history: 'História clínica adicionada pelo administrador na versão final.',
        findings: form.findings,
        hypothesis: 'Hipótese diagnóstica a preencher.',
        discussion: form.discussion,
        thumbnail: form.image,
        status: form.status,
      },
      ...current,
    ])
    setForm({ ...form, title: '', description: '', findings: '', discussion: '' })
  }
  return (
    <CrudLayout title="Admin - estudos de caso">
      <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Novo caso clínico</h2>
        <div className="mt-5 grid gap-4">
          <Field label="Título"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></Field>
          <Field label="Especialidade"><select value={form.specialtySlug} onChange={(e) => setForm({ ...form, specialtySlug: e.target.value })} className={inputClass}>{specialties.map((specialty) => <option key={specialty.id} value={specialty.slug}>{specialty.name}</option>)}</select></Field>
          <Field label="Nível"><select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as CaseStudy['level'] })} className={inputClass}><option>básico</option><option>intermediário</option><option>avançado</option></select></Field>
          <Field label="Descrição"><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaClass} /></Field>
          <Field label="Achados"><textarea rows={4} value={form.findings} onChange={(e) => setForm({ ...form, findings: e.target.value })} className={textareaClass} /></Field>
          <Field label="Discussão"><textarea rows={4} value={form.discussion} onChange={(e) => setForm({ ...form, discussion: e.target.value })} className={textareaClass} /></Field>
          <Field label="Imagem fake"><select value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={inputClass}>{['mama', 'gineco', 'vascular', 'tireoide', 'pocus', 'partes'].map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CaseStudy['status'] })} className={inputClass}><option>rascunho</option><option>publicado</option></select></Field>
          <button className="h-12 rounded-2xl bg-sky-950 font-black text-white">Criar caso</button>
        </div>
      </form>
      <div className="grid gap-3">
        {cases.map((caseStudy) => (
          <div key={caseStudy.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div><StatusBadge status={caseStudy.status} /><p className="mt-2 font-black text-slate-950">{caseStudy.title}</p><p className="text-sm font-semibold text-slate-500">{caseStudy.level} · {getSpecialty(caseStudy.specialtySlug, specialties).name}</p></div>
              <button onClick={() => setCases((current) => current.filter((item) => item.id !== caseStudy.id))} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </CrudLayout>
  )
}

function AdminCommentsPage() {
  const { comments, setComments, lessons } = useData()
  const pending = comments.filter((comment) => comment.status === 'pendente')
  return (
    <div>
      <SectionTitle title="Comentários e dúvidas" />
      <div className="grid gap-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div>
                <div className="flex flex-wrap gap-2"><StatusBadge status={comment.status} /><Badge tone="sky">{lessons.find((lesson) => lesson.id === comment.lessonId)?.title ?? 'Aula relacionada'}</Badge></div>
                <p className="mt-3 font-black text-slate-950">{comment.author}</p>
                <p className="mt-2 leading-6 text-slate-600">{comment.message}</p>
              </div>
              <div>
                <textarea rows={4} placeholder="Resposta do professor/admin" className={textareaClass} />
                <button onClick={() => setComments((current) => current.map((item) => item.id === comment.id ? { ...item, status: 'respondido' } : item))} className="mt-3 w-full rounded-2xl bg-sky-950 px-5 py-3 text-sm font-black text-white">
                  Responder/moderar
                </button>
              </div>
            </div>
          </div>
        ))}
        {pending.length === 0 && <p className="text-sm font-bold text-slate-500">Todas as dúvidas estão respondidas.</p>}
      </div>
    </div>
  )
}

function AdminSettingsPage() {
  const [settings, setSettings] = useLocalStorageState('settings', {
    platformName: 'UNEZUS Academy',
    logo: 'UNEZUS',
    primaryColor: '#075985',
    whatsapp: '+55 85 90000-0000',
    email: 'suporte@unezus.com.br',
    welcome: 'Bem-vindo à experiência de educação continuada da UNEZUS.',
    maintenance: false,
  })

  return (
    <div>
      <SectionTitle title="Configurações" />
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome da plataforma"><input value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} className={inputClass} /></Field>
          <Field label="Logo"><input value={settings.logo} onChange={(e) => setSettings({ ...settings, logo: e.target.value })} className={inputClass} /></Field>
          <Field label="Cor principal"><input type="color" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="h-11 w-full rounded-2xl border border-slate-200 p-1" /></Field>
          <Field label="WhatsApp de suporte"><input value={settings.whatsapp} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} className={inputClass} /></Field>
          <Field label="E-mail de suporte"><input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className={inputClass} /></Field>
          <Field label="Modo manutenção fake">
            <button onClick={() => setSettings({ ...settings, maintenance: !settings.maintenance })} className={clsx('h-11 w-full rounded-2xl text-sm font-black', settings.maintenance ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')} type="button">
              {settings.maintenance ? 'Manutenção ligada' : 'Manutenção desligada'}
            </button>
          </Field>
          <div className="md:col-span-2">
            <Field label="Texto de boas-vindas"><textarea rows={5} value={settings.welcome} onChange={(e) => setSettings({ ...settings, welcome: e.target.value })} className={textareaClass} /></Field>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<AppShell><StudentDashboard /></AppShell>} />
      <Route path="/app/aulas/:id" element={<AppShell><LessonPage /></AppShell>} />
      <Route path="/app/especialidades/:slug" element={<AppShell><SpecialtyPage /></AppShell>} />
      <Route path="/app/calendario" element={<AppShell><CalendarPage /></AppShell>} />
      <Route path="/app/laudos" element={<AppShell><ReportsPage /></AppShell>} />
      <Route path="/app/casos" element={<AppShell><CasesPage /></AppShell>} />
      <Route path="/app/casos/:slug" element={<AppShell><CaseDetailPage /></AppShell>} />
      <Route path="/app/ranking" element={<AppShell><RankingPage /></AppShell>} />
      <Route path="/app/perfil" element={<AppShell><ProfilePage /></AppShell>} />
      <Route path="/app/suporte" element={<AppShell><SupportPage /></AppShell>} />
      <Route path="/admin" element={<AdminShell><AdminDashboard /></AdminShell>} />
      <Route path="/admin/aulas" element={<AdminShell><AdminLessonsPage /></AdminShell>} />
      <Route path="/admin/especialidades" element={<AdminShell><AdminSpecialtiesPage /></AdminShell>} />
      <Route path="/admin/professores" element={<AdminShell><AdminTeachersPage /></AdminShell>} />
      <Route path="/admin/alunos" element={<AdminShell><AdminStudentsPage /></AdminShell>} />
      <Route path="/admin/calendario" element={<AdminShell><AdminCalendarPage /></AdminShell>} />
      <Route path="/admin/laudos" element={<AdminShell><AdminReportsPage /></AdminShell>} />
      <Route path="/admin/casos" element={<AdminShell><AdminCasesPage /></AdminShell>} />
      <Route path="/admin/comentarios" element={<AdminShell><AdminCommentsPage /></AdminShell>} />
      <Route path="/admin/configuracoes" element={<AdminShell><AdminSettingsPage /></AdminShell>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <HashRouter>
      <DataProvider>
        <AppRoutes />
      </DataProvider>
    </HashRouter>
  )
}

export default App
