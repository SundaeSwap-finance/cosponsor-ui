import { ReactNode } from 'react'

export const SearchActionHint = ({
  icons,
  actionName,
}: {
  icons: ReactNode[]
  actionName: string
}) => {
  return (
    <div className={'flex flex-row items-center justify-start gap-3'}>
      <div className={'flex flex-row items-center justify-start gap-2'}>
        {icons.map((icon, index) => (
          <div
            key={index}
            className={
              'border-sun-border-primary text-sun-header flex size-6.5 items-center justify-center rounded-md border'
            }
          >
            {icon}
          </div>
        ))}
      </div>
      {actionName}
    </div>
  )
}
