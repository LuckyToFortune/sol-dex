import { currentIsAfter, currentIsBefore } from '@/functions/date/judges'
import { toTokenAmount } from '@/functions/format/toTokenAmount'
import { Percent } from '@raydium-io/raydium-sdk'

import { HydratedIdoInfo, SdkIdoInfo, TicketInfo, TicketTailNumberInfo } from '../type'
import { eq, isMeaningfulNumber } from '@/functions/numberish/compare'
import { div, getMin, mul } from '@/functions/numberish/operations'
import toTokenPrice from '@/functions/format/toTokenPrice'
import { objectShakeFalsy } from '@/functions/objectMethods'

function getDepositedTickets(idoInfo: SdkIdoInfo): TicketInfo[] {
  if (!idoInfo.ledger) return []
  const begin = Number(idoInfo.ledger.startNumber)
  const end = Number(idoInfo.ledger.endNumber)
  return Array.from({ length: end - begin + 1 }, (_, i) => ({ no: begin + i }))
}

function isTicketWin(ticketNumber: number, idoInfo: SdkIdoInfo): boolean | undefined {
  const luckyNumbers = idoInfo.state?.luckyNumbers
  const isTargeted = luckyNumbers?.some(
    ({ digits, number, endRange }) =>
      Number(digits) &&
      Number(ticketNumber) <= Number(endRange) &&
      String(ticketNumber)
        .padStart(Number(digits), '0')
        .endsWith(String(number).padStart(Number(digits), '0'))
  )
  return isTargeted
}

function getWinningTickets(idoInfo: SdkIdoInfo) {
  const isWinning = idoInfo.state?.isWinning.toNumber()
  // 0 not roll
  if (isWinning === 0) return []
  // 1 hit not win
  if (isWinning === 1) return getDepositedTickets(idoInfo).filter((ticket) => !isTicketWin(ticket.no, idoInfo))
  // 2 hit is win
  if (isWinning === 2) return getDepositedTickets(idoInfo).filter((ticket) => isTicketWin(ticket.no, idoInfo))
  // 3 all win
  if (isWinning === 3) return getDepositedTickets(idoInfo)
}

function getWinningTicketsTailNumbers(idoInfo: SdkIdoInfo): HydratedIdoInfo['winningTicketsTailNumber'] | undefined {
  if (!idoInfo.state) return
  const isWinning = idoInfo.state?.isWinning.toNumber() as 0 | 1 | 2 | 3
  const luckyNumberRawList: TicketTailNumberInfo[] = idoInfo.state.luckyNumbers
    .filter(({ digits }) => digits.toNumber() !== 0)
    .map(({ number, digits, endRange }) => ({
      no: String(number).padStart(Number(digits), '0'),
      isPartial: idoInfo.state!.raisedLotteries.toNumber() !== endRange.toNumber()
    }))
  // 1 hit not win
  if (isWinning === 1) return { tickets: luckyNumberRawList, isWinning }
  // 2 hit is win
  if (isWinning === 2) return { tickets: luckyNumberRawList, isWinning }
  // 3 all win
  if (isWinning === 3) return { tickets: [], isWinning }
  // 0 not roll
  return { tickets: [], isWinning }
}

function fromSToMs(s: undefined): undefined
function fromSToMs(s: number): number
function fromSToMs(s: undefined | number): undefined | number
function fromSToMs(s: undefined | number) {
  if (s == null) return s
  return s * 1000
}
/**
 *  computed from raw idoInfo
 */
export function hydrateIdoInfo(idoInfo: SdkIdoInfo): HydratedIdoInfo {
  //updatedIdoInfo
  const updatedIdoInfo = Object.assign(
    { ...idoInfo } as SdkIdoInfo,
    objectShakeFalsy({
      maxWinLotteries: idoInfo.state?.maxWinLotteries.toNumber(),
      raisedLotteries: fromSToMs(idoInfo.state?.raisedLotteries.toNumber()),
      startTime: fromSToMs(idoInfo.state?.startTime.toNumber()),
      endTime: fromSToMs(idoInfo.state?.endTime.toNumber()),
      startWithdrawTime: fromSToMs(idoInfo.state?.startWithdrawTime.toNumber())
    } as Partial<SdkIdoInfo>)
  )
  const isUpcoming = currentIsBefore(updatedIdoInfo.startTime)
  const isOpen = currentIsAfter(updatedIdoInfo.startTime) && currentIsBefore(updatedIdoInfo.endTime)
  const isClosed = currentIsAfter(updatedIdoInfo.endTime)
  const canWithdrawBase = currentIsAfter(updatedIdoInfo.startWithdrawTime)

  const depositedTickets = getDepositedTickets(updatedIdoInfo).map((ticketInfo) => ({
    ...ticketInfo,
    isWinning: isTicketWin(ticketInfo.no, updatedIdoInfo)
  }))
  const winningTickets = getWinningTickets(updatedIdoInfo)
  const userEligibleTicketAmount = updatedIdoInfo.snapshot?.maxLotteries

  const isEligible = userEligibleTicketAmount == null ? undefined : isMeaningfulNumber(userEligibleTicketAmount)

  const totalRaise =
    updatedIdoInfo.base && toTokenAmount(updatedIdoInfo.base, updatedIdoInfo.raise, { alreadyDecimaled: true })
  const coinPrice =
    updatedIdoInfo.base &&
    updatedIdoInfo.state &&
    toTokenPrice(updatedIdoInfo.base, updatedIdoInfo.price, { alreadyDecimaled: true })
  const ticketPrice =
    updatedIdoInfo.quote &&
    updatedIdoInfo.state &&
    toTokenAmount(updatedIdoInfo.quote, updatedIdoInfo.state.perLotteryQuoteAmount)
  const depositedTicketCount = updatedIdoInfo.state && updatedIdoInfo.state.raisedLotteries.toNumber()

  const userAllocation =
    updatedIdoInfo.state &&
    depositedTicketCount &&
    mul(div(winningTickets?.length, getMin(updatedIdoInfo.state.maxWinLotteries, depositedTicketCount)), totalRaise)

  const claimableQuote =
    (isClosed &&
      updatedIdoInfo.ledger &&
      eq(0, updatedIdoInfo.ledger.quoteWithdrawn) &&
      updatedIdoInfo.quote &&
      toTokenAmount(updatedIdoInfo.quote, updatedIdoInfo.ledger.quoteDeposited)) ||
    undefined

  const filled =
    updatedIdoInfo.state &&
    new Percent(updatedIdoInfo.state.raisedLotteries, updatedIdoInfo.state.maxWinLotteries).toFixed()
  return {
    ...updatedIdoInfo,
    winningTicketsTailNumber: getWinningTicketsTailNumbers(updatedIdoInfo),
    winningTickets,
    depositedTickets,
    userAllocation,
    depositedTicketCount,

    isUpcoming,
    isOpen,
    isClosed,
    canWithdrawBase,

    totalRaise,
    coinPrice,
    ticketPrice,

    filled,

    claimableQuote,
    userEligibleTicketAmount,
    isEligible
  } as HydratedIdoInfo
}
