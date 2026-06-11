import { ReactNode } from 'react'

/**
 * Page-mount reveal via CSS (.animate-page-enter in globals.css).
 * Was a framer-motion <motion.div> — the simple fade/slide didn't justify
 * shipping the library in the main dashboard page chunk.
 */
export function AnimatedPageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="h-full flex flex-col w-full animate-page-enter">
      {children}
    </div>
  )
}
