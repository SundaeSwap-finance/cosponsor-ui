import { FC } from 'react'

export const App: FC = () => {
  return (
    <div className={`text-h1-bd flex flex-col gap-2 p-4`}>
      <h1 className={'text-h1-md'}>Heading 1</h1>
      <h2 className={'text-h2-md'}>Heading 2</h2>
      <h3 className={'text-h3-md'}>Heading 3</h3>
      <div className={'text-18-li'}>Light</div>
      <div className={'text-18-rg'}>Regular</div>

      <div className={'text-18-md'}>Medium</div>
      <div className={'text-18-bd'}>Bold</div>
    </div>
  )
}
