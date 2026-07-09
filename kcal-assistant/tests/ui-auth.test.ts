import { describe, expect, test, beforeAll } from "bun:test";
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from "jose";
import { createUiAuth, createAuthentikAuth, resolveUiAuthState } from "../src/ui/auth";

const ISSUER = "https://test.cloudflareaccess.com";
const AUD = "test-aud-tag";
const EMAIL = "test@example.com";

let signKey: CryptoKey;
let getKey: ReturnType<typeof createLocalJWKSet>;
let foreignKey: CryptoKey;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  signKey = pair.privateKey as CryptoKey;
  getKey = createLocalJWKSet({ keys: [{ ...(await exportJWK(pair.publicKey)), alg: "RS256" }] });
  const foreign = await generateKeyPair("RS256");
  foreignKey = foreign.privateKey as CryptoKey;
});

function token(overrides: { email?: string; aud?: string | string[]; iss?: string; exp?: string; key?: CryptoKey } = {}) {
  return new SignJWT({ email: overrides.email ?? EMAIL })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(overrides.iss ?? ISSUER)
    .setAudience(overrides.aud ?? AUD)
    .setIssuedAt()
    .setExpirationTime(overrides.exp ?? "5m")
    .sign(overrides.key ?? signKey);
}

function auth() {
  return createUiAuth({ getKey, issuer: ISSUER, audience: AUD, email: EMAIL });
}

describe("createUiAuth", () => {
  test("valid token passes", async () => {
    expect((await auth()(await token())).ok).toBe(true);
  });

  test("email matching is case-insensitive", async () => {
    expect((await auth()(await token({ email: "TEST@Example.com" }))).ok).toBe(true);
  });

  test("multi-audience token containing the right AUD passes", async () => {
    expect((await auth()(await token({ aud: [AUD, "other-app"] }))).ok).toBe(true);
  });

  test("wrong email, wrong aud, wrong issuer, expired all fail 403", async () => {
    const verify = auth();
    for (const bad of [
      await token({ email: "attacker@example.com" }),
      await token({ aud: "other-aud" }),
      await token({ iss: "https://evil.cloudflareaccess.com" }),
      await token({ exp: "-5m" }),
    ]) {
      const result = await verify(bad);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(403);
    }
  });

  test("missing header, garbage, foreign key, alg:none all fail 403", async () => {
    const verify = auth();
    const algNone = `${btoa(JSON.stringify({ alg: "none" }))}.${btoa(
      JSON.stringify({ email: EMAIL, iss: ISSUER, aud: AUD, exp: Math.floor(Date.now() / 1000) + 300 }),
    )}.`;
    for (const bad of [undefined, "garbage", await token({ key: foreignKey }), algNone]) {
      const result = await verify(bad);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(403);
    }
  });

  test("JWKS network failure yields 503, not 403", async () => {
    const verify = createUiAuth({
      getKey: () => {
        throw new TypeError("fetch failed");
      },
      issuer: ISSUER,
      audience: AUD,
      email: EMAIL,
    });
    const result = await verify(await token());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });
});

describe("resolveUiAuthState", () => {
  const env = {
    teamDomain: "test.cloudflareaccess.com",
    aud: AUD,
    email: EMAIL,
  };

  test("all envs set yields configured state", () => {
    const state = resolveUiAuthState({ ...env, devNoAuth: false, nodeEnv: "production" });
    expect(state.mode).toBe("configured");
  });

  test("missing envs yield unconfigured (fail closed)", () => {
    const state = resolveUiAuthState({ devNoAuth: false, nodeEnv: "production" });
    expect(state.mode).toBe("unconfigured");
  });

  test("bad team domain refused", () => {
    expect(() =>
      resolveUiAuthState({ ...env, teamDomain: "evil.example.com", devNoAuth: false, nodeEnv: "production" }),
    ).toThrow(/cloudflareaccess/);
  });

  test("dev bypass works outside production, REFUSED in production", () => {
    expect(resolveUiAuthState({ devNoAuth: true, nodeEnv: "development" }).mode).toBe("dev-bypass");
    expect(resolveUiAuthState({ devNoAuth: true, nodeEnv: "production" }).mode).toBe("unconfigured");
  });

  test("CF configured state reads the CF header", () => {
    const state = resolveUiAuthState({ ...env, devNoAuth: false, nodeEnv: "production" });
    expect(state.mode).toBe("configured");
    if (state.mode === "configured") expect(state.header).toBe("cf-access-jwt-assertion");
  });

  test("Authentik email takes precedence and reads the authentik header", () => {
    const state = resolveUiAuthState({
      ...env,
      authentikEmail: "philip@rutberg.dev",
      devNoAuth: false,
      nodeEnv: "production",
    });
    expect(state.mode).toBe("configured");
    if (state.mode === "configured") expect(state.header).toBe("x-authentik-email");
  });
});

describe("createAuthentikAuth", () => {
  const auth = createAuthentikAuth("Philip@Rutberg.dev");

  test("accepts the allowed email case-insensitively", async () => {
    expect((await auth("philip@rutberg.dev")).ok).toBe(true);
    expect((await auth("PHILIP@RUTBERG.DEV ")).ok).toBe(true); // trims + folds case
  });

  test("rejects wrong or missing email with 403", async () => {
    for (const bad of [undefined, "", "attacker@evil.com"]) {
      const r = await auth(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.status).toBe(403);
    }
  });
});
