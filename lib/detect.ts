import "server-only";

import dns from "node:dns/promises";
import { isIP } from "node:net";

import { classifyEdge, type EdgeVerdict } from "@/lib/providers";
import { normalizeHostname } from "@/lib/hostname";

type JsonObject = Record<string, unknown>;

export type EdgeNode = EdgeVerdict & {
  ip: string;
  version: 4 | 6;
  isAnycast: boolean;
  asNumber: string;
  countryName: string;
  countryEmoji: string;
  city: string;
};

export type DetectionData = {
  /** The hostname queried, or the IP when one was entered directly. */
  target: string;
  /** True when the input was already an IP, so no DNS lookup happened. */
  wasIp: boolean;
  ipv4: string[];
  ipv6: string[];
  nodes: EdgeNode[];
  /** Distinct CDN names across all resolved addresses. */
  cdnNames: string[];
  /** Distinct operators across all resolved addresses. */
  operators: string[];
  usesCdn: boolean;
  anycast: boolean;
  /** Set when DNS returned more records than we looked up. */
  truncatedRecords: boolean;
};

export type DetectionResult =
  | { ok: true; data: DetectionData }
  | { ok: false; error: { title: string; message: string } };

const ENDPOINT = "https://api.ipgeolocation.io/v3/ipgeo-bulk";
const FIELDS = [
  "ip",
  "network",
  "asn",
  "company",
  "location.country_name",
  "location.country_emoji",
  "location.city",
].join(",");

/** Enough to show the edge spread without burning credits. */
const MAX_IPV4 = 4;
const MAX_IPV6 = 2;

export async function detectTarget(input: string): Promise<DetectionResult> {
  const raw = input.trim();

  if (!raw) {
    return fail("Missing input", "Enter a domain name or an IP address.");
  }

  if (isIP(raw) !== 0) {
    return lookupAddresses({
      target: raw,
      wasIp: true,
      ipv4: isIP(raw) === 4 ? [raw] : [],
      ipv6: isIP(raw) === 6 ? [raw] : [],
      truncatedRecords: false,
    });
  }

  const hostname = normalizeHostname(raw);

  if (!hostname) {
    return fail(
      "Invalid input",
      `"${raw}" is not a valid domain name or IP address.`,
    );
  }

  let ipv4: string[] = [];
  let ipv6: string[] = [];

  try {
    [ipv4, ipv6] = await Promise.all([
      dns.resolve4(hostname).catch(() => [] as string[]),
      dns.resolve6(hostname).catch(() => [] as string[]),
    ]);
  } catch {
    return fail(
      "DNS lookup failed",
      `Could not resolve "${hostname}". Check the spelling and try again.`,
    );
  }

  if (ipv4.length === 0 && ipv6.length === 0) {
    return fail(
      "No DNS records",
      `"${hostname}" did not return any A or AAAA records.`,
    );
  }

  const truncatedRecords = ipv4.length > MAX_IPV4 || ipv6.length > MAX_IPV6;

  return lookupAddresses({
    target: hostname,
    wasIp: false,
    ipv4: ipv4.slice(0, MAX_IPV4),
    ipv6: ipv6.slice(0, MAX_IPV6),
    truncatedRecords,
  });
}

async function lookupAddresses({
  target,
  wasIp,
  ipv4,
  ipv6,
  truncatedRecords,
}: {
  target: string;
  wasIp: boolean;
  ipv4: string[];
  ipv6: string[];
  truncatedRecords: boolean;
}): Promise<DetectionResult> {
  const ips = [...ipv4, ...ipv6];
  const apiKey = process.env.IPGEOLOCATION_API_KEY;

  if (!apiKey) {
    return fail(
      "Missing API key",
      "Set IPGEOLOCATION_API_KEY in your .env file before starting the app.",
    );
  }

  let payload: unknown;

  try {
    const params = new URLSearchParams({ apiKey, include: "network", fields: FIELDS });
    const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ips }),
    });

    if (!response.ok) {
      const body = (await safeReadJson(response)) as JsonObject | null;
      return fail(
        "Lookup failed",
        readString(body?.message) ??
          `The network lookup failed with status ${response.status}.`,
      );
    }

    payload = await safeReadJson(response);
  } catch (error) {
    return fail(
      "Network error",
      error instanceof Error
        ? error.message
        : "The network lookup could not be completed.",
    );
  }

  if (!Array.isArray(payload)) {
    return fail("Unexpected response", "The API returned an unexpected bulk response.");
  }

  // Bulk results are positional: failures are {message} with no ip field, and
  // IPv6 comes back expanded, so the index is the only safe join key.
  const nodes: EdgeNode[] = [];

  ips.forEach((ip, index) => {
    const entry = asObject(payload[index]);

    if (!entry || readString(entry.message)) {
      return;
    }

    const network = asObject(entry.network);
    const asn = asObject(entry.asn);
    const company = asObject(entry.company);
    const location = asObject(entry.location);

    const verdict = classifyEdge({
      apiIsCdn: network?.is_cdn === true,
      apiCdnName: readString(network?.cdn_provider_name) ?? "",
      asnOrganization: readString(asn?.organization) ?? "",
      companyName: readString(company?.name) ?? "",
      companyType: readString(company?.type) ?? "",
    });

    nodes.push({
      ...verdict,
      ip,
      version: isIP(ip) === 6 ? 6 : 4,
      isAnycast: network?.is_anycast === true,
      asNumber: readString(asn?.as_number) ?? "",
      countryName: readString(location?.country_name) ?? "",
      countryEmoji: readString(location?.country_emoji) ?? "",
      city: readString(location?.city) ?? "",
    });
  });

  if (nodes.length === 0) {
    return fail(
      "No data",
      "None of the resolved addresses returned network details.",
    );
  }

  return {
    ok: true,
    data: {
      target,
      wasIp,
      ipv4,
      ipv6,
      nodes,
      cdnNames: unique(nodes.filter((node) => node.isCdn).map((node) => node.cdnName)),
      operators: unique(nodes.map((node) => node.operator)),
      usesCdn: nodes.some((node) => node.isCdn),
      anycast: nodes.some((node) => node.isAnycast),
      truncatedRecords,
    },
  };
}

function unique(values: string[]) {
  return [...new Set(values.filter((value) => value.trim() !== ""))];
}

function fail(title: string, message: string): DetectionResult {
  return { ok: false, error: { title, message } };
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

async function safeReadJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
