import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  DatabaseZap,
  Layers3,
  Menu,
  ShieldCheck,
  Sparkles,
  Wifi,
  X,
  Zap
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, Navigate, Route, Routes, useParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import LoginPage from './components/LoginPage'
import { insightCards, landingHighlights, navItems } from './data/mockData'
import { useFraudAlertStream } from './hooks/useFraudAlertStream'
import { useSagaProgress } from './hooks/useSagaProgress'
import {
  addToast,
  approveOverride,
  dismissCase,
  freezeAccount,
  removeToast,
  setTransferScenario,
  setTransferStage,
  submitTransfer,
  toggleVirtualCard,
  updateAccountLimit,
  updateTransferField
} from './store/dashboardSlice'

const cardStyles = 'rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-glow backdrop-blur-sm'
const severityStyles = {
  LOW: 'bg-emerald-500/10 text-emerald-300',
  MEDIUM: 'bg-amber-500/10 text-amber-300',
  CRITICAL: 'bg-rose-500/10 text-rose-300'
}
const severityLabels = {
  LOW: 'Low Risk',
  MEDIUM: 'Elevated Risk',
  CRITICAL: 'High Risk - Urgent Review'
}
const transactionStatusLabels = {
  Completed: 'Settled & Cleared',
  Pending: 'Awaiting Review',
  Flagged: 'Flagged by Risk Review',
  'Settled & Cleared': 'Settled & Cleared',
  'Awaiting Review': 'Awaiting Review',
  'Flagged by Risk Review': 'Flagged by Risk Review'
}
const caseStatusLabels = {
  Open: 'Under Review',
  Investigating: 'Escalated for Compliance Review',
  Escalated: 'Escalated for Compliance Review',
  Resolved: 'Resolved & Cleared',
  Approved: 'Approved for Release',
  Frozen: 'Account Restricted',
  Dismissed: 'Archived'
}

const heroSlides = [
  {
    id: 'transfer',
    eyebrow: 'Payment orchestration',
    headline: 'Instant payment flow with confidence-built controls',
    subtitle: 'Move funds securely across accounts with real-time fraud checks, instant approval signals, and transparent settlement visibility.',
    primaryLabel: 'Launch payment center',
    secondaryLabel: 'Review banking rails',
    primaryTo: '/transfer',
    secondaryTo: '/pipeline',
    accent: 'cyan'
  },
  {
    id: 'fraud',
    eyebrow: 'Adaptive fraud defense',
    headline: 'Stopping financial crime before it reaches your balance',
    subtitle: 'AI-driven anomaly detection and real-time watchlist monitoring help block suspicious activity before settlement is complete.',
    primaryLabel: 'Open risk operations',
    secondaryLabel: 'Inspect flagged transactions',
    primaryTo: '/fraud-cases',
    secondaryTo: '/dashboard',
    accent: 'rose'
  },
  {
    id: 'vault',
    eyebrow: 'Accounts & vaults',
    headline: 'Banking security built for everyday confidence',
    subtitle: 'Multi-tier accounts, instant virtual card controls, and proactive monitoring keep every customer relationship protected.',
    primaryLabel: 'Explore accounts',
    secondaryLabel: 'Review security posture',
    primaryTo: '/accounts',
    secondaryTo: '/dashboard',
    accent: 'emerald'
  }
]

const storyCheckpoints = [
  { label: 'Customer Initiates', detail: 'Mobile tap or transfer request starts the payment journey', status: 'Ready' },
  { label: 'Funds Protection', detail: 'Protected authorization holds funds while risk checks run', status: 'Secured' },
  { label: 'Risk Review', detail: 'Behavioral scoring and payment intelligence assess suspicious patterns', status: 'Scanning' },
  { label: 'Settlement or Block', detail: 'Verified transfers clear while threats are stopped before funds move', status: 'Verified' }
]

function App() {
  const { toasts } = useSelector((state) => state.dashboard)
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  useEffect(() => {
    document.title = 'FutureTrust Bank | Intelligent Banking & Real-Time Fraud Defense'

    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }

    meta.content = 'FutureTrust Bank delivers real-time digital banking, AI-driven fraud defense, and resilient distributed settlement.'
  }, [])

  useFraudAlertStream(true)
  useSagaProgress('txn-9001', true)

  const ProtectedRoute = ({ children, allowedRoles = ['ROLE_CUSTOMER', 'ROLE_COMPLIANCE'] }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }

    const activeRole = user?.role || 'ROLE_CUSTOMER'
    if (!allowedRoles.includes(activeRole)) {
      return <Navigate to={activeRole === 'ROLE_COMPLIANCE' ? '/fraud-cases' : '/dashboard'} replace />
    }

    return children
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <Header />
        <ToastStack toasts={toasts} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><TransferPage /></ProtectedRoute>} />
          <Route path="/fraud-cases" element={<ProtectedRoute allowedRoles={['ROLE_COMPLIANCE']}><FraudCasesPage /></ProtectedRoute>} />
          <Route path="/fraud-cases/:id" element={<ProtectedRoute allowedRoles={['ROLE_COMPLIANCE']}><FraudCaseDetailPage /></ProtectedRoute>} />
          <Route path="/pipeline" element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
          <Route path="/system-health" element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        </Routes>
        <Footer />
      </div>
    </div>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 shadow-glow backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-[0_0_30px_rgba(45,212,191,0.35)]">
            <CircleDollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">FutureTrust Bank</p>
            <h1 className="text-xs font-medium uppercase tracking-[0.18em] text-slate-200">Next-Gen Intelligent Banking & Real-Time Fraud Defense</h1>
          </div>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `text-sm transition ${isActive ? 'text-cyan-300' : 'text-slate-300 hover:text-white'}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-200 transition hover:border-cyan-400 hover:text-white">
            <Bell className="h-4 w-4" />
          </button>
          <button className="hidden rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 md:block">
            Launch risk review
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-200 md:hidden"
            onClick={() => setMenuOpen((current) => !current)}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="mt-4 grid gap-2 border-t border-slate-800 pt-4 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `rounded-xl px-3 py-2 text-sm transition ${isActive ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-12 rounded-[28px] border border-slate-800 bg-slate-900/75 p-6 shadow-glow backdrop-blur-sm">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500">
              <CircleDollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">FutureTrust Bank</p>
              <p className="text-sm text-slate-300">Next-Gen Intelligent Banking & Real-Time Fraud Defense</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
            FutureTrust Bank blends resilient money movement, adaptive fraud intelligence, and clear operational visibility into a single trusted banking experience.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Products</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>FutureTrust Premier Checking</li>
            <li>FutureTrust High-Yield Vault</li>
            <li>Secure Payment Rail</li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Security</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>Protected settlement rails</li>
            <li>Adaptive fraud defense</li>
            <li>Real-time anomaly defense</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-800 pt-5 text-xs uppercase tracking-[0.18em] text-slate-500">
        © 2026 FutureTrust Bank • Banking-grade infrastructure for a digital-first economy
      </div>
    </footer>
  )
}

function ToastStack({ toasts }) {
  const dispatch = useDispatch()

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-50 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto w-80 rounded-2xl border border-slate-700 bg-slate-900/95 p-4 shadow-glow ${toast.variant === 'success' ? 'border-emerald-500/30' : toast.variant === 'warning' ? 'border-amber-500/30' : 'border-cyan-500/30'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{toast.title}</p>
              <p className="mt-1 text-xs text-slate-300">{toast.message}</p>
            </div>
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-white"
              onClick={() => dispatch(removeToast(toast.id))}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingState({ label }) {
  return (
    <div className={`${cardStyles} mt-8`}>
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-slate-700" />
        <div className="h-8 w-52 rounded bg-slate-700" />
        <div className="h-24 rounded bg-slate-800" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-16 rounded bg-slate-800" />
          <div className="h-16 rounded bg-slate-800" />
          <div className="h-16 rounded bg-slate-800" />
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-400">{label}</p>
    </div>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className={`${cardStyles} mt-8`}>
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-slate-800 p-2 text-slate-300">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  )
}

function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const storyRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ['start end', 'end start']
  })

  const avatarX = useTransform(scrollYProgress, [0, 1], ['-4%', '84%'])
  const avatarY = useTransform(scrollYProgress, [0, 0.28, 0.62, 1], ['-10%', '-18%', '-4%', '12%'])
  const checkpointOpacities = [
    useTransform(scrollYProgress, [0.05, 0.2, 0.5], [0.45, 1, 1]),
    useTransform(scrollYProgress, [0.2, 0.38, 0.6], [0.45, 1, 1]),
    useTransform(scrollYProgress, [0.38, 0.56, 0.8], [0.45, 1, 1]),
    useTransform(scrollYProgress, [0.56, 0.8, 1], [0.45, 1, 1])
  ]

  useEffect(() => {
    if (isPaused) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 5600)

    return () => window.clearInterval(timer)
  }, [isPaused])

  const activeSlideData = heroSlides[activeSlide]

  const goToSlide = (direction) => {
    setActiveSlide((current) => {
      if (direction === 'next') {
        return (current + 1) % heroSlides.length
      }

      return (current - 1 + heroSlides.length) % heroSlides.length
    })
  }

  return (
    <main className="space-y-10">
      <section className="hero-shell">
        <motion.div
          className={`hero-carousel hero-carousel--${activeSlideData.accent}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="hero-glow" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlideData.id}
              className="hero-slide"
              initial={{ opacity: 0, x: 42 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -42 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <div className="hero-copy">
                <div className="hero-badge">
                  <Sparkles className="h-3.5 w-3.5" />
                  {activeSlideData.eyebrow}
                </div>
                <h2>{activeSlideData.headline}</h2>
                <p>{activeSlideData.subtitle}</p>
                <div className="hero-actions">
                  <Link to={activeSlideData.primaryTo} className="primary-btn">
                    {activeSlideData.primaryLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to={activeSlideData.secondaryTo} className="secondary-btn">
                    {activeSlideData.secondaryLabel}
                  </Link>
                </div>
              </div>

              <div className="hero-panel">
                <div className="hero-mini-card hero-mini-card--main">
                  <span className="label">Payment speed</span>
                  <strong>48ms</strong>
                  <small>secure clearing response</small>
                </div>
                <div className="hero-mini-card">
                  <span className="label">Risk shield</span>
                  <strong>99.7%</strong>
                  <small>precision block rate</small>
                </div>
                <div className="hero-mini-card">
                  <span className="label">Protected vaults</span>
                  <strong>3.4M</strong>
                  <small>accounts monitored / day</small>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="hero-controls">
            <button type="button" aria-label="Previous slide" onClick={() => goToSlide('previous')}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Next slide" onClick={() => goToSlide('next')}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="hero-dots" aria-label="Carousel pagination">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                className={index === activeSlide ? 'active' : ''}
                onClick={() => setActiveSlide(index)}
              />
            ))}
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: <ShieldCheck className="h-5 w-5" />,
            title: 'FutureTrust Premier Checking',
            text: 'Built for everyday cash flow with instant virtual card controls and seamless real-time balance visibility.'
          },
          {
            icon: <Layers3 className="h-5 w-5" />,
            title: 'FutureTrust High-Yield Vault',
            text: 'High-conviction savings, rate-aware allocations, and resilient vault automation for capital preservation.'
          },
          {
            icon: <DatabaseZap className="h-5 w-5" />,
            title: 'Secure Payment Rail & Settlement Controls',
            text: 'Trusted transfer orchestration with instant rails, risk-aware monitoring, and settlement integrity checks.'
          }
        ].map((item) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="brand-card"
          >
            <div className="brand-card-icon">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </motion.div>
        ))}
      </section>

      <section ref={storyRef} className="story-panel">
        <div className="story-header">
          <p>Scroll journey</p>
          <h3>From mobile tap to safe settlement</h3>
        </div>

        <div className="story-track">
          <motion.div className="story-avatar" style={{ x: avatarX, y: avatarY }}>
            <div className="story-avatar-core">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </motion.div>

          <div className="story-line" />

          {storyCheckpoints.map((checkpoint, index) => (
            <motion.div
              key={checkpoint.label}
              className="story-checkpoint"
              style={{ opacity: checkpointOpacities[index] }}
            >
              <div className="story-index">0{index + 1}</div>
              <div className="story-copy">
                <div className="story-status">{checkpoint.status}</div>
                <h4>{checkpoint.label}</h4>
                <p>{checkpoint.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  )
}

function DashboardPage() {
  const { summary, quickStats, transactions, alerts, riskTrend, portfolio } = useSelector((state) => state.dashboard)

  return (
    <main className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/70 p-6 shadow-glow"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Real-time view
            </div>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
              +18.2% QoQ
            </span>
          </div>

          <div className="max-w-lg">
            <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Modern banking is powered by immediate trust.
            </h2>
            <p className="mt-4 max-w-md text-base text-slate-300">
              Monitor account flows, detect anomaly signals, and speed up settlements across your distributed operations with a single control plane.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/transfer" className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              Open account overview
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/fraud-cases" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-5 py-3 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white">
              Review risk rules
            </Link>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className={`${cardStyles} flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Net position</p>
              <p className="mt-2 text-3xl font-semibold text-white">{summary.balance}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <div>
                <p className="text-xs text-slate-400">Liquidity</p>
                <p className="mt-1 text-xl font-medium text-white">{summary.liquidity}</p>
              </div>
              <Activity className="h-5 w-5 text-cyan-300" />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <div>
                <p className="text-xs text-slate-400">Fraud posture</p>
                <p className="mt-1 text-xl font-medium text-white">{summary.fraudScore}</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
            </div>
          </div>
        </motion.aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((stat) => (
          <div key={stat.label} className={`${cardStyles} flex items-center justify-between`}>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{stat.label}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{stat.value}</p>
              <p className="mt-2 text-sm text-emerald-300">{stat.delta}</p>
            </div>
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
              {stat.icon === 'wallet' && <CreditCard className="h-5 w-5" />}
              {stat.icon === 'activity' && <Activity className="h-5 w-5" />}
              {stat.icon === 'shield' && <ShieldCheck className="h-5 w-5" />}
              {stat.icon === 'timer' && <Zap className="h-5 w-5" />}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className={`${cardStyles}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk pattern</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Fraud signal intensity</h3>
            </div>
            <p className="text-sm text-emerald-300">{summary.efficiency}</p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} fill="url(#riskFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${cardStyles}`}>
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Threat watch</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Event feed</h3>
          </div>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.title} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{alert.title}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${alert.tone === 'amber' ? 'bg-amber-500/10 text-amber-300' : alert.tone === 'green' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-cyan-500/10 text-cyan-300'}`}>
                    {alert.tone}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{alert.detail}</p>
                <p className="mt-3 text-xs text-slate-500">{alert.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className={`${cardStyles}`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Transactions</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Live payment lanes</h3>
            </div>
            <Link to="/transactions" className="text-sm text-cyan-300 hover:text-cyan-200">
              View all
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/80 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-3">
                      <div>
                        <p>{transaction.customer}</p>
                        <p className="text-xs text-slate-500">{transaction.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{transaction.type}</td>
                    <td className="px-4 py-3 font-medium text-white">{transaction.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.15em] ${transaction.status === 'Settled & Cleared' ? 'bg-emerald-500/10 text-emerald-300' : transaction.status === 'Awaiting Review' ? 'bg-amber-500/10 text-amber-300' : 'bg-rose-500/10 text-rose-300'}`}>
                        {transactionStatusLabels[transaction.status] ?? transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`${cardStyles}`}>
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Allocation</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Balance mix</h3>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={portfolio} layout="vertical" margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-3">
            {insightCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{card.title}</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-2xl font-semibold text-white">{card.value}</p>
                  <p className="text-xs text-slate-400">{card.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function TransferPage() {
  const dispatch = useDispatch()
  const transfer = useSelector((state) => state.dashboard.transfer)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scenarioOptions = [
    { value: 'normal', label: 'Normal Transfer (< $1,000)' },
    { value: 'high', label: 'High Amount Anomaly (> $100,000)' },
    { value: 'velocity', label: 'Rapid Velocity Spike (multiple rapid hits)' },
    { value: 'geolocation', label: 'Suspicious Geolocation (overseas IP switch)' }
  ]

  const handleChange = (event) => {
    const { name, value } = event.target
    dispatch(updateTransferField({ field: name, value }))
  }

  return (
    <div className={`${cardStyles} mt-8 space-y-6`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Instant payments</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Payment center & transfer review</h2>
        </div>
        <select
          value={transfer.scenario}
          onChange={(event) => {
            dispatch(setTransferScenario(event.target.value))
            dispatch(addToast({
              title: 'Scenario updated',
              message: `${scenarioOptions.find((option) => option.value === event.target.value)?.label ?? 'Scenario'} is now active.`,
              variant: 'info'
            }))
          }}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
        >
          {scenarioOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-300">
          <span>Source Account</span>
          <input name="sourceAccount" value={transfer.sourceAccount} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none" />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Target Account</span>
          <input name="targetAccount" value={transfer.targetAccount} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none" />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Amount</span>
          <input name="amount" value={transfer.amount} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none" />
        </label>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Currency</span>
          <select name="currency" value={transfer.currency} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="SGD">SGD</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
          <span>Device IP / Location</span>
          <input name="device" value={transfer.device} onChange={handleChange} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none" />
        </label>
        <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
          <span>Transfer Note</span>
          <textarea name="note" value={transfer.note} onChange={handleChange} rows="3" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none" />
        </label>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-white">Payment flow timeline</p>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200">
            {transfer.transferStatus}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {transfer.saga.map((step, index) => {
            const isActive = transfer.stage === step.id
            const isCompleted = step.status === 'completed'

            return (
              <button
                type="button"
                key={step.id}
                onClick={() => {
                  dispatch(setTransferStage(step.id))
                  dispatch(addToast({
                    title: `Stage selected: ${step.label}`,
                    message: `Execution step ${index + 1} has been activated for review.`,
                    variant: 'info'
                  }))
                }}
                className={`rounded-2xl border p-3 text-left ${isActive ? 'border-cyan-500/50 bg-cyan-500/10' : isCompleted ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-700 bg-slate-900'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Step {index + 1}</span>
                  {isCompleted ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <Activity className="h-4 w-4 text-slate-400" />}
                </div>
                <p className="text-sm font-medium text-white">{step.label}</p>
                <p className="mt-1 text-xs text-slate-300 capitalize">{step.status}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => dispatch(addToast({ title: 'Simulation reset', message: 'The transfer form was reset to the active scenario defaults.', variant: 'info' }))}
          className="rounded-full border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm text-slate-100"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSubmitting(true)
            dispatch(submitTransfer())
            window.setTimeout(() => {
              setIsSubmitting(false)
              dispatch(addToast({ title: 'Transfer submitted', message: 'The secure payment workflow is now executing.', variant: 'success' }))
            }, 700)
          }}
          className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing…' : 'Run transfer review'}
        </button>
      </div>
    </div>
  )
}

function FraudCasesPage() {
  const { fraudCases } = useSelector((state) => state.dashboard)
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const filteredCases = fraudCases.filter((item) => {
    const matchesSeverity = severityFilter === 'ALL' || item.severity === severityFilter
    const matchesSearch = `${item.customer} ${item.id}`.toLowerCase().includes(search.toLowerCase())
    return matchesSeverity && matchesSearch
  })

  if (fraudCases.length === 0) {
    return <LoadingState label="Loading fraud case queue..." />
  }

  return (
    <div className={`${cardStyles} mt-8`}>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Risk operations</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Flagged transactions</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer / case" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none" />
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none">
            <option value="ALL">All severities</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {filteredCases.length === 0 ? (
        <EmptyState title="No matching fraud alerts" description="Try another customer name or severity filter to widen the review queue." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Case</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40 text-slate-200">
              {filteredCases.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <Link to={`/fraud-cases/${item.id}`} className="font-medium text-cyan-300 hover:text-cyan-200">{item.id}</Link>
                  </td>
                  <td className="px-4 py-3">{item.customer}</td>
                  <td className="px-4 py-3">${item.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.15em] ${severityStyles[item.severity]}`}>{severityLabels[item.severity] ?? item.severity}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{caseStatusLabels[item.status] ?? item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FraudCaseDetailPage() {
  const dispatch = useDispatch()
  const { id } = useParams()
  const caseItem = useSelector((state) => state.dashboard.fraudCases.find((item) => item.id === id))

  if (!caseItem) {
    return <EmptyState title="Case not found" description="This flag is no longer in the active investigation queue." />
  }

  return (
    <div className={`${cardStyles} mt-8 space-y-6`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Case detail</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{caseItem.id}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => dispatch(approveOverride(caseItem.id))} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950">Approve manual review</button>
          <button type="button" onClick={() => dispatch(freezeAccount(caseItem.id))} className="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">Freeze account</button>
          <button type="button" onClick={() => dispatch(dismissCase(caseItem.id))} className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100">Archive alert</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Payment telemetry</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-400">Timestamp</p>
              <p className="mt-1 text-white">{new Date(caseItem.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Geolocation</p>
              <p className="mt-1 text-white">{caseItem.geolocation}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Device fingerprint</p>
              <p className="mt-1 text-white">{caseItem.deviceFingerprint}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Velocity</p>
              <p className="mt-1 text-white">{caseItem.velocity}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Case summary</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-slate-300">Customer</span><span className="font-medium text-white">{caseItem.customer}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-300">Amount</span><span className="font-medium text-white">${caseItem.amount.toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-300">Severity</span><span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.15em] ${severityStyles[caseItem.severity]}`}>{severityLabels[caseItem.severity] ?? caseItem.severity}</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-300">Status</span><span className="font-medium text-white">{caseStatusLabels[caseItem.status] ?? caseItem.status}</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Triggered rules breakdown</p>
        <div className="mt-4 space-y-4">
          {caseItem.rules.map((rule) => (
            <div key={rule.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-white">{rule.label}</p>
                <span className="text-sm text-cyan-300">{rule.value}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{rule.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PipelinePage() {
  const { microservices, kafkaTopics, redis } = useSelector((state) => state.dashboard)

  return (
    <div className={`${cardStyles} mt-8 space-y-8`}>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Infrastructure status</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Core banking infrastructure & settlement rail</h2>
      </div>

      <section className="grid gap-4 lg:grid-cols-5">
        {microservices.map((service) => (
          <div key={service.name} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">{service.name}</p>
              <span className={`h-2.5 w-2.5 rounded-full ${service.status === 'Healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">{service.status}</p>
            <p className="mt-2 text-xl font-semibold text-white">{service.latency}</p>
            <p className="mt-2 text-xs text-slate-300">{service.stream}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Payment channels</p>
            <Wifi className="h-4 w-4 text-cyan-300" />
          </div>
          <div className="space-y-3">
            {kafkaTopics.map((topic) => (
              <div key={topic.name} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{topic.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">replicas: {topic.replicas}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{topic.status}</p>
                  <p className="text-sm text-cyan-300">lag {topic.lag}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Behavioral risk cache</p>
            <DatabaseZap className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  {redis.status}
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Keyspace</p>
                <p className="mt-2 text-sm font-medium text-white">{redis.keyspace}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Hit rate</p>
                <p className="mt-2 text-sm font-medium text-white">{redis.hitRate}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Memory</p>
                <p className="mt-2 text-sm font-medium text-white">{redis.memory}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Throughput</p>
                <p className="mt-2 text-sm font-medium text-white">{redis.throughput}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function AccountsPage() {
  const dispatch = useDispatch()
  const { accounts } = useSelector((state) => state.dashboard)

  if (accounts.length === 0) {
    return <LoadingState label="Loading account portfolio..." />
  }

  return (
    <div className={`${cardStyles} mt-8`}>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Account management</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Accounts & vault overview</h2>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {accounts.map((account) => (
          <div key={account.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{account.type}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{account.name}</h3>
              </div>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-emerald-300">{account.kyc}</span>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-400">Balance</span><span className="font-medium text-white">{account.balance}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-400">Status</span><span className="font-medium text-white">{account.status}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-400">Daily limit</span><span className="font-medium text-white">{account.limit}</span></div>
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Virtual cards</p>
              {account.cards.map((card) => (
                <div key={card.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-white">{card.label}</p>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">{card.enabled ? 'Active' : 'Frozen'}</p>
                  </div>
                  <button type="button" onClick={() => dispatch(toggleVirtualCard({ accountId: account.id, cardId: card.id }))} className={`rounded-full px-3 py-1.5 text-xs font-medium ${card.enabled ? 'bg-amber-500/10 text-amber-200' : 'bg-emerald-500/10 text-emerald-200'}`}>
                    {card.enabled ? 'Freeze' : 'Unfreeze'}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <button type="button" onClick={() => dispatch(updateAccountLimit({ accountId: account.id, limit: '$50,000' }))} className="flex-1 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100">Set $50K</button>
              <button type="button" onClick={() => dispatch(updateAccountLimit({ accountId: account.id, limit: '$100,000' }))} className="flex-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">Set $100K</button>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Recent activity</p>
              <div className="mt-3 space-y-2">
                {account.transactions.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-white">{txn.description}</p>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">{txn.time}</p>
                    </div>
                    <span className={txn.amount.startsWith('-') ? 'text-rose-300' : 'text-emerald-300'}>{txn.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TransactionsPage() {
  return (
    <div className={`${cardStyles} mt-8`}>
      <h2 className="text-2xl font-semibold text-white">Transaction overview</h2>
      <p className="mt-2 text-slate-300">This view monitors the payment rail, settlement queue, and reconciliation fidelity in real time.</p>
    </div>
  )
}

function AnalyticsPage() {
  return (
    <div className={`${cardStyles} mt-8`}>
      <h2 className="text-2xl font-semibold text-white">Analytics & forecasting</h2>
      <p className="mt-2 text-slate-300">Operational intelligence is continuously stitched across transaction velocity, fraud signals, and liquidity posture.</p>
    </div>
  )
}

export default App
