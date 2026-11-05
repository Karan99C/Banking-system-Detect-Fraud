import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true'

export const apiBaseUrl = API_BASE_URL

export const mockData = {
  accounts: [
    {
      id: 'acc-1001',
      customerName: 'Alicia Moore',
      type: 'CHECKING',
      balance: 84240.18,
      status: 'ACTIVE',
      currency: 'USD',
      availableBalance: 73810.04
    },
    {
      id: 'acc-1002',
      customerName: 'Milo Chen',
      type: 'SAVINGS',
      balance: 212480.64,
      status: 'ACTIVE',
      currency: 'USD',
      availableBalance: 208910.18
    },
    {
      id: 'acc-1003',
      customerName: 'Nina Patel',
      type: 'BUSINESS',
      balance: 364100.91,
      status: 'REVIEW',
      currency: 'USD',
      availableBalance: 329640.12
    }
  ],
  transactionHistory: [
    { id: 'txn-9001', accountId: 'acc-1001', type: 'TRANSFER', amount: 1820.5, status: 'COMPLETED', createdAt: '2026-11-05T10:45:00Z' },
    { id: 'txn-9002', accountId: 'acc-1002', type: 'CARD_SETTLEMENT', amount: 5640, status: 'PENDING', createdAt: '2026-11-05T09:10:00Z' },
    { id: 'txn-9003', accountId: 'acc-1001', type: 'ACH', amount: 2800, status: 'COMPLETED', createdAt: '2026-11-05T08:05:00Z' }
  ],
  flaggedCases: [
    {
      id: 'case-4018',
      customer: 'Alicia Moore',
      account: 'CHK-1042',
      amount: 18420,
      severity: 'CRITICAL',
      status: 'Open',
      action: 'REVIEW',
      timestamp: '2026-11-05T09:14:00Z'
    },
    {
      id: 'case-4021',
      customer: 'Milo Chen',
      account: 'SAV-7789',
      amount: 4720,
      severity: 'MEDIUM',
      status: 'Investigating',
      action: 'REVIEW',
      timestamp: '2026-11-05T08:52:00Z'
    }
  ],
  fraudAlerts: [
    {
      id: 'alert-101',
      caseId: 'case-4018',
      title: 'High-value transfer flagged',
      severity: 'CRITICAL',
      message: 'Cross-border transfer exceeded threshold and triggered a customer risk review.',
      timestamp: '2026-11-05T09:14:00Z'
    },
    {
      id: 'alert-102',
      caseId: 'case-4021',
      title: 'Velocity spike detected',
      severity: 'MEDIUM',
      message: 'Rapid user activity exceeded the expected pattern for savings transfers.',
      timestamp: '2026-11-05T08:52:00Z'
    }
  ],
  sagaStages: [
    { transactionId: 'txn-9001', stageId: 'funds', transferStatus: 'FUNDS_RESERVED', details: 'Funds reservation finalized.' },
    { transactionId: 'txn-9001', stageId: 'kafka', transferStatus: 'KAFKA_DISPATCHED', details: 'Payment dispatched through the secure clearing rail.' },
    { transactionId: 'txn-9001', stageId: 'fraud', transferStatus: 'FRAUD_EVALUATED', details: 'Risk review returned a safe classification.' },
    { transactionId: 'txn-9001', stageId: 'commit', transferStatus: 'COMPLETED', details: 'Ledger settlement completed successfully.' }
  ]
}

export function shouldUseMockFallback(error) {
  if (MOCK_MODE) {
    return true
  }

  const status = error?.response?.status
  const code = error?.code

  return status === 0 || status >= 500 || ['ERR_NETWORK', 'ECONNABORTED', 'ECONNRESET'].includes(code)
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('banking_token') || localStorage.getItem('futuretrust_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.headers && !config.headers.Authorization) {
    delete config.headers.Authorization
  }

  console.info(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  return config
}, (error) => Promise.reject(error))

apiClient.interceptors.response.use((response) => {
  console.info(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} => ${response.status}`)
  return response
}, (error) => {
  console.warn('[API] request failed', error?.message)
  return Promise.reject(error)
})

export async function withMockFallback(requestFn, fallbackResponse) {
  if (MOCK_MODE) {
    return fallbackResponse
  }

  try {
    const response = await requestFn()
    return response?.data ?? response
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      console.warn('[API] backend unavailable; using mocked data fallback.', error?.message)
      return fallbackResponse
    }

    throw error
  }
}

export const accountApi = {
  fetchAccounts: async () =>
    withMockFallback(
      () => apiClient.get('/accounts'),
      mockData.accounts
    ),
  fetchAccountById: async (id) =>
    withMockFallback(
      () => apiClient.get(`/accounts/${id}`),
      mockData.accounts.find((account) => account.id === id) ?? null
    )
}

export const transactionApi = {
  initiateTransfer: async (payload) =>
    withMockFallback(
      () => apiClient.post('/transactions/transfer', payload),
      {
        id: payload?.transactionId || `txn-${Date.now()}`,
        status: 'QUEUED',
        saga: ['FUNDS_RESERVED', 'KAFKA_DISPATCHED', 'FRAUD_EVALUATED', 'COMPLETED'],
        createdAt: new Date().toISOString(),
        ...payload
      }
    ),
  fetchTransactionHistory: async (accountId) =>
    withMockFallback(
      () => apiClient.get('/transactions', { params: { accountId } }),
      mockData.transactionHistory.filter((entry) => !accountId || entry.accountId === accountId)
    )
}

export const fraudApi = {
  fetchFlaggedCases: async () =>
    withMockFallback(
      () => apiClient.get('/fraud/cases'),
      mockData.flaggedCases
    ),
  updateCaseStatus: async (id, action) =>
    withMockFallback(
      () => apiClient.post(`/fraud/cases/${id}/action`, { action }),
      {
        id,
        action,
        status: action === 'APPROVE' ? 'Approved' : action === 'FREEZE' ? 'Frozen' : 'Updated'
      }
    )
}

export default apiClient
