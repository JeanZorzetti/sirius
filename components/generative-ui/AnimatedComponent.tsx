/**
 * Animated Component Wrapper
 *
 * Provides smooth entrance animations for Generative UI components.
 * Uses Framer Motion for performant animations.
 */

'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence, Variants, Transition } from 'framer-motion'

// Cubic bezier for smooth easing - typed as tuple for Framer Motion
const smoothEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

interface AnimatedComponentProps {
  children: ReactNode
  /** Animation variant to use */
  variant?: 'fadeIn' | 'slideUp' | 'slideIn' | 'scale' | 'bounce'
  /** Delay before animation starts (in seconds) */
  delay?: number
  /** Animation duration (in seconds) */
  duration?: number
  /** Whether the component is visible */
  isVisible?: boolean
  /** Custom className */
  className?: string
  /** Unique key for AnimatePresence */
  animationKey?: string
}

/**
 * Pre-defined animation variants
 */
const animationVariants: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  slideIn: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  bounce: {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
    exit: { opacity: 0, y: -10, scale: 0.98 },
  },
}

/**
 * Animated wrapper for Generative UI components
 *
 * @example
 * ```tsx
 * <AnimatedComponent variant="slideUp" delay={0.1}>
 *   <ROICalculator {...props} />
 * </AnimatedComponent>
 * ```
 */
export function AnimatedComponent({
  children,
  variant = 'slideUp',
  delay = 0,
  duration = 0.3,
  isVisible = true,
  className,
  animationKey,
}: AnimatedComponentProps) {
  const variants = animationVariants[variant]

  const transition: Transition | undefined = variant === 'bounce' ? undefined : {
    duration,
    delay,
    ease: smoothEase,
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={animationKey}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={transition}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Staggered animation for lists of components
 */
interface StaggeredContainerProps {
  children: ReactNode
  /** Delay between each child animation */
  staggerDelay?: number
  className?: string
}

export function StaggeredContainer({
  children,
  staggerDelay = 0.1,
  className,
}: StaggeredContainerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: smoothEase,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  )
}

/**
 * Skeleton pulse animation
 */
interface SkeletonPulseProps {
  children: ReactNode
  className?: string
}

export function SkeletonPulse({ children, className }: SkeletonPulseProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Loading spinner animation
 */
export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <motion.div
      className="inline-block"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="3"
        />
        <path
          d="M12 2C6.48 2 2 6.48 2 12"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  )
}

/**
 * Success checkmark animation
 */
export function SuccessCheckmark({ size = 24 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        variants={{
          hidden: { pathLength: 0 },
          visible: {
            pathLength: 1,
            transition: { duration: 0.3, ease: 'easeOut' },
          },
        }}
      />
      <motion.path
        d="M7 13l3 3 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0 },
          visible: {
            pathLength: 1,
            transition: { duration: 0.3, delay: 0.2, ease: 'easeOut' },
          },
        }}
      />
    </motion.svg>
  )
}

/**
 * Expand/collapse animation wrapper
 */
interface ExpandableProps {
  children: ReactNode
  isExpanded: boolean
  className?: string
}

export function Expandable({ children, isExpanded, className }: ExpandableProps) {
  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: smoothEase }}
          className={className}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Hover lift animation
 */
interface HoverLiftProps {
  children: ReactNode
  className?: string
  lift?: number
}

export function HoverLift({ children, className, lift = 4 }: HoverLiftProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -lift }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
