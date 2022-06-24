import { shakeUndifindedItem } from '@/functions/arrayMethods'
import { isStringInsensitivelyContain, isStringInsensitivelyEqual } from '@/functions/judgers/areEqual'
import { isNumber, isObject, isString } from '@/functions/judgers/dateType'
import { objectMap, omit } from '@/functions/objectMethods'
import { shrinkToValue } from '@/functions/shrinkToValue'
import { MayArray, MayFunction } from '@/types/constants'
import { Dispatch, SetStateAction, useState } from 'react'

type SearchConfigItemObj = {
  text: string
  entirely?: boolean
}

export type SearchConfigItem = SearchConfigItemObj | string

export type UseSearchOptions<T> = {
  defaultSearchText?: string | number
  /** TODO: if return a array, match first searchedText result will palce first, match second searchedText result will palce second */
  getBeSearched?: MayFunction<MayArray<SearchConfigItem>, [item: T]>
}

export function useSearch<T>(
  items: T[],
  options?: UseSearchOptions<T>
): { searched: T[]; searchText: string | undefined; setSearchText: Dispatch<SetStateAction<string | undefined>> } {
  const { defaultSearchText, getBeSearched /* resultSorter */ } = options ?? {}
  const [searchText, setSearchText] = useState(defaultSearchText != null ? String(defaultSearchText) : undefined)
  if (!searchText) return { searched: items, searchText, setSearchText }
  const allMatchedStatusInfos = shakeUndifindedItem(
    items.map((item) => getMatchedInfos(item, searchText, getBeSearched ?? extractItemBeSearchedText(item)))
  )
  const meaningfulMatchedInfos = allMatchedStatusInfos.filter((m) => m?.matched)
  const sortedMatchedInfos = sortByMatchedInfos<T>(meaningfulMatchedInfos)
  const shaked = shakeUndifindedItem(sortedMatchedInfos.map((m) => m.item))
  return { searched: shaked, searchText, setSearchText }
}

function extractItemBeSearchedText(item: unknown): SearchConfigItemObj[] {
  if (isString(item) || isNumber(item)) return [{ text: String(item) } as SearchConfigItemObj]
  if (isObject(item)) {
    const obj = objectMap(omit(item as any, ['id', 'key']), (value) =>
      isString(value) || isNumber(value) ? ({ text: String(value) } as SearchConfigItemObj) : undefined
    )
    return shakeUndifindedItem(Object.values(obj))
  }
  return [{ text: '' }]
}

function getMatchedInfos<T>(
  item: T,
  searchText: string,
  getBeSearched: NonNullable<UseSearchOptions<T>['getBeSearched']>
) {
  const searchKeyWords = String(searchText).trim().split(/\s|-/)
  const searchConfigs = [shrinkToValue(getBeSearched, [item])]
    .flat()
    .map((c) => (isString(c) ? { text: c } : c) as SearchConfigItemObj)
  return patchSearchInfos({ item, searchKeyWords, searchConfigs })
}

type MatchedStatus<T> = {
  item: T
  matched: boolean
  allConfigs: SearchConfigItemObj[]
  matchedConfigs: {
    isEntirelyMatched: boolean

    config: SearchConfigItemObj
    configIdx: number

    searchedKeywordText: string
    searchedKeywordIdx: number
  }[]
}

/** it produce matched search config infos */
function patchSearchInfos<T>(options: {
  item: T
  searchKeyWords: string[]
  searchConfigs: SearchConfigItemObj[]
}): MatchedStatus<T> | undefined {
  const matchInfos: MatchedStatus<T> = {
    item: options.item,
    allConfigs: options.searchConfigs,
    matched: false,
    matchedConfigs: []
  }
  for (const [keywordIdx, keyword] of options.searchKeyWords.entries()) {
    let keywardHasMatched = false
    for (const [configIdx, config] of options.searchConfigs.entries()) {
      const configIsEntirely = config.entirely
      const matchEntirely = isStringInsensitivelyEqual(config.text, keyword)
      const matchPartial = isStringInsensitivelyContain(config.text, keyword)
      if ((matchEntirely && configIsEntirely) || (matchPartial && !configIsEntirely)) {
        keywardHasMatched = true
        matchInfos.matched = true
        matchInfos.matchedConfigs.push({
          config,
          configIdx,
          isEntirelyMatched: matchEntirely,
          searchedKeywordIdx: keywordIdx,
          searchedKeywordText: keyword
        })
      }
    }

    if (!keywardHasMatched) return // if some keyword don't match anything, means this item is not right candidate
  }
  return matchInfos
}

function sortByMatchedInfos<T>(matchedInfos: MatchedStatus<T>[]) {
  return [...matchedInfos].sort(
    (matchedInfoA, matchedInfoB) => toMatchedStatusSignature(matchedInfoB) - toMatchedStatusSignature(matchedInfoA)
  )
}

/**
 * so user can compare just use return number
 *
 * matchedInfo => [0, 1, 2, 0, 2, 1] =>  [ 2 * 4 + 2 * 2, 1 * 5 + 1 * 1] (index is weight) =>
 * 2 - entirely mathched
 * 1 - partialy matched
 * 0 - not matched
 *
 * @returns item's weight number
 */
function toMatchedStatusSignature<T>(matchedInfo: MatchedStatus<T>): number {
  const originalConfigs = matchedInfo.allConfigs
  const entriesSequence = Array.from({ length: originalConfigs.length }, () => 0)
  const partialSequence = Array.from({ length: originalConfigs.length }, () => 0)

  matchedInfo.matchedConfigs.forEach(({ configIdx, isEntirelyMatched }) => {
    if (isEntirelyMatched) {
      entriesSequence[configIdx] = 2 // [0, 0, 2, 0, 2, 0]
    } else {
      partialSequence[configIdx] = 1 // [0, 1, 0, 0, 2, 1]
    }
  })

  const calcCharateristicN = (sequence: number[]) =>
    sequence.reduce((acc, currentValue, currentIdx) => acc + currentValue * (sequence.length - currentIdx), 0)

  const characteristicSequence = calcCharateristicN([
    calcCharateristicN(entriesSequence), // 2 * 4 + 2 * 2
    calcCharateristicN(partialSequence) //  1 * 5 + 1 * 1
  ])
  return characteristicSequence
}
