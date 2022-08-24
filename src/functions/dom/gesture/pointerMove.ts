import { AnyFn } from '@/types/constants'
import { addEventListener, EventListenerController } from '../addEventListener'

type DeltaTranslate2D = {
  dx: number
  dy: number
}
type SpeedVector = {
  x: number
  y: number
}

let eventId = 1
const eventIdMap = new Map<number, { el: Element; eventName: string; fn: AnyFn }>()

export type AttachPointerMovePointDownFn<El extends Element> = (utilities: {
  el: El
  ev: PointerEvent
  pointEvents: PointerEvent[]
}) => void

export type AttachPointerMovePointMoveFn<El extends Element> = (utilities: {
  el: El
  ev: PointerEvent
  pointEvents: PointerEvent[]
  currentDelta: DeltaTranslate2D
  totalDelta: DeltaTranslate2D
  isFirstEvent: boolean
}) => void

export type AttachPointerMovePointUpFn<El extends Element> = (utilities: {
  el: El
  ev: PointerEvent
  pointEvents: PointerEvent[]
  currentDelta: DeltaTranslate2D
  totalDelta: DeltaTranslate2D
  currentSpeed: SpeedVector
}) => void

export type AttachPointerMoveOptions<El extends Element> = {
  start?: AttachPointerMovePointDownFn<El>
  move?: AttachPointerMovePointMoveFn<El>
  end?: AttachPointerMovePointUpFn<El>
}

/**
 * listen to element' pointermove(pointerDown + pointerMove + pointerUp) clean event automaticly
 * @param el target element
 * @param options
 */
export function attachPointerMove<El extends Element>(el: El, options: AttachPointerMoveOptions<El>) {
  const eventsQueue: { ev: PointerEvent; type: 'pointerDown' | 'pointerMove' | 'pointerUp' }[] = []
  let pointDownController: EventListenerController | null = null
  let pointMoveController: EventListenerController | null = null
  let pointUpController: EventListenerController | null = null

  function pointerDown(ev: PointerEvent) {
    if (!eventsQueue.length) {
      eventsQueue.push({ ev, type: 'pointerDown' })
      options.start?.({ el: ev.target as El, ev, pointEvents: eventsQueue.map(({ ev }) => ev) })
      pointMoveController = addEventListener(el, 'pointermove', ({ ev }) => pointerMove(ev), {
        passive: true,
        onlyTargetIsSelf: true
      })
      pointUpController = addEventListener(el, 'pointerup', ({ ev }) => pointerUp(ev), {
        passive: true,
        once: true,
        onlyTargetIsSelf: true
      })
      el?.setPointerCapture(ev.pointerId)
      ev.stopPropagation()
    }
  }

  function pointerMove(ev: PointerEvent) {
    const lastEvent = eventsQueue[eventsQueue.length - 1]?.ev
    if (eventsQueue.length && ev.pointerId === lastEvent.pointerId) {
      const deltaX = ev.clientX - lastEvent.clientX
      const deltaY = ev.clientY - lastEvent.clientY
      const eventStart = eventsQueue[0]?.ev
      const totalDeltaX = ev.clientX - eventStart.clientX
      const totalDeltaY = ev.clientY - eventStart.clientY
      const haveNoExistPointMove = eventsQueue.every(({ type }) => type !== 'pointerMove')
      eventsQueue.push({ ev, type: 'pointerMove' })
      options.move?.({
        el: ev.target as El,
        ev,
        pointEvents: eventsQueue.map(({ ev }) => ev),
        currentDelta: { dx: deltaX, dy: deltaY },
        totalDelta: { dx: totalDeltaX, dy: totalDeltaY },
        isFirstEvent: haveNoExistPointMove
      })
    }
  }

  function pointerUp(ev: PointerEvent) {
    const lastEvent = eventsQueue[eventsQueue.length - 1]?.ev
    if (eventsQueue.length && ev.pointerId === lastEvent.pointerId) {
      eventsQueue.push({ ev, type: 'pointerUp' })
      const eventNumber = 4
      const nearPoint = eventsQueue[eventsQueue.length - eventNumber]?.ev ?? eventsQueue[0]?.ev
      const deltaX = ev.clientX - nearPoint.clientX
      const deltaY = ev.clientY - nearPoint.clientY
      const deltaTime = ev.timeStamp - nearPoint.timeStamp
      const eventStart = eventsQueue[0].ev
      const totalDeltaX = ev.clientX - eventStart.clientX
      const totalDeltaY = ev.clientY - eventStart.clientY
      options.end?.({
        el: ev.target as El,
        ev,
        pointEvents: eventsQueue.map(({ ev }) => ev),
        currentDelta: { dx: deltaX, dy: deltaY },
        currentSpeed: {
          x: deltaX / deltaTime || 0,
          y: deltaY / deltaTime || 0
        },
        totalDelta: { dx: totalDeltaX, dy: totalDeltaY }
      })
      eventsQueue.splice(0, eventsQueue.length)
      pointMoveController?.cancel()
    }
  }

  pointDownController = addEventListener(el, 'pointerdown', ({ ev }) => pointerDown(ev), { onlyTargetIsSelf: true })
  eventIdMap.set(eventId++, { el, eventName: 'pointerdown', fn: pointerDown })
  return {
    eventId,
    pointDownController,
    pointMoveController,
    pointUpController,
    detatch() {
      cancelPointerMove(eventId)
    }
  }
}

export function cancelPointerMove(id: number | undefined) {
  if (!id || !eventIdMap.has(id)) return
  const { el, eventName, fn } = eventIdMap.get(id)!
  el.removeEventListener(eventName, fn)
  eventIdMap.delete(id)
}
