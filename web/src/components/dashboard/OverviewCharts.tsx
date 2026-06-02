"use client";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { PILLARS } from "@/lib/constants";
import type { FlatActivity } from "@/lib/analytics/types";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

export function OverviewCharts({ acts }: { acts: FlatActivity[] }) {
  const edu = acts.filter((a) => a.themes.includes("Education")).length;
  const acc = acts.filter((a) => a.themes.includes("Access and Success")).length;
  const ent = acts.filter((a) => a.themes.includes("Entrepreneurship")).length;

  const pillarData = {
    labels: ["Education", "Access & Success", "Entrepreneurship"],
    datasets: [
      {
        data: [edu, acc, ent],
        backgroundColor: ["#1e5fa8", "#1a6b44", "#a05c00"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const compByP = PILLARS.map(
    (p) => acts.filter((a) => a.themes.includes(p) && a.status === "Completed").length,
  );
  const goByP = PILLARS.map(
    (p) => acts.filter((a) => a.themes.includes(p) && a.status === "Ongoing").length,
  );
  const planByP = PILLARS.map(
    (p) => acts.filter((a) => a.themes.includes(p) && a.status === "Planned").length,
  );

  const statusData = {
    labels: ["Education", "Access & Success", "Entrepreneurship"],
    datasets: [
      { label: "Completed", data: compByP, backgroundColor: "#15803d" },
      { label: "Ongoing", data: goByP, backgroundColor: "#a05c00" },
      { label: "Planned", data: planByP, backgroundColor: "#1e3a5f" },
    ],
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-[10px] bg-white p-5 shadow-sm">
        <h4 className="mb-3 text-sm font-bold text-[#1e3a5f]">
          Activity Distribution by Pillar
        </h4>
        <div className="h-[200px]">
          <Doughnut
            data={pillarData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" } },
            }}
          />
        </div>
      </div>
      <div className="rounded-[10px] bg-white p-5 shadow-sm">
        <h4 className="mb-3 text-sm font-bold text-[#1e3a5f]">
          Status Breakdown by Pillar
        </h4>
        <div className="h-[200px]">
          <Bar
            data={statusData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { stacked: true },
                y: { stacked: true, ticks: { stepSize: 1 } },
              },
              plugins: { legend: { position: "bottom" } },
            }}
          />
        </div>
      </div>
    </div>
  );
}
