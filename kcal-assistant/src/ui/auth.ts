import { jwtVerify, createRemoteJWKSet, errors as joseErrors, type JWTVerifyGetKey } from "jose";

// The /ui surface is gated by an identity provider at the ingress, but the
// server trusts nothing: it re-checks the provider's forwarded identity on
// every request. Two providers are supported:
//   - Cloudflare Access: verify the Cf-Access-Jwt-Assertion JWT cryptographically.
//   - Authentik forward-auth: verify the X-authentik-email header equals the
//     allowed identity. Safe because (a) nginx replaces any client-supplied
//     X-authentik-* with the outpost's value via auth-response-headers, and
//     (b) a NetworkPolicy restricts the pod to the ingress controller, so the
//     header can't be forged by bypassing nginx in-cluster.

export type UiAuthResult = { ok: true } | { ok: false; status: 403 | 503; message: string };

export type UiVerify = (headerValue: string | undefined) => Promise<UiAuthResult>;

export interface CfAuthOptions {
  getKey: JWTVerifyGetKey;
  issuer: string;
  audience: string;
  email: string;
}

export function createCfAuth(opts: CfAuthOptions): UiVerify {
  return async (headerValue) => {
    if (!headerValue) return { ok: false, status: 403, message: "saknar autentisering" };
    try {
      const { payload } = await jwtVerify(headerValue, opts.getKey, {
        algorithms: ["RS256"], // pinned — removes the alg-confusion class
        issuer: opts.issuer,
        audience: opts.audience,
        clockTolerance: 60,
      });
      const email = typeof payload.email === "string" ? payload.email : "";
      if (email.toLowerCase() !== opts.email.toLowerCase()) {
        return { ok: false, status: 403, message: "fel identitet" };
      }
      return { ok: true };
    } catch (e) {
      if (e instanceof joseErrors.JOSEError) {
        return { ok: false, status: 403, message: "ogiltig autentisering" };
      }
      return { ok: false, status: 503, message: "autentisering otillgänglig" };
    }
  };
}

// Retained name for the existing CF test-suite.
export const createUiAuth = createCfAuth;

export function createAuthentikAuth(allowedEmail: string): UiVerify {
  const wanted = allowedEmail.toLowerCase();
  return async (headerValue) => {
    if (!headerValue) return { ok: false, status: 403, message: "saknar autentisering" };
    if (headerValue.trim().toLowerCase() !== wanted) {
      return { ok: false, status: 403, message: "fel identitet" };
    }
    return { ok: true };
  };
}

export type UiAuthState =
  | { mode: "configured"; header: string; verify: UiVerify }
  | { mode: "unconfigured" }
  | { mode: "dev-bypass" };

export function resolveUiAuthState(input: {
  authentikEmail?: string;
  teamDomain?: string;
  aud?: string;
  email?: string;
  devNoAuth: boolean;
  nodeEnv?: string;
}): UiAuthState {
  if (input.devNoAuth) {
    if (input.nodeEnv === "production") {
      console.error("UI_DEV_NO_AUTH is REFUSED in production — UI stays fail-closed");
      return { mode: "unconfigured" };
    }
    console.warn("UI auth DISABLED (UI_DEV_NO_AUTH=1) — dev only");
    return { mode: "dev-bypass" };
  }
  // Authentik forward-auth takes precedence when configured.
  if (input.authentikEmail) {
    return {
      mode: "configured",
      header: "x-authentik-email",
      verify: createAuthentikAuth(input.authentikEmail),
    };
  }
  // Cloudflare Access (legacy path, kept for portability).
  if (input.teamDomain && input.aud && input.email) {
    if (!input.teamDomain.endsWith(".cloudflareaccess.com")) {
      throw new Error(
        `CF_ACCESS_TEAM_DOMAIN must be the full <team>.cloudflareaccess.com host, got: ${input.teamDomain}`,
      );
    }
    const issuer = `https://${input.teamDomain}`;
    return {
      mode: "configured",
      header: "cf-access-jwt-assertion",
      verify: createCfAuth({
        getKey: createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)),
        issuer,
        audience: input.aud,
        email: input.email,
      }),
    };
  }
  return { mode: "unconfigured" };
}
