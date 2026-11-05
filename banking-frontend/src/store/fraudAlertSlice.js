import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { fraudApi } from '../services/api'

export const fetchFlaggedCases = createAsyncThunk('fraud/fetchFlaggedCases', async (_, { rejectWithValue }) => {
  try {
    return await fraudApi.fetchFlaggedCases()
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to fetch fraud cases')
  }
})

export const updateCaseStatus = createAsyncThunk('fraud/updateCaseStatus', async ({ id, action }, { rejectWithValue }) => {
  try {
    return await fraudApi.updateCaseStatus(id, action)
  } catch (error) {
    return rejectWithValue(error.message || `Unable to update case ${id}`)
  }
})

const initialState = {
  alerts: [],
  cases: [],
  status: 'idle',
  error: null
}

const fraudAlertSlice = createSlice({
  name: 'fraudAlert',
  initialState,
  reducers: {
    receiveFraudAlert: (state, action) => {
      const alert = action.payload
      if (!alert) {
        return
      }

      state.alerts = [alert, ...state.alerts].slice(0, 12)
    },
    clearFraudAlerts: (state) => {
      state.alerts = []
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlaggedCases.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchFlaggedCases.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.cases = action.payload
      })
      .addCase(fetchFlaggedCases.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(updateCaseStatus.fulfilled, (state, action) => {
        const nextStatus = action.payload?.status
        if (!nextStatus) {
          return
        }

        state.cases = state.cases.map((item) => (
          item.id === action.payload.id ? { ...item, status: nextStatus } : item
        ))
      })
  }
})

export const { receiveFraudAlert, clearFraudAlerts } = fraudAlertSlice.actions

export default fraudAlertSlice.reducer
