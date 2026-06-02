"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AnalyticsBundle, PeriodOption, SynergyItem } from "@/lib/analytics/types";
import type { TargetsMap } from "@/lib/analytics/metrics-core";
import { filterByPeriod } from "@/lib/analytics/periods";

type AnalyticsData = {
  period: string;
  periodOptions: PeriodOption[];
  submissions: AnalyticsBundle["submissions"];
  activities: AnalyticsBundle["activities"];
  synergies: SynergyItem[];
  targets: TargetsMap;
  counts: { submissions: number; activities: number; filtered: number };
};

type Ctx = {
  period: string;
  setPeriod: (p: string) => void;
  data: AnalyticsData | null;
  loading: boolean;
  refresh: () => void;
  filteredActivities: AnalyticsBundle["activities"];
  filteredSubmissions: AnalyticsBundle["submissions"];
};

const AnalyticsContext = createContext<Ctx | null>(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState("all");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/analytics?period=${encodeURIComponent(period)}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredActivities = useMemo(
    () =>
      data
        ? filterByPeriod(data.activities, period)
        : [],
    [data, period],
  );

  const filteredSubmissions = useMemo(() => {
    if (!data) return [];
    const ids = new Set(filteredActivities.map((a) => a.submission.id));
    return data.submissions.filter((s) => ids.has(s.id));
  }, [data, filteredActivities]);

  return (
    <AnalyticsContext.Provider
      value={{
        period,
        setPeriod,
        data,
        loading,
        refresh: load,
        filteredActivities,
        filteredSubmissions,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used within AnalyticsProvider");
  return ctx;
}
