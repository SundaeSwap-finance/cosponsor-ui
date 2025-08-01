import { Button } from '@/components/shadcn/button'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/shadcn/sheet'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { useState } from 'react'

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={
          'border-sun-border-primary relative flex w-full flex-row justify-end border-b px-4 py-2'
        }
      >
        <div
          className={
            'sun-text-20-bd absolute left-1/2 flex -translate-x-1/2 place-self-center text-center'
          }
        >
          Cosponsor
        </div>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost" onClick={() => setIsOpen(true)}>
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className={'bg-sun-surface-muted'}>
          <SheetTitle className="hidden">Navigation menu</SheetTitle>
          <SheetDescription className="hidden">
            Navigate to other main sections of the Cosponsor app.
          </SheetDescription>
          <Sidebar mobileSheet onNavigate={() => setIsOpen(false)} />
        </SheetContent>
      </div>
    </Sheet>
  )
}
