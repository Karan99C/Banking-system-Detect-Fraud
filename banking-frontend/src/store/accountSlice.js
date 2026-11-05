import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { accountApi } from '../services/api'

export const fetchAccounts = createAsyncThunk('account/fetchAccounts', async (_, { rejectWithValue }) => {
  try {
    return await accountApi.fetchAccounts()
  } catch (error) {
    return rejectWithValue(error.message || 'Unable to fetch accounts')
  }
})

export const fetchAccountById = createAsyncThunk('account/fetchAccountById', async (id, { rejectWithValue }) => {
  try {
    return await accountApi.fetchAccountById(id)
  } catch (error) {
    return rejectWithValue(error.message || `Unable to fetch account ${id}`)
  }
})

const initialState = {
  items: [],
  selectedAccount: null,
  status: 'idle',
  error: null
}

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(fetchAccountById.fulfilled, (state, action) => {
        state.selectedAccount = action.payload
      })
  }
})

export default accountSlice.reducer
