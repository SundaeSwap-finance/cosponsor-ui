export const useTextFormatter = () => {
  const formatMidEllipsis = (input: string, maxChars: number) => {
    const half = Math.floor((maxChars - 3) / 2)
    return input.slice(0, half) + '...' + input.slice(-half)
  }

  return {
    formatMidEllipsis,
  }
}
