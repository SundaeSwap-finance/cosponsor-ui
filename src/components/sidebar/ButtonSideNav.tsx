import { ReactNode, MouseEvent } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

export const ButtonSideNav = ({
  label,
  path,
  icon,
  expanded,
  onClick,
}: {
  label: string
  path: string
  expanded: boolean
  icon?: ReactNode
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
}) => {
  const location = useLocation()

  const shouldHighlight = () => {
    if (label.toLowerCase().includes('all proposals')) {
      const locationSplit = location.pathname.split('/')
      return locationSplit[1].toLowerCase().includes('category')
    }
    return false
  }

  return (
    <NavLink
      onClick={onClick}
      title={label}
      to={path}
      className={({ isActive }) =>
        [
          `flex h-8 min-w-0 flex-row items-center gap-2 px-2 py-1.5 ${expanded ? 'w-full justify-start' : 'w-fit justify-center'}`,
          'sun-text-14-md border-white-pure hover:bg-sun-surface-gray cursor-pointer truncate rounded-sm bg-none',
          isActive || shouldHighlight()
            ? 'text-sun-action-primary bg-sun-surface-gray'
            : 'text-sun-header',
        ].join(' ')
      }
    >
      {icon}
      <>{expanded && label}</>
    </NavLink>
  )
}
