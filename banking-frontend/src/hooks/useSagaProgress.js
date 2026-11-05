import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { apiBaseUrl, mockData } from '../services/api'
import { updateSagaProgress } from '../store/dashboardSlice'

export function useSagaProgress(transactionId, enabled = true) {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!enabled || !transactionId) {
      return undefined
    }

    let eventSource = null
    let timer = null
    let stepIndex = 0

    const emitMockProgress = () => {
      const step = mockData.sagaStages[stepIndex]
      if (!step) {
        return
      }

      dispatch(
        updateSagaProgress({
          transactionId: step.transactionId || transactionId,
          stageId: step.stageId,
          transferStatus: step.transferStatus,
          details: step.details
        })
      )

      stepIndex += 1
    }

    try {
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        emitMockProgress()
        timer = window.setInterval(() => {
          emitMockProgress()
          if (stepIndex >= mockData.sagaStages.length) {
            window.clearInterval(timer)
          }
        }, 3000)

        return () => window.clearInterval(timer)
      }

      eventSource = new EventSource(`${apiBaseUrl}/transactions/${transactionId}/stream`)

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          dispatch(updateSagaProgress(payload))
        } catch (error) {
          dispatch(
            updateSagaProgress({
              transactionId,
              stageId: 'fraud',
              transferStatus: 'FRAUD_EVALUATED',
              details: event.data
            })
          )
        }
      }

      eventSource.onerror = () => {
        emitMockProgress()
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
      emitMockProgress()
      timer = window.setInterval(() => {
        emitMockProgress()
        if (stepIndex >= mockData.sagaStages.length) {
          window.clearInterval(timer)
        }
      }, 3000)

      return () => window.clearInterval(timer)
    }
  }, [dispatch, enabled, transactionId])
}

export default useSagaProgress
