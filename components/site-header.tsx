import Link from "next/link";
import { Search, Zap } from "lucide-react";

import { PoweredByBadge } from "@/components/powered-by-badge";
import { EXAMPLES, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export function SiteHeader({ query = "" }: { query?: string }) {
  return (
    <header className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
            <Zap className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-stone-900">
            {SITE_NAME}
          </span>
        </Link>
        <PoweredByBadge />
      </div>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
        Which CDN does this site use?
      </h1>
      <p className="mt-2 max-w-2xl text-base text-stone-500">{SITE_TAGLINE}</p>

      <form action="/" method="get" className="mt-5">
        <label htmlFor="target" className="sr-only">
          Domain or IP address
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="target"
            name="target"
            type="text"
            defaultValue={query}
            placeholder="example.com or 104.16.0.1"
            className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 font-mono text-base text-stone-900 outline-none transition placeholder:text-stone-300 focus:border-orange-400"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            <Search className="h-4 w-4" />
            Detect
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Try</span>
        {EXAMPLES.map((example) => (
          <Link
            key={example.target}
            href={`/?target=${encodeURIComponent(example.target)}`}
            className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 transition hover:border-orange-300 hover:text-orange-700"
          >
            {example.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
