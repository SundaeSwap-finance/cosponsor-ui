import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { extendTailwindMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}

const customTwMerge = extendTailwindMerge<string>({
  // Properly merge the custom util classes defined in src/css
  extend: {
    classGroups: {
      sunText: [
        (className: string) => {
          return /^sun-text-.+/.test(className)
        },
      ],
      customPadding: [
        (className: string) => {
          return /^sun-page-padding-.+/.test(className)
        },
      ],
    },

    conflictingClassGroups: {
      sunText: ['font-size', 'font-weight', 'leading'],
      customPadding: ['px', 'py', 'pr', 'pl', 'pt', 'pb', 'p'],
    },
  },
})
