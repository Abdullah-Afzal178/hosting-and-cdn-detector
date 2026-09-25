import { Cloud, Globe2, Server, ShieldCheck, Zap } from "lucide-react";

import type { DetectionData } from "@/lib/detect";

/** Headline answer plus the supporting facts, above the per-address detail. */
export function Verdict({ data }: { data: DetectionData }) {
  const cdn = data.cdnNames.join(" + ");
  const operators = data.operators.slice(0, 2).join(", ");
  const onlyByOperator =
    data.usesCdn && data.nodes.every((node) => node.source !== "api");

  const headline = data.usesCdn
    ? `${cdn || "A CDN"} is in front of ${data.target}`
    : `No CDN detected for ${data.target}`;

  // Operator names often already end in "." (e.g. "Fastly, Inc."), so only add
  // sentence punctuation when it is missing.
  const subline = data.usesCdn
    ? endSentence(
        `Requests are served from an edge network${operators ? `, operated by ${operators}` : ""}`,
      )
    : endSentence(`Requests appear to go straight to ${operators || "the origin host"}`);

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border-2 bg-white shadow-sm",
        data.usesCdn ? "border-orange-300" : "border-stone-200",
      ].join(" ")}
    >
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span
            className={[
              "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              data.usesCdn
                ? "bg-orange-500 text-white"
                : "bg-stone-200 text-stone-600",
            ].join(" ")}
          >
            {data.usesCdn ? <Zap className="h-6 w-6" /> : <Server className="h-6 w-6" />}
          </span>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-stone-900 sm:text-3xl">
              {headline}
            </h2>
            <p className="mt-2 text-base text-stone-600">{subline}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Fact icon={Globe2} label={`${data.nodes.length} address${data.nodes.length === 1 ? "" : "es"} checked`} />
          {data.anycast ? <Fact icon={Zap} label="Anycast" highlight /> : null}
          {data.operators.map((operator) => (
            <Fact key={operator} icon={Cloud} label={operator} />
          ))}
        </div>

        {onlyByOperator ? (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Identified from the network operator rather than an explicit CDN flag, so
            treat this as a strong hint rather than a certainty.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function endSentence(text: string) {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function Fact({
  icon: Icon,
  label,
  highlight = false,
}: {
  icon: typeof Cloud;
  label: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold",
        highlight
          ? "bg-orange-100 text-orange-800"
          : "bg-stone-100 text-stone-700",
      ].join(" ")}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
