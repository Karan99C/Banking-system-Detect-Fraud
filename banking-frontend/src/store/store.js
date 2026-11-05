import { configureStore } from '@reduxjs/toolkit'
import accountReducer from './accountSlice'
import authReducer from './authSlice'
import dashboardReducer from './dashboardSlice'
import fraudAlertReducer from './fraudAlertSlice'
import transactionReducer from './transactionSlice'

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    account: accountReducer,
    transaction: transactionReducer,
    fraudAlert: fraudAlertReducer,
    auth: authReducer
  }
})
