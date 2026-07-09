import { jwtVerify, createRemoteJWKSet, errors as joseErrors, type JWTVerifyGetKey } from "jose";

// Cloudflare Access sits at the edge, but the server trusts nothing: every
// /ui request must carry a Cf-Access-Jwt-Assertion JWT that we verify
// cryptographically. Header only — never the CF_Authorization cookie.

export type UiAuthResult = { ok: true } | { ok: false; status: 403 | 503; message: string };

export interface UiAuthOptions {
  getKey: JWTVerifyGetKey;
  issuer: string;
  audience: string;
  email: string;
}

export type UiVerify = (headerValue: string | undefined) => Promise<UiAuthResult>;

export function createUiAuth(opts: UiAuthOptions): UiVerify {
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
      // Token problems (signature, claims, format) => 403. Anything else —
      // e.g. the JWKS fetch failing — is an infrastructure problem => 503,
      // still closed but distinguishable from a forged token.
      if (e instanceof joseErrors.JOSEError) {
        return { ok: false, status: 403, message: "ogiltig autentisering" };
      }
      return { ok: false, status: 503, message: "autentisering otillgänglig" };
    }
  };
}

export type UiAuthState =
  | { mode: "configured"; verify: UiVerify }
  | { mode: "unconfigured" }
  | { mode: "dev-bypass" };

export function resolveUiAuthState(input: {
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
  if (!input.teamDomain || !input.aud || !input.email) return { mode: "unconfigured" };
  if (!input.teamDomain.endsWith(".cloudflareaccess.com")) {
    throw new Error(
      `CF_ACCESS_TEAM_DOMAIN must be the full <team>.cloudflareaccess.com host, got: ${input.teamDomain}`,
    );
  }
  const issuer = `https://${input.teamDomain}`;
  return {
    mode: "configured",
    verify: createUiAuth({
      getKey: createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)),
      issuer,
      audience: input.aud,
      email: input.email,
    }),
  };
}
