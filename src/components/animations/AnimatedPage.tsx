import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedPageProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

/**
 * Page wrapper with fade-in animation
 * Respects reduced motion preferences
 */
export function AnimatedPage({ children, ...props }: AnimatedPageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

