import { useState, useEffect } from 'react';

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);

    // 현대적인 addEventListener 사용 (addListener는 deprecated)
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      // 구형 브라우저 지원을 위한 fallback
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [matches, query]);

  return matches;
};

// 미디어 쿼리 상수들
export const BREAKPOINTS = {
  mobile: '(max-width: 767px)',
  tablet: '(max-width: 1279px)',
  desktop: '(min-width: 1280px)',
  small: '(max-width: 480px)'
};