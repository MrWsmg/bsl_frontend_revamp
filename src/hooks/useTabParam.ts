"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

/**
 * Drop-in replacement for `useState` that mirrors the active tab in a URL query param.
 *
 * Same signature as useState:
 *   const [activeTab, setActiveTab] = useTabParam('overview');
 *
 * The active tab is reflected as `?tab=<value>` (configurable via `key`), so the URL
 * changes as the user navigates dashboard sections — making views bookmarkable,
 * shareable, and back/forward friendly. When the tab equals the default, the param is
 * dropped to keep the base URL clean (`/dashboard`).
 *
 * Uses `router.replace` (no history entry per tab). Switch to `router.push` if you want
 * the back button to step through each tab opened.
 *
 * NOTE: components calling this must render inside a <Suspense> boundary (Next.js
 * requirement for useSearchParams).
 */
export function useTabParam<T extends string = string>(
  defaultTab: NoInfer<T>,
  key: string = "tab",
): [T, (tab: T) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const raw = params.get(key);
  const activeTab = (raw ?? defaultTab) as T;

  const setActiveTab = useCallback(
    (tab: T) => {
      const next = new URLSearchParams(params.toString());
      if (tab === defaultTab) next.delete(key);
      else next.set(key, tab);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, router, pathname, defaultTab, key],
  );

  return [activeTab, setActiveTab];
}
