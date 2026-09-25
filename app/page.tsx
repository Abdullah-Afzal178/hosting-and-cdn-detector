import { Radar } from "lucide-react";
import { Suspense } from "react";

import { EdgeNodes } from "@/components/edge-nodes";
import { LookupNotice } from "@/components/lookup-notice";
import { PageSkeleton } from "@/components/page-skeleton";
import { ResolutionFlow } from "@/components/resolution-flow";
import { SiteHeader } from "@/components/site-header";
import { Verdict } from "@/components/verdict";
import { detectTarget } from "@/lib/detect";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ target?: string | string[] }>;
};

export default function HomePage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DetectContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DetectContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.target) ? params.target[0] : params.target;
  const target = raw?.trim() ?? "";
  const result = target ? await detectTarget(target) : null;

  return (
    <>
      <SiteHeader query={target} />
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
        {!target ? (
          <section className="flex flex-col items-center rounded-2xl border border-stone-200 bg-white px-6 py-14 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white">
              <Radar className="h-7 w-7" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-stone-900">
              Enter a domain to begin
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-stone-500">
              The domain is resolved to its A and AAAA records, then every address is
              checked for CDN and anycast signals, the network operator, and the ASN
              behind it.
            </p>
          </section>
        ) : result && !result.ok ? (
          <LookupNotice title={result.error.title} message={result.error.message} />
        ) : result?.ok ? (
          <>
            <Verdict data={result.data} />
            <ResolutionFlow data={result.data} />
            <EdgeNodes nodes={result.data.nodes} />

            {result.data.truncatedRecords ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
                This domain returns more DNS records than were checked. Large CDNs rotate
                addresses per request, so the sample above is representative rather than
                complete.
              </p>
            ) : null}

            <p className="text-xs leading-6 text-stone-400">
              Detection combines the ipgeolocation.io network flags (CDN, anycast) with
              matching of the network operator against known CDN, cloud, and hosting
              providers. A site can also sit behind a CDN that terminates elsewhere, so
              treat this as strong evidence rather than proof.
            </p>
          </>
        ) : null}
      </main>
    </>
  );
}
