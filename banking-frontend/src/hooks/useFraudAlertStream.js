import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { apiBaseUrl, mockData } from '../services/api'
import { receiveFraudAlert } from '../store/fraudAlertSlice'

export function useFraudAlertStream(enabled = true) {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    let eventSource = null
    let timer = null

    const emitMockAlert = () => {
      const alert = mockData.fraudAlerts[Math.floor(Math.random() * mockData.fraudAlerts.length)]

      dispatch(
        receiveFraudAlert({
          ...alert,
          id: `${alert.id}-${Date.now()}`,
          timestamp: new Date().toISOString()
        })
      )
    }

    try {
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        emitMockAlert()
        timer = window.setInterval(emitMockAlert, 20000)
        return () => window.clearInterval(timer)
      }

      eventSource = new EventSource(`${apiBaseUrl}/fraud/stream`)

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          dispatch(receiveFraudAlert(payload))
        } catch (error) {
          dispatch(receiveFraudAlert({ id: `alert-${Date.now()}`, message: event.data, timestamp: new Date().toISOString() }))
        }
      }

      eventSource.onerror = () => {
        emitMockAlert()
        if (eventSource.readyState === EventSource.CLOSED) {
          eventSource.close()
        }
      }

      return () => {
        eventSource.close()
        if (timer) {
          window.clearInterval(timer)
        }
      }
    } catch (error) {
      emitMockAlert()
      timer = window.setInterval(emitMockAlert, 20000)
      return () => window.clearInterval(timer)
    }
  }, [dispatch, enabled])
}

export default useFraudAlertStream
