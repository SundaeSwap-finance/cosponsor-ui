import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/shadcn/button'
import { Calendar } from '@/components/shadcn/calendar'
import { Label } from '@/components/shadcn/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export const InputDatePicker = ({
  label,
  className,
  onSelect,
  selectedDate,
  hiddenBefore,
  hiddenAfter,
}: {
  selectedDate?: Date
  label?: string
  className?: string
  onSelect?: (date: Date | undefined) => void
  hiddenBefore?: Date | undefined
  hiddenAfter?: Date | undefined
}) => {
  const [open, setOpen] = useState(false)
  // const [date, setDate] = useState<Date | undefined>(undefined)
  const today = new Date()
  const yearsStart = new Date()
  yearsStart.setFullYear(today.getFullYear() - 10)
  const yearsEnd = new Date()
  yearsEnd.setFullYear(today.getFullYear() + 5)
  //
  const onSelectDate = (date: Date | undefined) => {
    setOpen(false)
    onSelect?.(date)
  }

  return (
    <div className={cn('flex gap-4', className)}>
      <div className="flex w-full flex-row gap-3">
        <Label htmlFor="date-picker" className={'min-w-10'}>
          {label ?? 'Date'}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" id="date-picker" className="justify-between font-normal">
              {selectedDate ? selectedDate.toLocaleDateString() : 'Select date'}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              hidden={{ before: hiddenBefore ?? yearsStart, after: hiddenAfter ?? yearsEnd }}
              startMonth={yearsStart}
              endMonth={yearsEnd}
              timeZone={'UTC'}
              mode="single"
              selected={selectedDate}
              captionLayout="dropdown"
              onSelect={(date) => onSelectDate(date)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
