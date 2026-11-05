import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { transactionApi } from '../services/api'

export const initiateTransfer = createAsyncThunk('transaction/initiateTransfer', async (payload, { rejectWithValue }) => {
  try {
    return await transactionApi.initiateTransfer(payload)
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to initiate transfer')
  }
})

export const fetchTransactionHistory = createAsyncThunk('transaction/fetchTransactionHistory', async (accountId, { rejectWithValue }) => {
  try {
    return await transactionApi.fetchTransactionHistory(accountId)
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to fetch transaction history')
  }
})

const initialState = {
  transactions: [],
  pendingTransfer: null,
  status: 'idle',
  error: null
}

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    clearPendingTransfer: (state) => {
      state.pendingTransfer = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initiateTransfer.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(initiateTransfer.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.pendingTransfer = action.payload
      })
      .addCase(initiateTransfer.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        state.transactions = action.payload
      })
  }
})

export const { clearPendingTransfer } = transactionSlice.actions

export default transactionSlice.reducer
