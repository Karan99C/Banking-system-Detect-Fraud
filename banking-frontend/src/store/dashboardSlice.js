import { createSlice } from '@reduxjs/toolkit'

const scenarioMap = {
  normal: {
    label: 'Normal Transfer',
    stage: 'funds',
    saga: [
      { id: 'funds', label: 'Funds Hold Authorized', status: 'completed' },
      { id: 'kafka', label: 'Payment Dispatched to Secure Clearing Rail', status: 'active' },
      { id: 'fraud', label: 'Real-Time Risk Scoring & AML Verification', status: 'pending' },
      { id: 'commit', label: 'Ledger Settlement Completed / Reversed & Hold Released', status: 'pending' }
    ],
    status: 'Queued'
  },
  high: {
    label: 'High Amount Anomaly',
    stage: 'fraud',
    saga: [
      { id: 'funds', label: 'Funds Hold Authorized', status: 'completed' },
      { id: 'kafka', label: 'Payment Dispatched to Secure Clearing Rail', status: 'completed' },
      { id: 'fraud', label: 'Real-Time Risk Scoring & AML Verification', status: 'active' },
      { id: 'commit', label: 'Ledger Settlement Completed / Reversed & Hold Released', status: 'pending' }
    ],
    status: 'Risk review'
  },
  velocity: {
    label: 'Rapid Velocity Spike',
    stage: 'fraud',
    saga: [
      { id: 'funds', label: 'Funds Hold Authorized', status: 'completed' },
      { id: 'kafka', label: 'Payment Dispatched to Secure Clearing Rail', status: 'completed' },
      { id: 'fraud', label: 'Real-Time Risk Scoring & AML Verification', status: 'active' },
      { id: 'commit', label: 'Ledger Settlement Completed / Reversed & Hold Released', status: 'pending' }
    ],
    status: 'Velocity anomaly'
  },
  geolocation: {
    label: 'Suspicious Geolocation',
    stage: 'fraud',
    saga: [
      { id: 'funds', label: 'Funds Hold Authorized', status: 'completed' },
      { id: 'kafka', label: 'Payment Dispatched to Secure Clearing Rail', status: 'completed' },
      { id: 'fraud', label: 'Real-Time Risk Scoring & AML Verification', status: 'active' },
      { id: 'commit', label: 'Ledger Settlement Completed / Reversed & Hold Released', status: 'pending' }
    ],
    status: 'Geo mismatch'
  }
}

const initialState = {
  summary: {
    balance: '$284,640.91',
    liquidity: '72.4%',
    fraudScore: 'Low risk',
    efficiency: '+18.2%'
  },
  quickStats: [
    { label: 'Total balance', value: '$284.6K', delta: '+8.4%', icon: 'wallet' },
    { label: 'Settlements', value: '1,284', delta: '+12.1%', icon: 'activity' },
    { label: 'Risk alerts', value: '03', delta: '-2.8%', icon: 'shield' },
    { label: 'Processing time', value: '142 ms', delta: '-14.9%', icon: 'timer' }
  ],
  transactions: [
    { id: 'TX-1042', customer: 'Alicia Moore', type: 'Wire transfer', amount: '$18,420', status: 'Settled & Cleared' },
    { id: 'TX-1043', customer: 'Milo Chen', type: 'Card settlement', amount: '$5,640', status: 'Awaiting Review' },
    { id: 'TX-1044', customer: 'Nina Patel', type: 'ACH credit', amount: '$2,860', status: 'Settled & Cleared' },
    { id: 'TX-1045', customer: 'Cross-border', type: 'FX payout', amount: '$12,220', status: 'Flagged by Risk Review' }
  ],
  alerts: [
    { title: 'High-value transfer review', detail: 'Cross-border payment exceeded threshold and matched customer risk profile.', time: '2 min ago', tone: 'amber' },
    { title: 'Account health stable', detail: 'No anomalies in daily ledger reconciliation for the past 8 hours.', time: '16 min ago', tone: 'green' },
    { title: 'Clearing queue normalized', detail: 'Payment throughput recovered to standard operating baseline.', time: '41 min ago', tone: 'blue' }
  ],
  riskTrend: [
    { name: 'Mon', score: 78 },
    { name: 'Tue', score: 64 },
    { name: 'Wed', score: 72 },
    { name: 'Thu', score: 68 },
    { name: 'Fri', score: 58 },
    { name: 'Sat', score: 56 },
    { name: 'Sun', score: 49 }
  ],
  portfolio: [
    { name: 'Core checking', value: 43, color: '#60a5fa' },
    { name: 'Wealth', value: 28, color: '#34d399' },
    { name: 'Cards', value: 18, color: '#a78bfa' },
    { name: 'Treasury', value: 11, color: '#fbbf24' }
  ],
  microservices: [
    { name: 'account-service', status: 'Healthy', latency: '25 ms', stream: 'Upstream sync stable' },
    { name: 'transaction-service', status: 'Healthy', latency: '41 ms', stream: 'Ledger write confirmed' },
    { name: 'fraud-detection-service', status: 'Healthy', latency: '96 ms', stream: 'Rules engine active' },
    { name: 'notification-service', status: 'Degraded', latency: '132 ms', stream: 'Retry queue monitored' },
    { name: 'config-service', status: 'Healthy', latency: '18 ms', stream: 'Git-backed refresh OK' }
  ],
  kafkaTopics: [
    { name: 'transaction-initiated', status: 'Running', lag: '14 ms', replicas: 3 },
    { name: 'fraud-checked', status: 'Running', lag: '28 ms', replicas: 3 },
    { name: 'transaction-completed', status: 'Running', lag: '19 ms', replicas: 3 },
    { name: 'transaction-reversed', status: 'Draining', lag: '64 ms', replicas: 2 }
  ],
  redis: {
    status: 'Healthy',
    keyspace: 'velocity:txns:rate',
    hitRate: '99.3%',
    memory: '268 MB',
    throughput: '1.2M ops/min'
  },
  transfer: {
    sourceAccount: 'CHK-1042 · Personal Checking',
    targetAccount: 'BUS-8010 · Northstar Business',
    amount: '820.00',
    currency: 'USD',
    device: '203.0.113.42 / Berlin, DE',
    note: 'Quarterly supplier settlement',
    scenario: 'normal',
    stage: 'funds',
    saga: scenarioMap.normal.saga,
    transferStatus: scenarioMap.normal.status
  },
  fraudCases: [
    {
      id: 'case-4018',
      customer: 'Alicia Moore',
      account: 'CHK-1042',
      amount: 18420,
      severity: 'CRITICAL',
      status: 'Open',
      timestamp: '2026-11-05T09:14:00Z',
      geolocation: 'Berlin, DE',
      deviceFingerprint: 'iPhone 15 Pro / 92.44.112.79',
      velocity: '5 transactions / 10s',
      rules: [
        { label: 'Cognitive Behavioral Security Analysis', value: '87/100', detail: 'Cumulative device mismatch + overseas login pattern' },
        { label: 'High-Frequency Spending Anomaly Detected', value: '5 transactions / 10s', detail: 'Threshold exceeded by 2.3x' },
        { label: 'Geographic Risk Pattern', value: 'Travel pattern', detail: 'Device originated in Berlin, then moved to Singapore' }
      ]
    },
    {
      id: 'case-4021',
      customer: 'Milo Chen',
      account: 'SAV-7789',
      amount: 4720,
      severity: 'MEDIUM',
      status: 'Investigating',
      timestamp: '2026-11-05T08:52:00Z',
      geolocation: 'Seattle, US',
      deviceFingerprint: 'Dell XPS / 137.84.96.11',
      velocity: '3 transactions / 14s',
      rules: [
        { label: 'Cognitive Behavioral Security Analysis', value: '61/100', detail: 'Multi-account transfer burst detected' },
        { label: 'High-Frequency Spending Anomaly Detected', value: '3 transactions / 14s', detail: 'Variance above expected baseline' },
        { label: 'AML Watchlist', value: 'Flagged', detail: 'Beneficiary pattern triggered review' }
      ]
    },
    {
      id: 'case-4025',
      customer: 'Nina Patel',
      account: 'BUS-8010',
      amount: 128000,
      severity: 'CRITICAL',
      status: 'Escalated',
      timestamp: '2026-11-05T08:18:00Z',
      geolocation: 'Singapore, SG',
      deviceFingerprint: 'Chrome desktop / 203.0.113.37',
      velocity: '6 transactions / 8s',
      rules: [
        { label: 'Cognitive Behavioral Security Analysis', value: '94/100', detail: 'High-risk amount anomaly' },
        { label: 'High-Frequency Spending Anomaly Detected', value: '6 transactions / 8s', detail: '24x above normal transfer frequency' },
        { label: 'Geographic Risk Pattern', value: 'Cross-border risk', detail: 'Login mismatch with onboarded IP' }
      ]
    },
    {
      id: 'case-4033',
      customer: 'Theo Brooks',
      account: 'CHK-1302',
      amount: 960,
      severity: 'LOW',
      status: 'Resolved',
      timestamp: '2026-11-05T07:41:00Z',
      geolocation: 'Austin, US',
      deviceFingerprint: 'Samsung S23 / 10.10.8.12',
      velocity: '1 transaction / 2m',
      rules: [
        { label: 'Cognitive Behavioral Security Analysis', value: '23/100', detail: 'Within expected thresholds' },
        { label: 'High-Frequency Spending Anomaly Detected', value: '1 transaction / 2m', detail: 'Normal user pattern' },
        { label: 'Device Health', value: 'Verified', detail: 'Known device and geolocation match' }
      ]
    }
  ],
  accounts: [
    {
      id: 'checking',
      name: 'FutureTrust Premier Checking',
      type: 'Personal',
      balance: '$84,240.18',
      kyc: 'Verified',
      status: 'Active',
      limit: '$25,000',
      cards: [
        { id: 'card-1', label: 'Virtual card ••• 4821', enabled: true },
        { id: 'card-2', label: 'Travel card ••• 2045', enabled: false }
      ],
      transactions: [
        { id: 'CHK-3251', description: 'Payroll deposit', amount: '+$7,300.00', time: '09:41 AM' },
        { id: 'CHK-3252', description: 'Vendor ACH', amount: '-$820.00', time: 'Yesterday' },
        { id: 'CHK-3253', description: 'Card settlement', amount: '+$1,280.00', time: 'Mon' }
      ]
    },
    {
      id: 'savings',
      name: 'FutureTrust High-Yield Treasury Vault',
      type: 'High Yield',
      balance: '$212,480.64',
      kyc: 'Verified',
      status: 'Active',
      limit: '$90,000',
      cards: [
        { id: 'card-3', label: 'Savings debit ••• 1164', enabled: true },
        { id: 'card-4', label: 'Premium reserve ••• 7789', enabled: true }
      ],
      transactions: [
        { id: 'SAV-1198', description: 'Interest payout', amount: '+$1,280.00', time: '08:14 AM' },
        { id: 'SAV-1199', description: 'Treasury transfer', amount: '-$4,500.00', time: 'Yesterday' },
        { id: 'SAV-1200', description: 'Auto-save sweep', amount: '+$900.00', time: 'Mon' }
      ]
    },
    {
      id: 'business',
      name: 'Commercial Operating Account',
      type: 'Commercial',
      balance: '$364,100.91',
      kyc: 'Enhanced Due Diligence',
      status: 'Review',
      limit: '$150,000',
      cards: [
        { id: 'card-5', label: 'Treasury card ••• 3200', enabled: true },
        { id: 'card-6', label: 'Vendor pay ••• 9451', enabled: false }
      ],
      transactions: [
        { id: 'BUS-7742', description: 'Payroll batch', amount: '-$42,200.00', time: '11:12 AM' },
        { id: 'BUS-7743', description: 'Wire incoming', amount: '+$18,420.00', time: 'Yesterday' },
        { id: 'BUS-7744', description: 'FX settlement', amount: '+$6,640.00', time: 'Mon' }
      ]
    }
  ],
  toasts: []
}

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    updateTransferField: (state, action) => {
      const { field, value } = action.payload
      state.transfer[field] = value
    },
    setTransferScenario: (state, action) => {
      const scenario = scenarioMap[action.payload]
      if (!scenario) return

      state.transfer.scenario = action.payload
      state.transfer.stage = scenario.stage
      state.transfer.saga = scenario.saga.map((step) => ({ ...step }))
      state.transfer.transferStatus = scenario.status
      state.toasts.push({
        id: Date.now(),
        title: `${scenario.label} loaded`,
        message: 'Simulation scenario is ready for review.',
        variant: 'info'
      })
    },
    setTransferStage: (state, action) => {
      const stageId = action.payload
      state.transfer.stage = stageId

      state.transfer.saga = state.transfer.saga.map((step) => {
        if (step.id === stageId) {
          return { ...step, status: 'active' }
        }

        if (step.status === 'active' || step.status === 'completed') {
          return { ...step, status: 'completed' }
        }

        return { ...step, status: 'pending' }
      })
    },
    updateSagaProgress: (state, action) => {
      const { stageId, transferStatus, details } = action.payload || {}
      if (!stageId) return

      state.transfer.stage = stageId
      if (transferStatus) {
        state.transfer.transferStatus = transferStatus
      }
      if (details) {
        state.alerts = [
          {
            title: 'Payment flow update',
            detail: details,
            time: 'just now',
            tone: 'blue'
          },
          ...state.alerts
        ].slice(0, 3)
      }

      const stageOrder = state.transfer.saga.map((step) => step.id)
      const stageIndex = stageOrder.indexOf(stageId)
      if (stageIndex < 0) return

      state.transfer.saga = state.transfer.saga.map((step, index) => {
        if (index < stageIndex) {
          return { ...step, status: 'completed' }
        }
        if (index === stageIndex) {
          return { ...step, status: 'active' }
        }
        return { ...step, status: 'pending' }
      })
    },
    submitTransfer: (state) => {
      state.transfer.transferStatus = 'Processing'
      state.transfer.saga = state.transfer.saga.map((step, index) => ({
        ...step,
        status: index === 0 ? 'completed' : index === 1 ? 'active' : 'pending'
      }))
      state.transfer.stage = 'kafka'
      state.toasts.push({
        id: Date.now(),
        title: 'Transfer queued',
        message: 'Secure payment orchestration is active across the trusted banking rail.',
        variant: 'success'
      })
    },
    addToast: (state, action) => {
      state.toasts.push({
        id: Date.now() + Math.random(),
        ...action.payload
      })
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload)
    },
    toggleVirtualCard: (state, action) => {
      const { accountId, cardId } = action.payload
      const account = state.accounts.find((entry) => entry.id === accountId)
      if (!account) return

      const card = account.cards.find((entry) => entry.id === cardId)
      if (!card) return

      card.enabled = !card.enabled
      state.toasts.push({
        id: Date.now(),
        title: card.enabled ? 'Card re-enabled' : 'Card frozen',
        message: `${card.label} has been ${card.enabled ? 'unfrozen' : 'frozen'} successfully.`,
        variant: card.enabled ? 'success' : 'warning'
      })
    },
    updateAccountLimit: (state, action) => {
      const { accountId, limit } = action.payload
      const account = state.accounts.find((entry) => entry.id === accountId)
      if (!account) return

      account.limit = limit
      state.toasts.push({
        id: Date.now(),
        title: 'Limit updated',
        message: `${account.name} now uses a ${limit} cap.`,
        variant: 'info'
      })
    },
    approveOverride: (state, action) => {
      const item = state.fraudCases.find((caseItem) => caseItem.id === action.payload)
      if (!item) return

      item.status = 'Approved'
      state.toasts.push({
        id: Date.now(),
        title: 'Override approved',
        message: `Case ${item.id} is now approved for manual review.` ,
        variant: 'success'
      })
    },
    freezeAccount: (state, action) => {
      const item = state.fraudCases.find((caseItem) => caseItem.id === action.payload)
      if (!item) return

      item.status = 'Frozen'
      state.toasts.push({
        id: Date.now(),
        title: 'Account frozen',
        message: `The account tied to ${item.customer} has been blocked temporarily.`,
        variant: 'warning'
      })
    },
    dismissCase: (state, action) => {
      const item = state.fraudCases.find((caseItem) => caseItem.id === action.payload)
      if (!item) return

      item.status = 'Dismissed'
      state.toasts.push({
        id: Date.now(),
        title: 'Alert dismissed',
        message: `Case ${item.id} was dismissed and archived for review.`,
        variant: 'info'
      })
    }
  }
})

export const {
  updateTransferField,
  setTransferScenario,
  setTransferStage,
  updateSagaProgress,
  submitTransfer,
  addToast,
  removeToast,
  toggleVirtualCard,
  updateAccountLimit,
  approveOverride,
  freezeAccount,
  dismissCase
} = dashboardSlice.actions

export default dashboardSlice.reducer
