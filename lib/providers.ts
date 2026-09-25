/**
 * Local provider matching. The API's `is_cdn` flag is authoritative when set,
 * but it misses some edge platforms (Azure Front Door and Vercel both come
 * back false), so the network operator's name is used as a second signal.
 * Pure and dependency-free so it can be unit tested.
 */

export type ProviderKind = "cdn" | "cloud" | "hosting";

export type KnownProvider = {
  name: string;
  kind: ProviderKind;
  /** Lower-cased needles matched against ASN organisation and company name. */
  match: string[];
};

const PROVIDERS: KnownProvider[] = [
  { name: "Cloudflare", kind: "cdn", match: ["cloudflare"] },
  { name: "Fastly", kind: "cdn", match: ["fastly"] },
  { name: "Akamai", kind: "cdn", match: ["akamai"] },
  { name: "Amazon CloudFront", kind: "cdn", match: ["cloudfront"] },
  { name: "Edgio", kind: "cdn", match: ["edgio", "limelight", "edgecast"] },
  { name: "Gcore", kind: "cdn", match: ["gcore", "g-core"] },
  { name: "BunnyCDN", kind: "cdn", match: ["bunny"] },
  { name: "KeyCDN", kind: "cdn", match: ["keycdn", "proinity"] },
  { name: "StackPath", kind: "cdn", match: ["stackpath", "highwinds"] },
  { name: "CDN77", kind: "cdn", match: ["cdn77", "datacamp limited"] },
  { name: "Imperva", kind: "cdn", match: ["imperva", "incapsula"] },
  { name: "Sucuri", kind: "cdn", match: ["sucuri"] },
  { name: "CacheFly", kind: "cdn", match: ["cachefly"] },
  { name: "Qrator", kind: "cdn", match: ["qrator"] },
  { name: "ArvanCloud", kind: "cdn", match: ["arvan"] },
  { name: "Netlify", kind: "cdn", match: ["netlify"] },
  { name: "Vercel", kind: "cdn", match: ["vercel"] },

  { name: "Amazon Web Services", kind: "cloud", match: ["amazon", "aws"] },
  { name: "Microsoft Azure", kind: "cloud", match: ["microsoft", "azure"] },
  { name: "Google Cloud", kind: "cloud", match: ["google"] },
  { name: "Oracle Cloud", kind: "cloud", match: ["oracle"] },
  { name: "Alibaba Cloud", kind: "cloud", match: ["alibaba", "aliyun"] },
  { name: "IBM Cloud", kind: "cloud", match: ["ibm", "softlayer"] },
  { name: "Tencent Cloud", kind: "cloud", match: ["tencent"] },

  { name: "DigitalOcean", kind: "hosting", match: ["digitalocean"] },
  { name: "Linode", kind: "hosting", match: ["linode"] },
  { name: "Hetzner", kind: "hosting", match: ["hetzner"] },
  { name: "OVH", kind: "hosting", match: ["ovh"] },
  { name: "Scaleway", kind: "hosting", match: ["scaleway", "online s.a.s"] },
  { name: "Vultr", kind: "hosting", match: ["vultr", "choopa"] },
  { name: "GoDaddy", kind: "hosting", match: ["godaddy"] },
  { name: "Hostinger", kind: "hosting", match: ["hostinger"] },
  { name: "SiteGround", kind: "hosting", match: ["siteground"] },
  { name: "Bluehost", kind: "hosting", match: ["bluehost", "newfold", "unified layer"] },
  { name: "WP Engine", kind: "hosting", match: ["wpengine", "wp engine"] },
  { name: "Squarespace", kind: "hosting", match: ["squarespace"] },
  { name: "Shopify", kind: "hosting", match: ["shopify"] },
  { name: "Automattic", kind: "hosting", match: ["automattic", "wordpress.com"] },
  { name: "Rackspace", kind: "hosting", match: ["rackspace"] },
  { name: "Equinix", kind: "hosting", match: ["equinix"] },
  { name: "Leaseweb", kind: "hosting", match: ["leaseweb"] },
  { name: "Contabo", kind: "hosting", match: ["contabo"] },
];

export function matchProvider(...haystacks: Array<string | undefined | null>): KnownProvider | null {
  const text = haystacks.filter(Boolean).join(" ").toLowerCase();

  if (text.trim() === "") {
    return null;
  }

  for (const provider of PROVIDERS) {
    if (provider.match.some((needle) => text.includes(needle))) {
      return provider;
    }
  }

  return null;
}

export type EdgeVerdict = {
  /** True when we are confident a CDN or edge network fronts this address. */
  isCdn: boolean;
  /** Display name of the CDN, when known. */
  cdnName: string;
  /** How the conclusion was reached. */
  source: "api" | "operator" | "none";
  /** Who runs the network, CDN or otherwise. */
  operator: string;
  operatorKind: ProviderKind | "unknown";
};

export type EdgeSignals = {
  apiIsCdn: boolean;
  apiCdnName: string;
  asnOrganization: string;
  companyName: string;
  companyType: string;
};

/** Combines the API flag with local operator matching into one verdict. */
export function classifyEdge(signals: EdgeSignals): EdgeVerdict {
  const matched = matchProvider(signals.asnOrganization, signals.companyName);
  const operator =
    signals.companyName || signals.asnOrganization || matched?.name || "Unknown";

  // The API flag wins when it is set.
  if (signals.apiIsCdn) {
    return {
      isCdn: true,
      cdnName: signals.apiCdnName || matched?.name || "CDN",
      source: "api",
      operator,
      operatorKind: matched?.kind ?? "cdn",
    };
  }

  // Otherwise fall back to recognising a CDN or edge platform by operator.
  if (matched?.kind === "cdn") {
    return {
      isCdn: true,
      cdnName: matched.name,
      source: "operator",
      operator,
      operatorKind: "cdn",
    };
  }

  return {
    isCdn: false,
    cdnName: "",
    source: "none",
    operator,
    operatorKind: matched?.kind ?? inferKind(signals.companyType),
  };
}

function inferKind(companyType: string): ProviderKind | "unknown" {
  const value = companyType.trim().toUpperCase();

  if (value === "HOSTING") {
    return "hosting";
  }

  return value === "" ? "unknown" : "hosting";
}
