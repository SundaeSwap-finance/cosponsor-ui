import { defaultLocale } from '@/config/config'

export const getShortDate = (date: Date | undefined) => {
  if (!date) {
    return 'n/a'
  }
  const options: Intl.DateTimeFormatOptions = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }
  // Make sure to display forward slash in returning string by finding all non-numerical values.
  return date.toLocaleString(defaultLocale, options).replace(/\D/g, '/')
}

export const getShortDateAndTime = (date: Date | undefined) => {
  const result = date?.toLocaleTimeString(defaultLocale)
  return getShortDate(date) + ' ' + result
}
