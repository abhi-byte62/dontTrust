import { isIP } from 'node:net';

/**
 * IP and SSRF validation protecting control plane and workers from reaching
 * unauthorized internal infrastructure, cloud metadata endpoints, or local loopbacks.
 */
export class IpValidator {
  /**
   * Checks if an IPv4 address string falls into a private/loopback/link-local/reserved range.
   */
  public static isPrivateOrReservedIPv4(ip: string): boolean {
    const parts = ip.split('.').map(p => Number.parseInt(p, 10));
    if (parts.length !== 4 || parts.some(p => Number.isNaN(p) || p < 0 || p > 255)) {
      return true; // Malformed is treated as dangerous
    }

    const [a, b, c, d] = parts;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;

    // 10.0.0.0/8 (RFC 1918 Private)
    if (a === 10) return true;

    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;

    // 169.254.0.0/16 (Link Local / Cloud Instance Metadata e.g. 169.254.169.254)
    if (a === 169 && b === 254) return true;

    // 172.16.0.0/12 (RFC 1918 Private)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16 (RFC 1918 Private)
    if (a === 192 && b === 168) return true;

    // 100.64.0.0/10 (Carrier Grade NAT)
    if (a === 100 && b >= 64 && b <= 127) return true;

    // 198.18.0.0/15 (Benchmarking)
    if (a === 198 && (b === 18 || b === 19)) return true;

    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (a >= 224) return true;

    // 255.255.255.255 (Broadcast)
    if (a === 255 && b === 255 && c === 255 && d === 255) return true;

    return false;
  }

  /**
   * Checks if an IPv6 address is loopback, unique local, or link-local.
   */
  public static isPrivateOrReservedIPv6(ip: string): boolean {
    const normalized = ip.toLowerCase().trim();

    // Loopback ::1
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1' || normalized === '::') {
      return true;
    }

    // Unique Local Addresses (fc00::/7 -> fc00 to fdff)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
      return true;
    }

    // Link-Local (fe80::/10 -> fe80 to febf)
    if (
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    ) {
      return true;
    }

    // IPv4-mapped IPv6 (::ffff:127.0.0.1 etc)
    if (normalized.includes('::ffff:')) {
      const ipv4Part = normalized.split('::ffff:')[1];
      if (ipv4Part && isIP(ipv4Part) === 4) {
        return IpValidator.isPrivateOrReservedIPv4(ipv4Part);
      }
    }

    return false;
  }

  public static isDangerousIP(ip: string): boolean {
    const version = isIP(ip);
    if (version === 4) {
      return IpValidator.isPrivateOrReservedIPv4(ip);
    }
    if (version === 6) {
      return IpValidator.isPrivateOrReservedIPv6(ip);
    }
    return false;
  }
}
