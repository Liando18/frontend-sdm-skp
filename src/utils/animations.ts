import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

// Register GSAP plugins
gsap.registerPlugin(useGSAP)

export { gsap, useGSAP }

export const GSAP_EASE = {
  smooth: 'power2.out',
  snappy: 'power3.out',
  bounce: 'back.out(1.35)',
  spring: 'back.out(1.6)',
  gentle: 'power1.out',
} as const

/**
 * Animate page view entrance cleanly with GPU acceleration and automatic cleanup
 */
export function useViewTransition(
  containerRef: React.RefObject<HTMLElement | null>,
  dependencies: unknown[] = []
) {
  useGSAP(
    () => {
      if (!containerRef.current) return
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.28,
          ease: GSAP_EASE.smooth,
          clearProps: 'transform,opacity',
        }
      )
    },
    { scope: containerRef, dependencies }
  )
}

/**
 * Stagger entrance for child elements matching a CSS selector
 */
export function useStaggerEntrance(
  containerRef: React.RefObject<HTMLElement | null>,
  selector: string,
  dependencies: unknown[] = [],
  options: {
    y?: number
    x?: number
    duration?: number
    stagger?: number
    delay?: number
  } = {}
) {
  const { y = 14, x = 0, duration = 0.32, stagger = 0.05, delay = 0 } = options

  useGSAP(
    () => {
      if (!containerRef.current) return
      const elements = containerRef.current.querySelectorAll(selector)
      if (!elements.length) return

      gsap.fromTo(
        elements,
        { opacity: 0, y, x },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration,
          stagger,
          delay,
          ease: GSAP_EASE.smooth,
          clearProps: 'transform,opacity',
        }
      )
    },
    { scope: containerRef, dependencies }
  )
}

/**
 * Count-up animation for numbers (e.g. KPI metrics, scores)
 */
export function useCountUp(
  containerRef: React.RefObject<HTMLElement | null>,
  selector: string,
  dependencies: unknown[] = [],
  duration = 0.85
) {
  useGSAP(
    () => {
      if (!containerRef.current) return
      const elements = containerRef.current.querySelectorAll<HTMLElement>(selector)
      if (!elements.length) return

      elements.forEach((el, idx) => {
        const rawTarget = el.getAttribute('data-count') || el.innerText.trim()
        const targetNum = parseFloat(rawTarget)
        if (isNaN(targetNum)) return

        const isDecimal = rawTarget.includes('.')
        const decimalPlaces = isDecimal ? (rawTarget.split('.')[1] || '').length : 0
        const counter = { val: 0 }

        gsap.to(counter, {
          val: targetNum,
          duration,
          delay: idx * 0.06,
          ease: GSAP_EASE.snappy,
          onUpdate: () => {
            el.innerText = isDecimal
              ? counter.val.toFixed(decimalPlaces)
              : Math.round(counter.val).toString()
          },
        })
      })
    },
    { scope: containerRef, dependencies }
  )
}

/**
 * Animate progress bar widths or chart bars with snappy spring physics
 */
export function useChartBarAnimation(
  containerRef: React.RefObject<HTMLElement | null>,
  selector: string,
  dependencies: unknown[] = []
) {
  useGSAP(
    () => {
      if (!containerRef.current) return
      const bars = containerRef.current.querySelectorAll<HTMLElement>(selector)
      if (!bars.length) return

      bars.forEach((bar, idx) => {
        const originalHeight = bar.style.height
        gsap.fromTo(
          bar,
          { scaleY: 0, transformOrigin: 'bottom center' },
          {
            scaleY: 1,
            duration: 0.55,
            delay: idx * 0.05 + 0.08,
            ease: GSAP_EASE.spring,
            clearProps: 'transform',
          }
        )
        bar.style.height = originalHeight
      })
    },
    { scope: containerRef, dependencies }
  )
}

/**
 * Subtle interactive card lift & tap animation on cards/buttons
 */
export function useInteractiveCards(
  containerRef: React.RefObject<HTMLElement | null>,
  selector: string
) {
  useGSAP(
    () => {
      if (!containerRef.current) return
      const cards = containerRef.current.querySelectorAll<HTMLElement>(selector)
      if (!cards.length) return

      const cleanups: (() => void)[] = []

      cards.forEach((card) => {
        const onEnter = () => {
          gsap.to(card, { y: -2, duration: 0.2, ease: GSAP_EASE.smooth })
        }
        const onLeave = () => {
          gsap.to(card, { y: 0, duration: 0.25, ease: GSAP_EASE.smooth })
        }
        card.addEventListener('mouseenter', onEnter)
        card.addEventListener('mouseleave', onLeave)

        cleanups.push(() => {
          card.removeEventListener('mouseenter', onEnter)
          card.removeEventListener('mouseleave', onLeave)
        })
      })

      return () => {
        cleanups.forEach((fn) => fn())
      }
    },
    { scope: containerRef }
  )
}
