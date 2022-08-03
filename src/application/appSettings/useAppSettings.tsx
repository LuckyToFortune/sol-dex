import create from 'zustand'

import { Numberish } from '@/types/constants'
import { getPlatformInfo } from '@/functions/dom/getPlatformInfo'
import { inClient } from '@/functions/judgers/isSSR'
import { getLocalItem } from '@/functions/dom/jStorage'

// it is some global uiStates

export type AppSettingsStore = {
  slippageTolerance: Numberish
  slippageToleranceState: 'valid' | 'invalid' | 'too small'
  themeMode: 'dark' | 'light'

  isBetaBubbleOn: boolean // temp for beta
  needPopDisclaimer: boolean // need user agree

  /** detect device */
  isMobile: boolean
  isTablet: boolean
  isPc: boolean

  // dev
  inClient?: boolean
  inServer?: boolean
  isInLocalhost?: boolean
  isInBonsaiTest?: boolean

  /** sould block any update when approve panel shows on  */
  isApprovePanelShown: boolean

  /** (setting) if true, no need to affact coin1 & coin2 & ammId to url  */
  inCleanUrlMode: boolean

  /** (ui panel controller) ui dialog open flag */
  isRecentTransactionDialogShown: boolean

  /** (ui panel controller) ui dialog open flag */
  isWalletSelectorShown: boolean

  // <RefreshCircle/> need a place to store state across app
  refreshCircleLastTimestamp: {
    [key: string]: {
      endProcessPercent: number
      endTimestamp: number
    }
  }
}
const useAppSettings = create<AppSettingsStore>(() => ({
  slippageTolerance: 0,
  slippageToleranceState: 'valid',
  themeMode: 'light' as 'dark' | 'light',

  isBetaBubbleOn: true,
  needPopDisclaimer: inClient ? !getLocalItem<boolean>('USER_AGREE_DISCLAIMER') : false,

  isMobile: false,
  isTablet: false,
  isPc: true,

  isApprovePanelShown: false,

  inCleanUrlMode: false,
  // inCleanUrlMode: true, // for test

  isRecentTransactionDialogShown: false,
  isWalletSelectorShown: false,
  refreshCircleLastTimestamp: {}
}))

export default useAppSettings
