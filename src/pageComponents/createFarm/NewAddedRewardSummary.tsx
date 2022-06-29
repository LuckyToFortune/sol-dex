import { getRewardSignature, hasRewardBeenEdited } from '@/application/createFarm/parseRewardInfo'
import { UIRewardInfo } from '@/application/createFarm/type'
import useCreateFarms from '@/application/createFarm/useCreateFarm'
import { Badge } from '@/components/Badge'
import CoinAvatar from '@/components/CoinAvatar'
import Col from '@/components/Col'
import Grid from '@/components/Grid'
import Icon from '@/components/Icon'
import ListTable from '@/components/ListTable'
import Row from '@/components/Row'
import { getTime, toUTC } from '@/functions/date/dateFormat'
import { TimeStamp } from '@/functions/date/interface'
import parseDuration, { getDuration, parseDurationAbsolute } from '@/functions/date/parseDuration'
import formatNumber from '@/functions/format/formatNumber'
import toPercentString from '@/functions/format/toPercentString'
import { eq } from '@/functions/numberish/compare'
import { div } from '@/functions/numberish/operations'
import { toString } from '@/functions/numberish/toString'
import { Numberish } from '@/types/constants'

/**
 * mode: list show
 * mode: list show (item select)
 * mode: edit
 */
export function NewAddedRewardSummary({
  canUserEdit,
  activeReward,
  onActiveRewardChange
}: {
  canUserEdit: boolean

  // --------- when selectable ------------
  activeReward?: UIRewardInfo
  onActiveRewardChange?(reward: UIRewardInfo): void
}) {
  const rewards = useCreateFarms((s) => s.rewards)
  const editableRewards = rewards.filter((r) => r.type === 'existed reward')
  const newReards = rewards.filter((r) => r.type === 'new added')
  return (
    <ListTable
      list={newReards}
      getItemKey={(r) => getRewardSignature(r)}
      labelMapper={[
        {
          label: 'Reward Token',
          cssGridItemWidth: '.6fr'
        },
        {
          label: 'Amount'
        },
        {
          label: 'Total Duration',
          cssGridItemWidth: '.6fr'
        },
        {
          label: 'Period (yy-mm-dd)',
          cssGridItemWidth: '1.5fr'
        },
        {
          label: 'Est. daily rewards'
        }
      ]}
      // className="backdrop-brightness-"
      rowClassName={({ itemData: reward }) => {
        if (canUserEdit) {
          return `${activeReward?.id === reward.id ? 'backdrop-brightness-90' : 'hover:backdrop-brightness-95'}`
        }
        return ''
      }}
      onClickRow={({ itemData: reward }) => {
        onActiveRewardChange?.(reward)
      }}
      renderRowItem={({ item: reward, label }) => {
        if (label === 'Reward Token') {
          return reward.token ? (
            <Col className="h-full justify-center gap-1">
              <Row className="gap-1 items-center">
                <CoinAvatar token={reward.token} size="sm" />
                <div>{reward.token?.symbol ?? 'UNKNOWN'}</div>
              </Row>
              {(reward.isRewardEnded || reward.isRewardBeforeStart || reward.isRewarding) && (
                <Row className="gap-1 flex-wrap">
                  {reward.isRewardEnded && <Badge cssColor="#da2Eef">Ended</Badge>}
                  {reward.isRewardBeforeStart && <Badge cssColor="#abc4ff">Upcoming</Badge>}
                  {reward.isRewarding && <Badge cssColor={'#39d0d8'}>Ongoing</Badge>}
                </Row>
              )}
            </Col>
          ) : (
            '--'
          )
        }

        if (label === 'Amount') {
          if (reward.isRewarding && reward.version === 'v3/v5') return '--'
          return (
            <Grid className={`gap-4 h-full`}>
              {reward?.amount ? (
                <Col className="grow break-all justify-center">
                  {formatNumber(reward.amount, { fractionLength: reward.token?.decimals ?? 6 })}
                </Col>
              ) : undefined}
            </Grid>
          )
        }

        if (label === 'Total Duration') {
          if (reward.isRewarding && reward.version === 'v3/v5') return '--'

          const getDurationText = (startTime: TimeStamp, endTime: TimeStamp) => {
            const duration = parseDuration(getDuration(endTime, startTime))
            return duration.hours ? `${duration.days}D ${duration.hours}H` : `${duration.days}D`
          }

          return (
            <Grid className={`gap-4 h-full`}>
              {reward?.startTime && reward.endTime ? (
                <Col className="grow break-all justify-center">{getDurationText(reward.startTime, reward.endTime)}</Col>
              ) : undefined}
            </Grid>
          )
        }

        if (label === 'Period (yy-mm-dd)') {
          if (reward.isRewarding && reward.version === 'v3/v5') return '--'
          if (!reward.startTime || !reward.endTime) return
          return (
            <Grid className={`gap-4 h-full`}>
              {reward?.startTime && reward.endTime ? (
                <Col className="grow justify-center">
                  <div>{toUTC(reward.startTime)}</div>
                  <div>{toUTC(reward.endTime)}</div>
                </Col>
              ) : undefined}
            </Grid>
          )
        }

        if (label === 'Est. daily rewards') {
          if (reward.isRewarding && reward.version === 'v3/v5') return '--'

          const getEstimatedValue = (amount: Numberish, startTime: TimeStamp, endTime: TimeStamp) => {
            const durationTime = endTime && startTime ? getTime(endTime) - getTime(startTime) : undefined
            const estimatedValue =
              amount && durationTime ? div(amount, parseDurationAbsolute(durationTime).days) : undefined
            return estimatedValue
          }

          const originEstimatedValue =
            reward?.amount && reward.startTime && reward.endTime
              ? getEstimatedValue(reward.amount, reward.startTime, reward.endTime)
              : undefined
          return (
            <Grid className={`gap-4 h-full`}>
              {originEstimatedValue && (
                <Col className="grow justify-center text-xs">
                  <div>
                    {toString(originEstimatedValue)} {reward?.token?.symbol}/day
                  </div>
                </Col>
              )}
            </Grid>
          )
        }
      }}
      renderRowEntry={({ contentNode, destorySelf, itemData }) => {
        const controlsNode = (
          <Row className="gap-2">
            <Icon
              size="smi"
              heroIconName="pencil"
              className="clickable clickable-opacity-effect text-[#abc4ff]"
              onClick={() => {
                onActiveRewardChange?.(itemData)
              }}
            />
            <Icon
              size="smi"
              heroIconName="trash"
              className={`clickable text-[#abc4ff] ${rewards.length > 1 ? 'hover:text-[#DA2EEF]' : 'hidden'}`}
              onClick={() => rewards.length > 1 && destorySelf()} // delete is wrong
            />
          </Row>
        )

        return (
          <>
            {contentNode}
            {canUserEdit && (
              <div className="absolute -right-10 top-1/2 -translate-y-1/2 translate-x-full">{controlsNode}</div>
            )}
          </>
        )
      }}
      onListChange={(newRewards) => {
        useCreateFarms.setState({
          rewards: editableRewards.concat(newRewards)
        })
      }}
    />
  )
}
