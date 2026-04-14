import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsTablet(w >= MOBILE_BREAKPOINT && w < TABLET_BREAKPOINT);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isTablet;
}

export function useIsLandscape() {
  const [isLandscape, setIsLandscape] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return isLandscape;
}

export function useIsLowPerformance() {
  const [isLowPerf, setIsLowPerf] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      const cores = navigator.hardwareConcurrency || 4;
      // @ts-ignore
      const memory = navigator.deviceMemory || 4;
      setIsLowPerf(cores <= 4 || memory <= 3);
    };
    check();
  }, []);

  return isLowPerf;
}