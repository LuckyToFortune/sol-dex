import { AmmV3 } from '@raydium-io/raydium-sdk'

import { BN } from 'bn.js'

import { shakeUndifindedItem } from '@/functions/arrayMethods'
import assert from '@/functions/assert'
import { toHumanReadable } from '@/functions/format/toHumanReadable'
import toPubString from '@/functions/format/toMintString'
import { toTokenAmount } from '@/functions/format/toTokenAmount'
import { eq } from '@/functions/numberish/compare'
import { minus, mul } from '@/functions/numberish/operations'
import toBN from '@/functions/numberish/toBN'
import { toString } from '@/functions/numberish/toString'

import useNotification from '../notification/useNotification'
import { isToken2022 } from '../token/isToken2022'
import { openToken2022ClmmPositionConfirmPanel } from '../token/openToken2022ClmmPositionConfirmPanel'
import { getComputeBudgetConfig } from '../txTools/getComputeBudgetConfig'
import txHandler from '../txTools/handleTx'
import useWallet from '../wallet/useWallet'

import useConcentrated from './useConcentrated'

export const MANUAL_ADJUST = 0.985 // ask Rudy for detail

export default async function txDecreaseConcentrated(options?: { closePosition?: boolean }) {
  const { coin1, coin2, liquidity, targetUserPositionAccount, currentAmmPool, coin1Amount, coin2Amount } =
    useConcentrated.getState()
  // check token 2022
  const needConfirm = [
    targetUserPositionAccount?.tokenA,
    targetUserPositionAccount?.tokenB,
    ...(targetUserPositionAccount?.rewardInfos.map((i) => i.token) ?? [])
  ].some((i) => isToken2022(i) && i)
  let userHasConfirmed: boolean
  if (needConfirm) {
    const { hasConfirmed } = openToken2022ClmmPositionConfirmPanel({
      caseName: 'decrease',
      position: targetUserPositionAccount,
      positionAdditionalAmount: shakeUndifindedItem([
        toTokenAmount(coin1, coin1Amount, { alreadyDecimaled: true }),
        toTokenAmount(coin2, coin2Amount, { alreadyDecimaled: true })
      ])
    })
    userHasConfirmed = await hasConfirmed
  } else {
    userHasConfirmed = true
  }
  if (!userHasConfirmed) {
    useNotification.getState().logError('User Cancel', 'User has canceled token 2022 confirm')
    return
  }

  return txHandler(async ({ transactionCollector, baseUtils: { connection, owner, allTokenAccounts } }) => {
    const {
      coin1,
      coin2,
      liquidity,
      targetUserPositionAccount,
      currentAmmPool,
      coin1AmountMin,
      coin2AmountMin,
      coin1AmountFee,
      coin2AmountFee
    } = useConcentrated.getState()
    const { tokenAccountRawInfos } = useWallet.getState()
    assert(currentAmmPool, 'not seleted amm pool')
    assert(coin1, 'not set coin1')
    assert(coin2, 'not set coin2')
    assert(coin1AmountMin, 'not set coin1AmountMin')
    assert(coin2AmountMin, 'not set coin2AmountMin')
    assert(liquidity != null, 'not set liquidity')
    assert(targetUserPositionAccount, 'not set targetUserPositionAccount')
    if (options?.closePosition) {
      const { innerTransactions } = await AmmV3.makeDecreaseLiquidityInstructionSimple({
        connection: connection,
        liquidity,
        poolInfo: currentAmmPool.state,
        ownerInfo: {
          feePayer: owner,
          wallet: owner,
          tokenAccounts: tokenAccountRawInfos,
          useSOLBalance: true,
          closePosition: eq(targetUserPositionAccount.sdkParsed.liquidity, liquidity)
        },
        ownerPosition: targetUserPositionAccount.sdkParsed,
        computeBudgetConfig: await getComputeBudgetConfig(),
        checkCreateATAOwner: true,
        amountMinA: toBN(minus(coin1AmountMin, mul(coin1AmountFee ?? 0, MANUAL_ADJUST)), coin1.decimals), // TODO fix
        amountMinB: toBN(minus(coin2AmountMin, mul(coin2AmountFee ?? 0, MANUAL_ADJUST)), coin2.decimals) // TODO fix
      })
      transactionCollector.add(innerTransactions, {
        txHistoryInfo: {
          title: 'Position Closed',
          description: `close ${toPubString(targetUserPositionAccount.poolId).slice(0, 6)} position`
        }
      })
    } else {
      assert(coin1AmountMin, 'not set coin1AmountMin')
      assert(coin2AmountMin, 'not set coin2AmountMin')
      const { innerTransactions } = await AmmV3.makeDecreaseLiquidityInstructionSimple({
        connection: connection,
        liquidity,
        poolInfo: currentAmmPool.state,
        ownerInfo: {
          feePayer: owner,
          wallet: owner,
          tokenAccounts: tokenAccountRawInfos,
          useSOLBalance: true,
          closePosition: eq(targetUserPositionAccount.sdkParsed.liquidity, liquidity)
        },
        amountMinA: toBN(minus(coin1AmountMin, mul(coin1AmountFee ?? 0, MANUAL_ADJUST)), coin1.decimals), // TODO fix
        amountMinB: toBN(minus(coin2AmountMin, mul(coin2AmountFee ?? 0, MANUAL_ADJUST)), coin2.decimals), // TODO fix
        // slippage: Number(toString(slippageTolerance)),
        ownerPosition: targetUserPositionAccount.sdkParsed,
        computeBudgetConfig: await getComputeBudgetConfig(),
        checkCreateATAOwner: true
      })
      transactionCollector.add(innerTransactions, {
        txHistoryInfo: {
          title: 'Liquidity Removed',
          description: `Removed ${toString(coin1AmountMin)} ${coin1.symbol} and ${toString(coin2AmountMin)} ${coin2.symbol
            } from ${toPubString(targetUserPositionAccount.poolId).slice(0, 6)}`
        }
      })
    }
  })
}
