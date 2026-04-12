import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  stagger?: boolean;
  staggerDelay?: number;
}

/**
 * Container with stagger animation for children
 * Useful for lists and grids
 */
export function AnimatedContainer({
  children,
  stagger = false,
  staggerDelay = 0.1,
  ...props
}: AnimatedContainerProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger && !prefersReducedMotion ? staggerDelay : 0,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
      },
    },
  };

  return (
    <motion.div
      variants={stagger ? containerVariants : undefined}
      initial={prefersReducedMotion ? {} : 'hidden'}
      animate="visible"
      {...props}
    >
      {stagger ? (
        <>
          {Array.isArray(children)
            ? children.map((child, index) => (
                <motion.div key={index} variants={itemVariants}>
                  {child}
                </motion.div>
              ))
            : children}
        </>
      ) : (
        children
      )}
    </motion.div>
  );
}

