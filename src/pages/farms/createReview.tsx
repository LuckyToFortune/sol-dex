import useConnection from '@/application/connection/useConnection'
import { createNewUIRewardInfo } from '@/application/createFarm/parseRewardInfo'
import txCreateNewFarm from '@/application/createFarm/txCreateNewFarm'
import useCreateFarms from '@/application/createFarm/useCreateFarm'
import useFarms from '@/application/farms/useFarms'
import { routeBack, routeTo } from '@/application/routeTools'
import { RAYMint } from '@/application/token/wellknownToken.config'
import { getRecentBlockhash } from '@/application/txTools/attachRecentBlockhash'
import useWallet from '@/application/wallet/useWallet'
import Button from '@/components/Button'
import Col from '@/components/Col'
import PageLayout from '@/components/PageLayout'
import Row from '@/components/Row'
import toPubString from '@/functions/format/toMintString'
import { gte } from '@/functions/numberish/compare'
import { toString } from '@/functions/numberish/toString'
import { NewAddedRewardSummary } from '@/pageComponents/createFarm/NewAddedRewardSummary'
import { PoolInfoSummary } from '@/pageComponents/createFarm/PoolInfoSummery'
import { useEffect, useState } from 'react'

function useAvailableCheck() {
  useEffect(() => {
    if (!useCreateFarms.getState().isRoutedByCreateOrEdit) routeTo('/farms')
  }, [])
}

export default function CreateFarmReviewPage() {
  const balances = useWallet((s) => s.balances)
  const [blockHash, setBlockHash] = useState<string>() // hacking: same block hash can only success once
  const connection = useConnection((s) => s.connection)
  const userRayBalance = balances[toPubString(RAYMint)]
  const haveStakeOver300Ray = gte(userRayBalance ?? 0, 0 /* FIXME : for Test, true is 300  */)
  useAvailableCheck()
  return (
    <PageLayout metaTitle="Farms - Raydium">
      <div className="self-center w-[min(720px,90vw)]">
        <div className="pb-8 text-2xl mobile:text-lg font-semibold justify-self-start text-white">Create Farm</div>

        <div className="mb-8 text-xl mobile:text-lg font-semibold justify-self-start text-white">
          Review farm details
        </div>

        <div className="mb-8">
          <div className="mb-3 text-[#abc4ff] text-sm font-medium justify-self-start">Pool</div>
          <PoolInfoSummary />
        </div>

        <div className="mb-6">
          <div className="mb-3 text-[#abc4ff] text-sm font-medium justify-self-start">Farm rewards</div>
          <NewAddedRewardSummary canUserEdit={false} />
        </div>

        <div className="font-medium text-sm text-justify leading-snug text-[#abc4ff80] mb-8">
          <span className="text-[#DA2EEF]">Please note:</span> Rewards allocated to farms cannot be withdrawn after
          farming starts. Newly created farms generally appear on Raydium 10-30 minutes after creation, depending on
          Solana network status. A one-time fee of 300 RAY is required to create a farm, which will be deposited into
          the Raydium treasury.
        </div>

        {!haveStakeOver300Ray && (
          <div className="text-[#DA2EEF] font-medium text-center my-4">
            Creating a farm requires a one-time 300 RAY fee. Your RAY balance: {toString(userRayBalance) || 0} RAY
          </div>
        )}

        <Row className="gap-5 justify-center items-start">
          <Col className="items-center">
            <Button
              className="frosted-glass-teal px-16 self-stretch"
              size="lg"
              validators={[{ should: haveStakeOver300Ray, fallbackProps: { children: 'Insufficient RAY balance' } }]}
              onClick={async () => {
                if (!connection) return
                const recentBlockHash =
                  blockHash ||
                  (await getRecentBlockhash(connection).then((hash) => {
                    setBlockHash(hash)
                    return hash
                  }))

                txCreateNewFarm(
                  {
                    onTxSuccess: () => {
                      setTimeout(() => {
                        routeTo('/farms')
                        useCreateFarms.setState({ rewards: [createNewUIRewardInfo()] })
                        useFarms.getState().refreshFarmInfos()
                        useCreateFarms.setState({ isRoutedByCreateOrEdit: false })
                      }, 1000)
                    }
                  },
                  recentBlockHash
                )
              }}
            >
              Create Farm
            </Button>
            <Col className="mt-4 text-sm font-medium items-center">
              <div>
                <span className="text-[#abc4ff80]">Fee:</span> <span className="text-[#abc4ff]">300 RAY</span>
              </div>
              <div>
                <span className="text-[#abc4ff80]">Est. transaction fee:</span>{' '}
                <span className="text-[#abc4ff]">0.002 SOL</span>
              </div>
            </Col>
          </Col>
          <Button className="frosted-glass-skygray" size="lg" onClick={routeBack}>
            Edit
          </Button>
        </Row>
      </div>
    </PageLayout>
  )
}
