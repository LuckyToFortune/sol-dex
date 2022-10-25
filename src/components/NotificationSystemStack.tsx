import { ReactNode, useEffect, useMemo, useState } from 'react'

import useAppSettings from '@/application/common/useAppSettings'
import useNotification from '@/application/notification/useNotification'

import ConfirmDialog, { ConfirmDialogInfo } from '../pageComponents/dialogs/ConfirmDialog'
import WelcomeBetaDialog from '../pageComponents/dialogs/WelcomeBetaDialog'

import Col from './Col'
import LinkExplorer from './LinkExplorer'
import NotificationItem from './NotificationItem'
import { NormalNotificationItemInfo, TxNotificationItemInfo } from './NotificationItem/type'

//#region ------------------- core definition -------------------
type PopInfo =
  | {
      is: 'notificationItem'
      info: NormalNotificationItemInfo
    }
  | {
      is: 'txItem(s)'
      info: TxNotificationItemInfo
    }
  | {
      is: 'confirmDialog'
      info: ConfirmDialogInfo
    }
  | {
      is: 'welcomeDialog'
      info: { content: ReactNode; onConfirm?: () => void }
    }

export default function NotificationSystemStack() {
  const [stack, setStack] = useState<PopInfo[]>([])
  const isMobile = useAppSettings((s) => s.isMobile)
  const explorerName = useAppSettings((s) => s.explorerName)

  //
  const notificationItemInfos = useMemo(
    () =>
      stack.filter((i) => i.is === 'notificationItem' || i.is === 'txItem(s)').map((i) => i.info) as (
        | NormalNotificationItemInfo
        | TxNotificationItemInfo
      )[],
    [stack]
  )
  const confirmDialogInfos = useMemo(
    () => stack.filter((i) => i.is === 'confirmDialog').map((i) => i.info) as ConfirmDialogInfo[],
    [stack]
  )
  const popDialogInfos = useMemo(
    () =>
      stack.filter((i) => i.is === 'welcomeDialog').map((i) => i.info) as {
        content: ReactNode
        onConfirm?: () => void
      }[],
    [stack]
  )
  useEffect(() => {
    const log = (info: NormalNotificationItemInfo) => {
      setStack((s) => s.concat({ is: 'notificationItem', info }))
    }
    const logTxs = (info: TxNotificationItemInfo) => {
      setStack((s) => s.concat({ is: 'txItem(s)', info }))
    }
    const popConfirm = (info: ConfirmDialogInfo) => {
      setStack((s) => s.concat({ is: 'confirmDialog', info }))
    }

    useNotification.setState({
      log,
      logTxid(txid: string, title?: string, options?: { isSuccess?: boolean }) {
        log({
          type: options?.isSuccess ? 'success' : 'info',
          title: title ?? 'Transaction sent',
          description: (
            <div>
              View on <LinkExplorer hrefDetail={`tx/${txid}`}>{explorerName}</LinkExplorer>
            </div>
          )
        })
      },
      logError(title: string | Error | unknown, description?: ReactNode) {
        const errorTitle = title instanceof Error ? title.name : title ? String(title) : ''
        const errorDescription = title instanceof Error ? title.message : description ? String(description) : undefined
        log({ type: 'error', title: errorTitle, description: errorDescription })
      },
      logWarning(title: string, description?: ReactNode) {
        log({ type: 'warning', title, description })
      },
      logSuccess(title: string, description?: ReactNode) {
        log({ type: 'success', title, description })
      },
      logInfo(title: string, description?: ReactNode) {
        log({ type: 'info', title, description })
      },
      popConfirm,
      popWelcomeDialog(content, { onConfirm }: { onConfirm?: () => void } = {}) {
        setStack((s) => s.concat({ is: 'welcomeDialog', info: { content, onConfirm } }))
      }
    })
  }, [explorerName])

  return (
    <>
      <Col
        className="items-end mobile:items-stretch pointer-events-none"
        style={{
          position: 'fixed',
          right: isMobile ? 'unset' : '0',
          bottom: isMobile ? 'unset' : '0',
          top: isMobile ? '0' : 'unset',
          left: isMobile ? '0' : 'unset',
          zIndex: 9999
        }}
      >
        {notificationItemInfos.map((info, idx) => (
          <NotificationItem key={idx} {...info} />
        ))}
      </Col>
      {confirmDialogInfos.map((info, idx) => (
        <ConfirmDialog key={idx} {...info} />
      ))}
      {popDialogInfos.map((info, idx) => (
        <WelcomeBetaDialog key={idx} content={info.content} onConfirm={info.onConfirm} />
      ))}
    </>
  )
}
