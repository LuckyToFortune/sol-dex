import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'

import { Price } from '@raydium-io/raydium-sdk'

import shallow from 'zustand/shallow'

import { unifyItem } from '@/functions/arrayMethods'
import jFetch from '@/functions/dom/jFetch'
import toTokenPrice from '@/functions/format/toTokenPrice'
import { lazyMap } from '@/functions/lazyMap'
import { useTransitionedEffect } from '@/hooks/useTransitionedEffect'
import { HexAddress } from '@/types/constants'

import useFarms from '../farms/useFarms'
import useLiquidity from '../liquidity/useLiquidity'
import useToken from '../token/useToken'
import useWallet from '../wallet/useWallet'

import { isPubEqual } from '@/functions/judgers/areEqual'
import useAppAdvancedSettings from '../common/useAppAdvancedSettings'
import { hydratedPairInfo } from './hydratedPairInfo'
import { JsonPairItemInfo } from './type'
import { usePools } from './usePools'

export default function usePoolsInfoLoader() {
  const jsonInfos = usePools((s) => s.jsonInfos, shallow)
  const rawJsonInfos = usePools((s) => s.rawJsonInfos)
  const liquidityJsonInfos = useLiquidity((s) => s.jsonInfos)
  const stableLiquidityJsonInfoLpMints = useMemo(
    () => unifyItem(liquidityJsonInfos.filter((j) => j.version === 5).map((j) => j.lpMint)),
    [liquidityJsonInfos]
  )

  const getLpToken = useToken((s) => s.getLpToken)
  const lpTokens = useToken((s) => s.lpTokens)
  const userCustomTokenSymbol = useToken((s) => s.userCustomTokenSymbol)
  const balances = useWallet((s) => s.balances)
  const { pathname } = useRouter()
  const refreshCount = usePools((s) => s.refreshCount)
  const farmRefreshCount = useFarms((s) => s.farmRefreshCount)
  const programIds = useAppAdvancedSettings((s) => s.programIds)
  const pairsUrl = useAppAdvancedSettings((s) => s.apiUrls.pairs)

  const fetchPairs = async () => {
    const pairJsonInfo = await jFetch<JsonPairItemInfo[]>(pairsUrl, {
      cacheFreshTime: 5 * 60 * 1000
    })
    if (!pairJsonInfo) return
    usePools.setState({
      jsonInfos: pairJsonInfo,
      rawJsonInfos: pairJsonInfo
    })
  }

  useTransitionedEffect(() => {
    fetchPairs()
  }, [refreshCount, farmRefreshCount, pairsUrl])

  // TODO: currently also fetch info when it's not
  useEffect(() => {
    if (!pathname.includes('/pools/') && !pathname.includes('/liquidity/')) return
    const timeoutId = setInterval(usePools.getState().refreshPools, 15 * 60 * 1000)
    return () => clearInterval(timeoutId)
  }, [pathname])

  const lpPrices = useMemo<Record<HexAddress, Price>>(
    () =>
      Object.fromEntries(
        rawJsonInfos
          .map((value) => {
            const token = lpTokens[value.lpMint]
            const price = token && value.lpPrice ? toTokenPrice(token, value.lpPrice, { alreadyDecimaled: true }) : null
            return [value.lpMint, price]
          })
          .filter(([lpMint, price]) => lpMint != null && price != null)
      ),
    [rawJsonInfos, lpTokens]
  )

  useEffect(() => {
    usePools.setState({ lpPrices })
  }, [lpPrices])

  useTransitionedEffect(async () => {
    // let costTotal = 0
    const hydratedInfos = await lazyMap({
      source: jsonInfos,

      sourceKey: 'pair jsonInfo',

      loopFn: (pair) => {
        // const startAt = performance.now()
        const result = hydratedPairInfo(pair, {
          lpToken: getLpToken(pair.lpMint),
          lpBalance: balances[String(pair.lpMint)],
          isStable: stableLiquidityJsonInfoLpMints.includes(pair.lpMint),
          isOpenBook: isPubEqual(
            liquidityJsonInfos.find((i) => i.id === pair.ammId)?.marketProgramId,
            programIds.OPENBOOK_MARKET
          ),
          userCustomTokenSymbol: userCustomTokenSymbol
        })
        // const cost = performance.now() - startAt
        // // console.log('cost: ', cost)
        // costTotal += cost
        return result
      },
      options: {
        oneGroupTasksSize: 16
      }
    })
    usePools.setState({ hydratedInfos, loading: hydratedInfos.length === 0 })
  }, [jsonInfos, getLpToken, balances, stableLiquidityJsonInfoLpMints, userCustomTokenSymbol])
}
