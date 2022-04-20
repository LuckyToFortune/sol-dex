import useConnection from '@/application/connection/useConnection'
import useWallet from '@/application/wallet/useWallet'
import listToMap from '@/functions/format/listToMap'
import useAsyncEffect from '@/hooks/useAsyncEffect'
import useIdo, { IdoStore } from './useIdo'
import { EffectCheckSetting, shouldEffectBeOn } from '../miscTools'
import useToken from '@/application/token/useToken'
import { fetchRawIdoListJson, fetchRawIdoProjectInfoJson, getSdkIdoList } from './utils/fetchIdoInfo'
import { hydrateIdoInfo } from './utils/hydrateIdoInfo'
import toPubString, { ToPubPropertyValue } from '@/functions/format/toMintString'
import { objectMap } from '@/functions/objectMethods'
import { HydratedIdoInfo } from './type'
import asyncMap from '@/functions/asyncMap'

export default function useAutoFetchIdoInfos(options?: { when?: EffectCheckSetting }) {
  const connection = useConnection((s) => s.connection)
  const owner = useWallet((s) => s.owner)
  const shadowKeypairs = useWallet((s) => s.shadowKeypairs)
  const idoRawInfos = useIdo((s) => s.idoRawInfos)
  const currentIdoId = useIdo((s) => s.currentIdoId)
  const tokens = useToken((s) => s.tokens)
  const getToken = useToken((s) => s.getToken)

  // raw list info
  useAsyncEffect(async () => {
    if (!shouldEffectBeOn(options?.when)) return
    const rawList = await fetchRawIdoListJson()
    const hydrated = rawList.map((raw) => {
      const base = getToken(raw.baseMint)
      const quote = getToken(raw.quoteMint)
      return hydrateIdoInfo({ ...raw, base, quote })
    })
    const hydratedInfos = listToMap(hydrated, (i) => i.id)
    useIdo.setState((s) => ({
      idoRawInfos: listToMap(rawList, (i) => i.id),
      idoHydratedInfos: {
        ...s.idoHydratedInfos,
        ...objectMap(hydratedInfos, (newHydratedInfo, idoid) => ({
          ...s.idoHydratedInfos[idoid],
          ...newHydratedInfo
        }))
      }
    }))
  }, [tokens, options?.when])

  // inject project info
  useAsyncEffect(async () => {
    if (!shouldEffectBeOn(options?.when)) return
    if (!currentIdoId) return
    const projectInfo = await fetchRawIdoProjectInfoJson({ idoId: currentIdoId })
    if (!projectInfo) return // some error occurs
    useIdo.setState((s) => ({
      idoProjectInfos: { ...s.idoProjectInfos, [currentIdoId]: projectInfo },
      idoHydratedInfos: {
        ...s.idoHydratedInfos,
        [currentIdoId]: { ...s.idoHydratedInfos[currentIdoId], ...projectInfo }
      }
    }))
  }, [currentIdoId, options?.when])

  // get SDKInfo, and merge with rawInfo
  useAsyncEffect(async () => {
    if (!shouldEffectBeOn(options?.when)) return
    if (!connection) return
    const rawList = Object.values(idoRawInfos ?? {})
    const publicKeyed = ToPubPropertyValue(rawList)

    // get sdk ledger/snapshot and render
    const sdkList = await getSdkIdoList({ publicKeyed, connection, owner, options: { noIdoState: true } })
    const sdkInfos = Object.fromEntries([rawList.map((raw, idx) => [raw.id, sdkList[idx]])])
    const hydrated = sdkList.map((sdkInfo, idx) => {
      const rawInfo = rawList[idx]
      const base = getToken(rawInfo.baseMint) // must haeeeve raw.state
      const quote = getToken(rawInfo.quoteMint)
      return hydrateIdoInfo({ ...rawInfo, ...sdkInfo, base, quote })
    })
    const hydratedInfos = listToMap(hydrated, (i) => i.id)
    useIdo.setState((s) => ({
      idoSDKInfos: sdkInfos,
      idoHydratedInfos: {
        ...s.idoHydratedInfos,
        ...objectMap(hydratedInfos, (newHydratedInfo, idoid) => ({
          ...s.idoHydratedInfos[idoid],
          ...newHydratedInfo
        }))
      }
    }))

    // defferly get all
    setTimeout(async () => {
      const sdkList = await getSdkIdoList({ publicKeyed, connection, owner })
      const sdkInfos = Object.fromEntries([rawList.map((raw, idx) => [raw.id, sdkList[idx]])])
      const hydrated = sdkList.map((sdkInfo, idx) => {
        const rawInfo = rawList[idx]
        const base = getToken(rawInfo.baseMint) // must have raw.state
        const quote = getToken(rawInfo.quoteMint)
        const hydratedResult = hydrateIdoInfo({ ...rawInfo, ...sdkInfo, base, quote })
        return hydratedResult
      })
      const hydratedInfos = listToMap(hydrated, (i) => i.id)
      useIdo.setState((s) => ({
        idoSDKInfos: sdkInfos,
        idoHydratedInfos: {
          ...s.idoHydratedInfos,
          ...objectMap(hydratedInfos, (newHydratedInfo, idoid) => ({
            ...s.idoHydratedInfos[idoid],
            ...newHydratedInfo
          }))
        }
      }))
    }, 1000)
  }, [idoRawInfos, connection, options?.when, owner])

  useAsyncEffect(async () => {
    if (!shouldEffectBeOn(options?.when)) return
    if (!shadowKeypairs?.length) return
    if (!connection) return
    const rawList = Object.values(idoRawInfos ?? {}).slice(0, 3)
    const publicKeyed = ToPubPropertyValue(rawList)
    const structured = await asyncMap(shadowKeypairs, async ({ publicKey, secretKey }) => {
      const sdkList = await getSdkIdoList({
        publicKeyed,
        connection,
        owner: publicKey,
        options: { noIdoState: true }
      })
      const hydrated = sdkList.map((sdkInfo, idx) => {
        const rawInfo = rawList[idx]
        const base = getToken(rawInfo.baseMint) // must haeeeve raw.state
        const quote = getToken(rawInfo.quoteMint)
        return hydrateIdoInfo({ ...rawInfo, ...sdkInfo, base, quote })
      })
      const hydratedInfos = listToMap(hydrated, (i) => i.id)
      return [toPubString(publicKey), hydratedInfos]
    })
    const shadowIdoHydratedInfos: NonNullable<IdoStore['shadowIdoHydratedInfos']> = Object.fromEntries(structured)
    useIdo.setState({ shadowIdoHydratedInfos })
  }, [idoRawInfos, connection, shadowKeypairs, options?.when])
}
