import { ArrowRight, Building2, Globe, Network, Zap } from "lucide-react";

import type { DetectionData } from "@/lib/detect";

/** Domain → DNS records → edge network → operator, read left to right. */
export function ResolutionFlow({ data }: { data: DetectionData }) {
  const steps = [
    {
      label: data.wasIp ? "Address" : "Domain",
      value: data.target,
      detail: data.wasIp ? "entered directly" : "what you searched",
      icon: Globe,
      mono: true,
    },
    {
      label: "DNS records",
      value: `${data.ipv4.length + data.ipv6.length}`,
      detail: [
        data.ipv4.length ? `${data.ipv4.length} A` : "",
        data.ipv6.length ? `${data.ipv6.length} AAAA` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      icon: Network,
      mono: false,
    },
    {
      label: "Edge network",
      value: data.usesCdn ? data.cdnNames.join(", ") || "CDN" : "Direct",
      detail: data.anycast ? "anycast" : "unicast",
      icon: Zap,
      mono: false,
      highlight: data.usesCdn,
    },
    {
      label: "Operator",
      value: data.operators[0] ?? "Unknown",
      detail:
        data.operators.length > 1 ? `+${data.operators.length - 1} more` : "runs the network",
      icon: Building2,
      mono: false,
    },
  ];

  return (
    <section aria-label="Resolution path" className="overflow-x-auto">
      <ol className="flex min-w-max items-stretch gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <li key={step.label} className="flex items-stretch gap-2">
              <div
                className={[
                  "flex min-w-[11rem] flex-col rounded-xl border bg-white px-4 py-3",
                  step.highlight ? "border-orange-300" : "border-stone-200",
                ].join(" ")}
              >
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <Icon className="h-3.5 w-3.5" />
                  {step.label}
                </span>
                <span
                  className={[
                    "mt-1.5 truncate text-base font-bold",
                    step.highlight ? "text-orange-600" : "text-stone-900",
                    step.mono ? "font-mono text-sm" : "",
                  ].join(" ")}
                  title={step.value}
                >
                  {step.value}
                </span>
                <span className="truncate text-xs text-stone-400">{step.detail}</span>
              </div>
              {index < steps.length - 1 ? (
                <span className="flex items-center text-stone-300">
                  <ArrowRight className="h-4 w-4" />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
