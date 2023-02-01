import { useEffect } from 'react'

import useAppSettings from '@/application/common/useAppSettings'
import useWallet from '@/application/wallet/useWallet'
import useToggle from '@/hooks/useToggle'

import { AddressItem } from '../AddressItem'
import Button from '../Button'
import { FadeIn } from '../FadeIn'
import Icon from '../Icon'
import PageLayoutPopoverDrawer from '../PageLayoutPopoverDrawer'
import Row from '../Row'
import { RowItem } from '../RowItem'
import Switcher from '../Switcher'
import { TxVersion } from '@raydium-io/raydium-sdk'

/** this should be used in ./Navbar.tsx */
export default function WalletWidget() {
  const isMobile = useAppSettings((s) => s.isMobile)
  const txVersion = useWallet((s) => s.txVersion)
  const [isCopied, { delayOff, on }] = useToggle()

  useEffect(() => {
    if (isCopied) delayOff()
  }, [isCopied])

  const { owner: publicKey, disconnect, connected } = useWallet()

  return (
    <PageLayoutPopoverDrawer
      canOpen={connected} // should use more common disable
      alwaysPopper
      popupPlacement="bottom-right"
      renderPopoverContent={({ close: closePanel }) => (
        <>
          <div className="pt-3 -mb-1 mobile:mb-2 px-6 text-[rgba(171,196,255,0.5)] text-xs mobile:text-sm">
            CONNECTED WALLET
          </div>
          <div className="gap-3 space-y-1.5">
            <FadeIn ignoreEnterTransition>
              <AddressItem
                textClassName="text-white"
                showDigitCount={7}
                className="py-4 px-6 border-[rgba(171,196,255,0.2)]"
              >
                {publicKey}
              </AddressItem>
            </FadeIn>
            <Row className="items-center px-6 justify-between">
              <div className="text-[#abc4ff]">useV0</div>
              <Switcher
                checked={txVersion === TxVersion.V0}
                onToggle={(checked) => useWallet.setState({ txVersion: checked ? TxVersion.V0 : TxVersion.LEGACY })}
              />
            </Row>
            <RowItem
              textClassName="text-white"
              className="py-4 px-6 border-[rgba(171,196,255,0.2)] cursor-pointer clickable clickable-filter-effect"
              prefix={<Icon className="mr-3" size="sm" iconSrc="/icons/misc-recent-transactions.svg" />}
              text="Recent Transactions"
              onClick={() => {
                useAppSettings.setState({ isRecentTransactionDialogShown: true })
                closePanel?.()
              }}
            />
            <RowItem
              textClassName="text-white"
              className="py-4 px-6 border-[rgba(171,196,255,0.2)] cursor-pointer clickable clickable-filter-effect"
              prefix={<Icon className="mr-3" size="sm" iconSrc="/icons/misc-disconnect-wallet.svg" />}
              text="Disconnect wallet"
              onClick={() => {
                disconnect()
                closePanel?.()
              }}
            />
          </div>
        </>
      )}
    >
      {isMobile ? (
        <Button
          className="frosted-glass frosted-glass-teal rounded-lg p-2"
          onClick={() => {
            if (!publicKey) useAppSettings.setState({ isWalletSelectorShown: true })
          }}
        >
          <Icon
            className="w-4 h-4"
            iconClassName="w-4 h-4"
            iconSrc={connected ? '/icons/msic-wallet-connected.svg' : '/icons/msic-wallet.svg'}
          />
        </Button>
      ) : (
        <Button
          className="frosted-glass frosted-glass-teal"
          onClick={() => {
            if (!publicKey) useAppSettings.setState({ isWalletSelectorShown: true })
          }}
        >
          {connected ? (
            <Row className="items-center gap-3 my-0.5">
              <Icon size="sm" iconSrc="/icons/msic-wallet-connected.svg" />
              <div className="text-sm font-medium text-white">
                {String(publicKey).slice(0, 5)}...{String(publicKey).slice(-5)}
              </div>
            </Row>
          ) : (
            <Row className="items-center gap-3 my-0.5">
              <Icon size="sm" iconSrc="/icons/msic-wallet.svg" />
              <div className="text-sm font-medium text-[#39D0D8]">Connect Wallet</div>
            </Row>
          )}
        </Button>
      )}
    </PageLayoutPopoverDrawer>
  )
}
