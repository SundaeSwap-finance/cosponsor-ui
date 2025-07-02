import { Button } from '@/components/shadcn/button'
import { ButtonGradient } from '@/components/button/ButtonGradient'
import { BadgeProposalTag } from '@/components/proposals/BadgeProposalTag'
import { BadgeProposalPercent } from '@/components/proposals/BadgeProposalPercent'

export const CardProposal = () => {
  return (
    <div
      className={
        'border-sun-border-secondary divide-sun-border-primary flex h-full w-full max-w-100 flex-col divide-y rounded-xl border'
      }
    >
      <div className={'flex h-12.5 flex-row items-center justify-between px-6 py-4'}>
        <div className={'text-sun-muted text-12-md flex flex-row gap-2'}>
          <div>Created by</div>
          <div className={'text-sun-default underline decoration-dotted underline-offset-3'}>
            @placeholder
          </div>
        </div>
        <BadgeProposalPercent percentage={33} />
      </div>

      <div className={'flex min-h-25 w-full flex-col gap-4 px-6 py-4'}>
        <div className={'flex flex-col gap-2'}>
          <h2 className={'text-sun-header text-18-sb'}> Title Placeholder</h2>
          <div className={'flex flex-row gap-4'}>
            <div className={'flex flex-row gap-1'}>
              <div className={'text-12-md text-sun-default'}>Proposed on</div>
              <div className={'text-12-md text-sun-muted'}>32/32/32</div>
            </div>
            <div className={'flex flex-row gap-1'}>
              <div className={'text-12-md text-sun-default'}>Expires on</div>
              <div className={'text-12-md text-sun-muted'}>32/32/32</div>
            </div>
            <BadgeProposalTag tagName="Hard Fork" />
          </div>
        </div>
        <div>TODO: Variable content here, fund progress or your pledge or unfunded</div>
        <div className={'flex w-full flex-row gap-4'}>
          <div className={'flex w-full flex-col gap-1.5'}>
            <div className={'text-sun-muted text-12-md'}>Company</div>
            <div className={'text-14-md text-sun-default'}>Sunday Labs Inc.</div>
          </div>
          <div className={'flex w-full flex-col gap-1.5'}>
            <div className={'text-sun-muted text-12-md'}>Domain</div>
            <div className={'text-14-md text-sun-default'}>sundae.fi</div>
          </div>
        </div>
        <div className={'flex w-full flex-col gap-1.5'}>
          <div className={'text-sun-muted text-12-md'}>Abstract</div>
          <div className={'text-14-md text-sun-header line-clamp-4'}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
            mollit anim id est laborum.
          </div>
        </div>
      </div>
      <div className={'flex w-full flex-row gap-2 px-6 py-4'}>
        <Button className={'flex-1'}>View Details</Button>
        <ButtonGradient className={'flex-1'}>Sponsor!</ButtonGradient>
      </div>
    </div>
  )
}
