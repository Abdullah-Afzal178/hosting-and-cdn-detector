# CDN & Hosting Detector

Find out which CDN sits in front of a website and who actually hosts it. Enter a domain, and the tool resolves it to its A and AAAA records, then identifies the edge network, anycast status, operator, and ASN behind every address — powered by [ipgeolocation.io](https://ipgeolocation.io).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-000?logo=nextdotjs)](https://nextjs.org/)
[![Powered by ipgeolocation.io](https://img.shields.io/badge/Powered%20by-ipgeolocation.io-1a73e8)](https://ipgeolocation.io)

<!-- Add a screenshot of the tool running locally at ./public/tool.png and reference it here -->

---

## What It Does

Enter a domain (or a bare IP) and get:

- **A one-line verdict** — *"Fastly is in front of www.bbc.co.uk"* or *"No CDN detected for github.com"*
- **The resolution path** — domain → DNS records → edge network → operator, read left to right
- **Every resolved address** — CDN flag, provider name, anycast status, operator, ASN, and location
- **Honest labelling** — when a CDN is inferred from the operator rather than an explicit flag, it says so

Real results:

| Domain | Verdict | Operator |
|---|---|---|
| `www.bbc.co.uk` | **Fastly** | Fastly, Inc. |
| `www.shopify.com` | **Cloudflare** · anycast | Cloudflare, Inc. |
| `vercel.com` | **Vercel** *(matched by operator)* | Vercel, Inc |
| `github.com` | No CDN detected | Microsoft Corporation |

---

## Two signals, not one

The API exposes an `is_cdn` flag, and it is authoritative when set — but it misses some edge platforms. Azure Front Door and Vercel both come back `false`, even though both clearly front traffic. So detection combines two signals:

1. **The API's network flags** — `is_cdn`, `cdn_provider_name`, `is_anycast`. Trusted first.
2. **Operator matching** — the ASN organisation and company name are matched against a list of known CDN, cloud, and hosting providers in [`lib/providers.ts`](lib/providers.ts).

Crucially, cloud and hosting providers are **not** reported as CDNs. Amazon, Azure, Google Cloud, Hetzner, and DigitalOcean are identified as the host, not as an edge network — so the verdict stays meaningful. When the CDN is only inferred from the operator, the UI labels it `by operator` and shows a caveat.

Both modules are pure and dependency-free, and are covered by unit tests (48 assertions across provider classification and hostname normalisation).

---

## Why ipgeolocation.io

Identifying an edge network from an IP is exactly the kind of question a plain WHOIS cannot answer:

- **CDN and anycast flags** — `include=network` returns `is_cdn`, `cdn_provider_name`, and `is_anycast` directly.
- **Operator identity in the same call** — ASN, organisation, company name and type come back together, so one request per lookup covers every address.
- **Bulk endpoint** — all of a domain's resolved addresses are checked in a single `POST /v3/ipgeo-bulk`.
- **Free tier** — everything this tool uses works on the free plan.

> ipgeolocation.io also offers dedicated APIs for [ASN](https://ipgeolocation.io/documentation/asn-api.html), [Security](https://ipgeolocation.io/documentation/ip-security-api.html) (VPN, proxy, Tor detection), [Timezone](https://ipgeolocation.io/documentation/timezone-api.html), [Astronomy](https://ipgeolocation.io/documentation/astronomy-api.html), [User-Agent parsing](https://ipgeolocation.io/documentation/user-agent-api.html), and [Abuse Contact](https://ipgeolocation.io/documentation/ip-abuse-contact-api.html) lookups.

**[Get your free API key →](https://ipgeolocation.io/signup)**

---

## Features

- **Domain or IP input** — `https://example.com/path`, `example.com:8443`, or `104.16.0.1` all work
- **IPv4 and IPv6** — A and AAAA records are both resolved and checked
- **Anycast detection** — shows when a block is announced from many locations
- **Per-address breakdown** — different edge nodes are shown separately, not averaged away
- **One bulk API call** per lookup, regardless of how many addresses resolve
- **Shareable URLs** — every result is a link (`/?target=example.com`)
- **Server-side API calls only** — your API key is never exposed to the browser
- **SEO-ready** — Open Graph tags, meta description, `robots.txt`, `sitemap.xml`, and favicon

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org/) (App Router) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Language | TypeScript |
| DNS | Node `dns/promises` |
| Icons | [lucide-react](https://lucide.dev/) |
| Network data | [ipgeolocation.io](https://ipgeolocation.io) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [ipgeolocation.io](https://ipgeolocation.io/signup) API key (free tier is enough)

### Run It Locally

1. Clone the repo:

```bash
git clone https://github.com/Abdullah-Afzal178/hosting-and-cdn-detector.git
cd hosting-and-cdn-detector
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root:

```env
IPGEOLOCATION_API_KEY=your_api_key_here
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `IPGEOLOCATION_API_KEY` | Yes | Your [ipgeolocation.io](https://ipgeolocation.io/signup) API key |
| `NEXT_PUBLIC_SITE_URL` | No | Your production URL if you choose to deploy (used for sitemap and OG metadata) |

---

## How It Works

1. Your input is normalised — protocol, path, query, credentials and port are stripped, and the hostname is validated.
2. The server resolves A and AAAA records with Node's `dns/promises`. Up to 4 IPv4 and 2 IPv6 addresses are checked.
3. All resolved addresses go to `POST /v3/ipgeo-bulk` in one request with `include=network`. The API key stays server-side.
4. Results merge back **by array index** — the bulk endpoint returns results positionally, failures carry no `ip` field, and IPv6 is returned expanded.
5. Each address is classified by combining the API flags with operator matching, then the verdict is aggregated across all addresses.

### Caveats

- Large CDNs rotate addresses per request and per region, so the sample is representative rather than complete.
- A site can sit behind a CDN that terminates elsewhere, or use a CDN only for assets on another hostname. Treat the result as strong evidence, not proof.

---

## Project Structure

```
hosting-and-cdn-detector/
├── app/
│   ├── layout.tsx
│   ├── page.tsx          # Search + results (?target=…)
│   ├── opengraph-image.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── verdict.tsx           # Headline answer
│   ├── resolution-flow.tsx   # Domain → DNS → edge → operator
│   ├── edge-nodes.tsx        # Per-address detail
│   └── site-header.tsx
├── lib/
│   ├── detect.ts         # DNS resolution + bulk lookup (server only)
│   ├── providers.ts      # Known CDN/cloud/hosting matching (no API, no deps)
│   ├── hostname.ts       # Input normalisation (no API, no deps)
│   └── session-cache.ts
├── .env                  # API key (not committed)
└── README.md
```

---

## Want to Deploy It?

Works on any platform that supports Next.js with the Node runtime (DNS resolution needs it):

- **Vercel** — import the repo, add `IPGEOLOCATION_API_KEY`, deploy.
- **Netlify**, **Railway**, **Render** — similar process.
- **Self-hosted** — `npm run build && npm start`.

---

## License

MIT — see [LICENSE](LICENSE) for details.
