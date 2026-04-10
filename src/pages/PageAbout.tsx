import React, { FC } from 'react'
import { Breadcrumbs, TBreadcrumbType } from '@/components/Breadcrumbs'
import { ArrowDownToLine, ArrowUpFromLine, HelpCircle, Shield, Vote, Wallet } from 'lucide-react'

const breadcrumbs: TBreadcrumbType[] = [
  { name: 'Overview', link: '/' },
  { name: 'About', link: '/about', active: true },
]

const Step = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) => (
  <div className={'flex flex-row items-start gap-4'}>
    <div
      className={
        'bg-sun-highlight-primary/10 text-sun-highlight-primary flex size-10 shrink-0 items-center justify-center rounded-full'
      }
    >
      {icon}
    </div>
    <div className={'flex flex-col gap-1'}>
      <h3 className={'sun-text-16-md text-sun-header'}>{title}</h3>
      <p className={'sun-text-14-rg text-sun-default'}>{description}</p>
    </div>
  </div>
)

const FaqItem = ({ question, answer }: { question: string; answer: string }) => (
  <div className={'flex flex-col gap-2'}>
    <h3 className={'sun-text-14-md text-sun-header flex items-center gap-2'}>
      <HelpCircle className={'size-4 shrink-0'} />
      {question}
    </h3>
    <p className={'sun-text-14-rg text-sun-default pl-6'}>{answer}</p>
  </div>
)

export const PageAbout: FC = () => {
  return (
    <div className={'sun-page-padding-rb flex w-full flex-col gap-8 overflow-y-auto'}>
      <Breadcrumbs items={breadcrumbs} />

      <div className={'border-b-sun-border-secondary flex flex-col gap-2 border-b pb-6'}>
        <h1 className={'text-sun-header sun-text-h2-md leading-12'}>About CoSponsor</h1>
        <p className={'sun-text-14-rg text-sun-default max-w-prose'}>
          CoSponsor lets the Cardano community collectively fund the 100,000 ADA deposit required to
          submit on-chain governance proposals. Instead of one person bearing the full cost,
          supporters can pool their contributions toward proposals they believe in.
        </p>
      </div>

      <div className={'flex flex-col gap-6'}>
        <h2 className={'sun-text-20-md text-sun-header'}>How It Works</h2>
        <div className={'flex max-w-prose flex-col gap-6'}>
          <Step
            icon={<Vote className={'size-5'} />}
            title="1. Browse proposals"
            description="Explore governance proposals submitted by the Cardano community. Each proposal shows its funding progress and details about the requested action."
          />
          <Step
            icon={<Wallet className={'size-5'} />}
            title="2. Connect your wallet"
            description="Connect any CIP-30 compatible Cardano wallet (such as Eternl, Lace, or Nami) to participate."
          />
          <Step
            icon={<ArrowDownToLine className={'size-5'} />}
            title="3. Pledge ADA"
            description="Choose how much ADA you want to contribute toward a proposal's deposit. Your funds are locked in an on-chain smart contract and you receive gADA tokens as proof of your contribution."
          />
          <Step
            icon={<ArrowUpFromLine className={'size-5'} />}
            title="4. Withdraw anytime"
            description="You can withdraw your pledged ADA at any time by burning your gADA tokens. Your funds are never locked permanently — you are always in control."
          />
        </div>
      </div>

      <div className={'flex flex-col gap-6'}>
        <h2 className={'sun-text-20-md text-sun-header'}>Frequently Asked Questions</h2>
        <div className={'flex max-w-prose flex-col gap-5'}>
          <FaqItem
            question="What happens to my ADA if the proposal doesn't pass?"
            answer="Your ADA is always safe. You can withdraw your full contribution at any time, regardless of whether the proposal passes, fails, or expires. The smart contract guarantees this."
          />
          <FaqItem
            question="What are gADA tokens?"
            answer="gADA tokens are minted when you pledge ADA and serve as proof of your contribution. They are required to withdraw your funds — burning gADA tokens releases the corresponding ADA back to your wallet."
          />
          <FaqItem
            question="Are there any fees?"
            answer="CoSponsor does not charge platform fees. The only cost is the standard Cardano network transaction fee (typically around 0.2-0.5 ADA), which is set by the protocol and does not scale with your pledge amount."
          />
          <FaqItem
            question="Is my ADA safe?"
            answer="Yes. Your ADA is held in an audited on-chain Plutus smart contract, not by any third party. Only your gADA tokens can unlock your funds, and only your wallet can burn those tokens."
          />
          <FaqItem
            question="Who built CoSponsor?"
            answer="CoSponsor is built by Sundae Labs, funded through Project Catalyst (Fund 13)."
          />
        </div>
      </div>

      <div className={'bg-sun-surface-muted flex max-w-prose flex-col gap-2 rounded-xl p-6'}>
        <div className={'flex items-center gap-2'}>
          <Shield className={'text-sun-highlight-primary size-5'} />
          <h2 className={'sun-text-16-md text-sun-header'}>Your funds, your control</h2>
        </div>
        <p className={'sun-text-14-rg text-sun-default'}>
          CoSponsor is fully non-custodial. All deposits and withdrawals are handled by on-chain
          smart contracts. No one — not even the CoSponsor team — can access or move your funds.
        </p>
      </div>
    </div>
  )
}
