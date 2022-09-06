import { LiquidityPoolJsonInfo as ConcentratedJsonInfo, PublicKeyish } from '@raydium-io/raydium-sdk'
import create from 'zustand'

import toPubString from '@/functions/format/toMintString'
import { gte } from '@/functions/numberish/compare'
import { div } from '@/functions/numberish/operations'
import { AmmPoolInfo, ApiAmmPoolInfo, ApiAmmPoint } from 'test-r-sdk'
import { toDataMint, WSOLMint } from '../token/quantumSOL'
import { SplToken } from '../token/type'
import {
  ETHMint,
  mSOLMint,
  PAIMint,
  RAYMint,
  stSOLMint,
  USDCMint,
  USDHMint,
  USDTMint
} from '../token/wellknownToken.config'
import sdkParseJsonConcentratedInfo from './sdkParseJsonConcentratedInfo'
import { HydratedConcentratedInfo, SDKParsedConcentratedInfo } from './type'

type SDKParsedAmmPool = {
  state: AmmPoolInfo
}

type SDKParsedAmmPoolsMap = Record<string, SDKParsedAmmPool>

export type ConcentratedStore = {
  apiAmmPools: ApiAmmPoolInfo[]
  sdkParsedAmmPools: SDKParsedAmmPoolsMap
  currentAmmPool?: SDKParsedAmmPool
  /** user need manually select one */
  selectableAmmPools?: SDKParsedAmmPool[]
  chartPoints?: ApiAmmPoint[]
  /********************** caches (at least includes exhibition's data) **********************/
  /**
   *  pure data (just string, number, boolean, undefined, null)
   */
  jsonInfos: ConcentratedJsonInfo[]
  officialIds: Set<ConcentratedJsonInfo['id']>
  unOfficialIds: Set<ConcentratedJsonInfo['id']>

  /**
   *  additionally add 'SDK parsed data' (BN, PublicKey, etc.)
   */
  sdkParsedInfos: SDKParsedConcentratedInfo[] // auto parse info in {@link useConcentratedAuto}

  /**
   * additionally add 'hydrated data' (shorcuts data or customized data)
   * !important: only if pool is in userExhibitionConcentratedIds
   */
  hydratedInfos: HydratedConcentratedInfo[] // auto parse info in {@link useConcentratedAuto}
  findConcentratedInfoByTokenMint: (
    coin1Mint: PublicKeyish | undefined,
    coin2Mint: PublicKeyish | undefined
  ) => Promise<{
    availables: ConcentratedJsonInfo[]
    best: ConcentratedJsonInfo | undefined
    routeRelated: ConcentratedJsonInfo[]
  }>

  /********************** exhibition panel **********************/
  userExhibitionConcentratedIds: string[]

  /********************** main panel (coin pair panel) **********************/
  currentJsonInfo: ConcentratedJsonInfo | undefined
  currentSdkParsedInfo: SDKParsedConcentratedInfo | undefined // auto parse info in {@link useConcentratedAuto}
  currentHydratedInfo: HydratedConcentratedInfo | undefined // auto parse info in {@link useConcentratedAuto}

  searchText: string

  coin1: SplToken | undefined

  /** with slippage */
  coin1Amount?: string // for coin may be not selected yet, so it can't be TokenAmount
  unslippagedCoin1Amount?: string // for coin may be not selected yet, so it can't be TokenAmount

  coin2: SplToken | undefined

  /** with slippage */
  coin2Amount?: string // for coin may be not selected yet, so it can't be TokenAmount
  unslippagedCoin2Amount?: string // for coin may be not selected yet, so it can't be TokenAmount

  focusSide: 'coin1' | 'coin2' // not reflect ui placement.  maybe coin1 appears below coin2
  isRemoveDialogOpen: boolean
  isSearchAmmDialogOpen: boolean
  removeAmount: string
  scrollToInputBox: () => void

  // just for trigger refresh
  refreshCount: number
  refreshConcentrated: () => void
}

//* FAQ: why no setJsonInfos, setSdkParsedInfos and setHydratedInfos? because they are not very necessary, just use zustand`set` and zustand`useConcentrated.setState()` is enough
const useConcentrated = create<ConcentratedStore>((set, get) => ({
  apiAmmPools: [],
  sdkParsedAmmPools: {},

  /********************** caches (at least includes exhibition's data) **********************/
  /**
   *  pure data (just string, number, boolean, undefined, null)
   */
  jsonInfos: [],
  officialIds: new Set(),
  unOfficialIds: new Set(),
  /**
   *  additionally add 'SDK parsed data' (BN, PublicKey, etc.)
   */
  sdkParsedInfos: [], // auto parse info in {@link useConcentratedAuto}
  /**
   * additionally add 'hydrated data' (shorcuts data or customized data)
   */
  hydratedInfos: [], // auto parse info in {@link useConcentratedAuto}
  findConcentratedInfoByTokenMint: async (
    coin1Mintlike: PublicKeyish | undefined,
    coin2Mintlike: PublicKeyish | undefined
  ) => {
    const coin1Mint = toDataMint(coin1Mintlike)
    const coin2Mint = toDataMint(coin2Mintlike)

    if (!coin1Mint || !coin2Mint) return { availables: [], best: undefined, routeRelated: [] }
    const mint1 = String(coin1Mint)
    const mint2 = String(coin2Mint)

    const availables = get().jsonInfos.filter(
      (info) =>
        (info.baseMint === mint1 && info.quoteMint === mint2) || (info.baseMint === mint2 && info.quoteMint === mint1)
    )

    /** swap's route transaction middle token  */
    const routeMiddleMints = [
      USDCMint,
      RAYMint,
      WSOLMint,
      mSOLMint,
      PAIMint,
      stSOLMint,
      USDHMint,
      USDTMint,
      ETHMint
    ].map(toPubString)
    const candidateTokenMints = routeMiddleMints.concat([mint1, mint2])
    const onlyRouteMints = routeMiddleMints.filter((routeMint) => ![mint1, mint2].includes(routeMint))
    const routeRelated = get().jsonInfos.filter((info) => {
      const isCandidate = candidateTokenMints.includes(info.baseMint) && candidateTokenMints.includes(info.quoteMint)
      const onlyInRoute = onlyRouteMints.includes(info.baseMint) && onlyRouteMints.includes(info.quoteMint)
      return isCandidate && !onlyInRoute
    })

    const best = await (async () => {
      if (availables.length === 0) return undefined
      if (availables.length === 1) return availables[0]
      const officials = availables.filter((info) => get().officialIds.has(info.id))
      if (officials.length === 1) return officials[0]
      // may be all official pools or all permissionless pools
      const sameLevels = await sdkParseJsonConcentratedInfo(officials.length ? officials : availables)
      // have most lp Supply
      const largest = sameLevels.reduce((acc, curr) => {
        const accIsStable = acc.version === 5
        const currIsStable = curr.version === 5
        if (accIsStable && !currIsStable) return acc
        if (!accIsStable && currIsStable) return curr
        return gte(div(acc.lpSupply, 10 ** acc.lpDecimals), div(curr.lpSupply, 10 ** curr.lpDecimals)) ? acc : curr
      })
      return largest.jsonInfo
    })()

    return { availables, best, routeRelated }
  },

  /********************** exhibition panel **********************/
  userExhibitionConcentratedIds: [],

  /********************** main panel (coin pair panel) **********************/
  currentJsonInfo: undefined,
  currentSdkParsedInfo: undefined, // auto parse info in {@link useConcentratedAuto}
  currentHydratedInfo: undefined, // auto parse info in {@link useConcentratedAuto}

  coin1: undefined,

  coin2: undefined,

  searchText: '',
  focusSide: 'coin1',

  isRemoveDialogOpen: false,
  isSearchAmmDialogOpen: false,
  removeAmount: '',
  scrollToInputBox: () => {},

  refreshCount: 0,
  refreshConcentrated: () => {
    // will auto refresh wallet

    // refresh sdk parsed
    set((s) => ({
      refreshCount: s.refreshCount + 1
    }))
  }
}))

export default useConcentrated
