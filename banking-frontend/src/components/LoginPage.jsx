import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'
import { loginSuccess } from '../store/authSlice'

const demoAccounts = [
  {
    email: 'customer@futuretrust.com',
    password: 'password123',
    role: 'ROLE_CUSTOMER',
    label: 'Customer Portal',
    description: 'Access account activity, transfers, and secure wallet controls.'
  },
  {
    email: 'admin@futuretrust.com',
    password: 'admin123',
    role: 'ROLE_COMPLIANCE',
    label: 'Compliance Console',
    description: 'Review alerts, approve risk cases, and manage review queues.'
  }
]

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ email: 'customer@futuretrust.com', password: 'password123' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'ROLE_COMPLIANCE' ? '/fraud-cases' : '/dashboard'} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.email,
          password: form.password
        })
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok || !payload.token) {
        throw new Error(payload?.error || 'Authentication failed.')
      }

      dispatch(loginSuccess({
        token: payload.token,
        user: {
          userId: payload.userId,
          email: payload.email,
          role: payload.role
        }
      }))

      navigate(payload.role === 'ROLE_COMPLIANCE' ? '/fraud-cases' : '/dashboard')
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAccount = (account) => {
    setForm({ email: account.email, password: account.password })
  }

  return (
    <div className="grid min-h-[70vh] gap-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-glow">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Secure access</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Welcome back to FutureTrust Bank</h1>
        <p className="mt-4 max-w-xl text-slate-300">
          Your secure portal keeps transfers protected, fraud review visibility clear, and account access streamlined.
        </p>

        <div className="mt-8 grid gap-4">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillDemoAccount(account)}
              className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-left transition hover:border-cyan-500/50 hover:bg-slate-800"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{account.label}</p>
                  <p className="mt-1 text-sm text-slate-300">{account.email}</p>
                </div>
                <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300">{account.role}</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">{account.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8 shadow-glow">
        <h2 className="text-2xl font-semibold text-white">Sign in</h2>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Email address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white outline-none ring-0 transition focus:border-cyan-500"
              placeholder="customer@futuretrust.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white outline-none ring-0 transition focus:border-cyan-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in securely'}
          </button>
        </form>
      </div>
    </div>
  )
}
