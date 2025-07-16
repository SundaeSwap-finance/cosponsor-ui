import { useState, useEffect, useMemo } from 'react'

interface WindowSize {
  width: number
  height: number
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      setWindowSize(newSize)
    }

    window.addEventListener('resize', handleResize)

    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return windowSize
}
export const useScreenSize = () => {
  const { width, height } = useWindowSize()

  const isSm = useMemo<boolean>(() => width >= 640, [width])
  const isMd = useMemo<boolean>(() => width >= 768, [width])
  const isLg = useMemo<boolean>(() => width >= 1024, [width])
  const isXl = useMemo<boolean>(() => width >= 1280, [width])
  const is2xl = useMemo<boolean>(() => width >= 1536, [width])

  const isMobile = useMemo<boolean>(() => width < 768, [width])
  const isTablet = useMemo<boolean>(() => isMd && !isLg, [isLg, isMd])
  const isDesktop = useMemo<boolean>(() => isLg, [isLg])

  const isLandscape = () => window.matchMedia('(orientation: landscape)').matches

  return {
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,

    isMobile,
    isTablet,
    isDesktop,

    isLandscape,
  }
}
