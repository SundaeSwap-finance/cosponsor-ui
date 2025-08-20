import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover'
import { Button } from '@/components/shadcn/button'
import { useState } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/shadcn/command'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type userType = { name: string; id: string }
// !!
//TODO move this data to useGetProposals and mark as WIP
// !!
const tempUserList: userType[] = [
  { name: 'TypicalUser', id: '46' },
  { name: 'ATypicalUser', id: '47' },
  { name: 'ATypicalUser', id: '48' },
  { name: 'AnotherUser', id: '40000' },
  { name: 'User123456789', id: '123456789' },
  { name: 'TryoutUser', id: 'dyk2s7ch34m' },
  { name: 'TypicalUser1', id: '001' },
]

export const FilterPropCreator = () => {
  const [open, setOpen] = useState(false)
  const [selection, setSelection] = useState<userType[]>([])

  const onSelectItem = (selectedId: string) => {
    const isInSelection: userType | undefined = selection.find((item) => item.id === selectedId)
    const userExists: userType | undefined = tempUserList.find((user) => user.id === selectedId)

    if (isInSelection) {
      setSelection(selection.filter((item) => item.id !== selectedId))
    } else if (userExists) {
      setSelection([...selection, userExists])
    }
    setOpen(false)
  }

  return (
    <div className={'flex flex-col gap-8'}>
      <div className={'flex flex-col gap-2'}>
        <div className={'flex flex-row flex-wrap gap-2'}>
          {selection.map((item) => (
            <Button
              aria-label={'Click to remove user filter'}
              onClick={() => onSelectItem(item.id)}
              variant={'ghost'}
              size={'sm'}
              className={cn(
                'bg-sun-highlight-primary/10 border-sun-highlight-primary/50 text-sun-highlight-primary',
                'sun-text-12-rg flex h-fit w-fit items-center justify-center gap-1 rounded-full border !px-1.5 py-0.5'
              )}
            >
              {item.name}
              <X className={'size-4 rounded-full'} />
            </Button>
          ))}
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-60 justify-between"
            >
              {selection.length > 0 ? selection.length + ' selected' : 'Search Creators / dReps'}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search Users..." className="h-9" />
              <CommandList>
                <CommandEmpty>No user found.</CommandEmpty>
                <CommandGroup>
                  {tempUserList.map((user) => (
                    <CommandItem
                      onMouseDown={(event) => event.preventDefault()}
                      className={
                        selection.some((selected) => selected.id === user.id)
                          ? 'bg-sun-highlight-primary/10 data-[selected=true]:bg-sun-highlight-primary/10 cursor-pointer'
                          : 'cursor-pointer'
                      }
                      key={user.id}
                      value={user.id + ' ' + user.name}
                      onSelect={() => onSelectItem(user.id)}
                    >
                      {user.name}
                      <Check
                        className={cn(
                          'text-sun-highlight-primary ml-auto',
                          selection.some((selected) => selected.id === user.id) ? 'flex' : 'hidden'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
