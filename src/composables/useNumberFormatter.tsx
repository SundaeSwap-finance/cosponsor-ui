import { defaultLocale } from '@/config/config'

export const useNumberFormatter = () => {
  const formatNumber = (value: number | string, decimals: number) => {
    const format = (value: number) =>
      new Intl.NumberFormat(defaultLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      }).format(value)

    if (typeof value === 'string') {
      return format(Number(value))
    }

    return format(value as number) // If this cast is not present, TS will fail to compile under certain ESM builds, because it does not properly infer the type of value
  }

  return {
    formatNumber,
  }
}
