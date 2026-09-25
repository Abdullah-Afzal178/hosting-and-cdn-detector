import { Zap } from "lucide-react";

import type { EdgeNode } from "@/lib/detect";

const KIND_LABEL: Record<string, string> = {
  cdn: "CDN",
  cloud: "Cloud",
  hosting: "Hosting",
  unknown: "Network",
};

export function EdgeNodes({ nodes }: { nodes: EdgeNode[] }) {
  return (
    <section aria-labelledby="nodes-heading" className="space-y-3">
      <h2 id="nodes-heading" className="text-sm font-bold uppercase tracking-wider text-stone-400">
        Resolved addresses
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {nodes.map((node) => (
          <article
            key={node.ip}
            className={[
              "rounded-xl border bg-white p-4",
              node.isCdn ? "border-orange-200" : "border-stone-200",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="break-all font-mono text-sm font-bold text-stone-900">
                {node.ip}
              </span>
              <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                IPv{node.version}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {node.isCdn ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">
                  <Zap className="h-3 w-3" />
                  {node.cdnName}
                </span>
              ) : (
                <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-600">
                  No CDN
                </span>
              )}
              {node.isAnycast ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  Anycast
                </span>
              ) : null}
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-600">
                {KIND_LABEL[node.operatorKind] ?? "Network"}
              </span>
              {node.source === "operator" ? (
                <span className="rounded-full border border-amber-300 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  by operator
                </span>
              ) : null}
            </div>

            <dl className="mt-3 space-y-1.5 border-t border-stone-100 pt-3 text-sm">
              <Row label="Operator" value={node.operator} />
              <Row label="ASN" value={node.asNumber || "—"} mono />
              <Row
                label="Location"
                value={
                  [node.city, node.countryName].filter(Boolean).join(", ") || "—"
                }
                emoji={node.countryEmoji}
              />
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  mono = false,
  emoji = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  emoji?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-stone-400">{label}</dt>
      <dd
        className={[
          "break-words text-right font-semibold text-stone-800",
          mono ? "font-mono text-xs" : "",
        ].join(" ")}
      >
        {emoji ? `${emoji} ` : ""}
        {value}
      </dd>
    </div>
  );
}
