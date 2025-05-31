import { useEffect, useState } from 'react';

/**
 * Custom hook to detect if the current device is a mobile device
 * @param breakpoint - The breakpoint width to consider as mobile (default: 768px)
 * @returns boolean indicating if the device is mobile
 */
export const useMobile = (breakpoint = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(
    window.innerWidth < breakpoint
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]); // Re-run effect if breakpoint changes

  return isMobile;
};

export default useMobile;
