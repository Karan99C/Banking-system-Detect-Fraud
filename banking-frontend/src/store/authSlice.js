import { createSlice } from '@reduxjs/toolkit'

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('futuretrust_user')
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    return null
  }
}

const getInitialAuthState = () => {
  const token = localStorage.getItem('futuretrust_token') || localStorage.getItem('banking_token')
  const user = readStoredUser()

  return {
    token,
    user,
    isAuthenticated: Boolean(token)
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialAuthState(),
  reducers: {
    loginSuccess: (state, action) => {
      const { token, user } = action.payload
      state.token = token
      state.user = user
      state.isAuthenticated = true

      localStorage.setItem('futuretrust_token', token)
      localStorage.setItem('banking_token', token)
      localStorage.setItem('futuretrust_user', JSON.stringify(user))
    },
    logout: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false

      localStorage.removeItem('futuretrust_token')
      localStorage.removeItem('banking_token')
      localStorage.removeItem('futuretrust_user')
    }
  }
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
