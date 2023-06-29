import useNotification from '@/application/notification/useNotification'
import { AddressItem } from '@/components/AddressItem'
import { AsyncAwait } from '@/components/AsyncAwait'
import AutoBox from '@/components/AutoBox'
import CoinAvatar from '@/components/CoinAvatar'
import CoinAvatarPair from '@/components/CoinAvatarPair'
import Col from '@/components/Col'
import Grid from '@/components/Grid'
import Icon from '@/components/Icon'
import Row from '@/components/Row'
import Tooltip from '@/components/Tooltip'
import toPubString from '@/functions/format/toMintString'
import toPercentString from '@/functions/format/toPercentString'
import { isMeaningfulNumber } from '@/functions/numberish/compare'
import { toString } from '@/functions/numberish/toString'
import { MayArray } from '@/types/generics'
import useAppSettings from '../common/useAppSettings'
import { HydratedConcentratedInfo, UserPositionAccount } from '../concentrated/type'
import { getConcentratedPositionFee } from './getConcentratedPositionFee'

type HasConfirmState = Promise<boolean>

/**
 * not just data, also ui
 */
export function openToken2022ClmmHavestConfirmPanel(payload: {
  ammPool: MayArray<HydratedConcentratedInfo | undefined>
  onCancel?(): void
  onConfirm?(): void
}): {
  hasConfirmed: HasConfirmState
} {
  let resolve: (value: boolean | PromiseLike<boolean>) => void
  let reject: (reason?: any) => void
  const hasConfirmed = new Promise<boolean>((res, rej) => {
    resolve = res
    reject = rej
  })
  const infos = getConcentratedPositionFee({ ammPool: payload.ammPool })

  useNotification.getState().popConfirm({
    cardWidth: 'lg',
    type: 'warning',
    title: 'Confirm Token 2022',
    description: 'balabalabala. Confirm this token before transaction.',
    additionalContent: ({ updateConfig }) => (
      <div className="space-y-2 text-left w-full">
        <AsyncAwait
          promise={infos}
          fallback="loading..."
          onFullfilled={(solved) =>
            updateConfig({ disableConfirmButton: false, disableAdditionalContent: solved.size === 0 })
          }
        >
          {(infos) => (
            <Col className="space-y-2 max-h-[50vh] overflow-auto">
              {[...infos.entries()].map(([pool, value]) => (
                <div key={toPubString(pool.id)} className="flex items-center justify-between">
                  <div className="text-sm w-full">
                    {[...value.entries()].map(([position, feeInfos]) => (
                      <div key={toPubString(position.nftMint)} className="py-2">
                        <div className="py-2">
                          <CoinAvatarInfoItem ammPool={pool} position={position} />
                        </div>

                        <div className="flex-grow px-6 border-1.5 border-[rgba(171,196,255,.5)] rounded-xl">
                          {feeInfos.map(({ type, feeInfo }, idx) =>
                            feeInfo && isMeaningfulNumber(feeInfo?.amount) ? (
                              <Col key={type + idx} className="py-4 gap-1 items-start">
                                <div className="text-lg mobile:text-base font-semibold">
                                  {feeInfo.amount.token.symbol}
                                </div>
                                <div>
                                  {toString(feeInfo.amount)} - {toString(feeInfo.fee)} fee = {toString(feeInfo.pure)}
                                </div>
                              </Col>
                            ) : undefined
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Col>
          )}
        </AsyncAwait>
      </div>
    ),
    confirmButtonIsMainButton: true,
    disableConfirmButton: true,
    cancelButtonText: 'Cancel',
    confirmButtonText: 'Confirm',
    onConfirm: () => {
      resolve(true)
      payload.onConfirm?.()
    },
    onCancel: () => {
      resolve(false)
      payload.onCancel?.()
    }
  })

  return { hasConfirmed }
}

function CoinAvatarInfoItem({
  ammPool,
  position
}: {
  ammPool: HydratedConcentratedInfo
  position: UserPositionAccount
}) {
  const isMobile = useAppSettings((s) => s.isMobile)

  const maxAcceptPriceDecimal = 15

  const maxSignificantCount = (decimals: number) => Math.min(decimals + 2, maxAcceptPriceDecimal)

  return (
    <Row className="gap-4">
      <AutoBox is={isMobile ? 'Col' : 'Row'} className="clickable flex-wrap items-center mobile:items-start">
        <CoinAvatarPair
          className="justify-self-center mr-2"
          size={isMobile ? 'sm' : 'md'}
          token1={ammPool.base}
          token2={ammPool.quote}
        />
        <Row className="mobile:text-xs font-medium mobile:mt-px items-center flex-wrap gap-2">
          <Col>
            <Row className="items-center text-[#abc4ff]">
              <div>{ammPool.name}</div>
              <Tooltip>
                <Icon iconClassName="ml-1" size="sm" heroIconName="information-circle" />
                <Tooltip.Panel>
                  <div className="max-w-[300px] space-y-1.5">
                    {[ammPool?.base, ammPool?.quote].map((token, idx) =>
                      token ? (
                        <Row key={idx} className="gap-2">
                          <CoinAvatar size={'xs'} token={token} />
                          <AddressItem
                            className="grow"
                            showDigitCount={5}
                            addressType="token"
                            canCopy
                            canExternalLink
                            textClassName="flex text-xs text-[#abc4ff] justify-start "
                            iconClassName="text-[#abc4ff]"
                          >
                            {toPubString(token.mint)}
                          </AddressItem>
                        </Row>
                      ) : null
                    )}
                  </div>
                </Tooltip.Panel>
              </Tooltip>
            </Row>
            <div className="font-medium text-xs text-[#ABC4FF]/50">Fee {toPercentString(ammPool.tradeFeeRate)}</div>
          </Col>
        </Row>
      </AutoBox>

      <Grid className="items-center text-white mobile:text-sm">
        {toString(position.priceLower, {
          decimalLength: maxAcceptPriceDecimal,
          maxSignificantCount: maxSignificantCount(6)
        })}{' '}
        -{' '}
        {toString(position?.priceUpper, {
          decimalLength: maxAcceptPriceDecimal,
          maxSignificantCount: maxSignificantCount(6)
        })}
      </Grid>
    </Row>
  )
}
