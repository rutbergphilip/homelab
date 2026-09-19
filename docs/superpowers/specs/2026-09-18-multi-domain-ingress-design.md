# Multi-domain ingress

**Date:** 2026-09-18
**Status:** Design approved, plumbing not yet landed — blocked on a Cloudflare zone
**Scope:** Let the cluster serve apps on more than one domain, chosen per ingress

## Why this is not already possible

The repo has exactly one domain baked in. `SECRET_DOMAIN` (`rutberg.dev`) comes
from the SOPS-encrypted `cluster-secrets` Secret and is substituted by Flux's
`postBuild` into every manifest that needs it. Five places consume it, and each
one is single-valued today:

| Component | File | Coupling |
|---|---|---|
| Tunnel routing | `network/external/cloudflared/configs/config.yaml` | Ingress rules match `${SECRET_DOMAIN}` and `*.${SECRET_DOMAIN}` only |
| Tunnel DNS | `network/external/cloudflared/dnsendpoint.yaml` | One `external.${SECRET_DOMAIN}` CNAME to the tunnel |
| Public DNS | `network/external/external-dns/helmrelease.yaml` | `domainFilters: ["${SECRET_DOMAIN}"]` — external-dns ignores every other zone |
| Certificate issuance | `cert-manager/cert-manager/app/clusterissuer.yaml` | DNS01 solver `dnsZones: ["${SECRET_DOMAIN}"]` |
| Default TLS | `cert-manager/cert-manager/tls/certificate.yaml` | One wildcard cert, set as nginx's `default-ssl-certificate` |

Nothing here is hard to extend. Each is additive.

## The blocker, and why it is not a code problem

`philiprutberg.com` is registered at Porkbun (created 2022-08-05, expires
2027-08-05), its nameservers are Porkbun's, and it currently resolves to
`76.76.21.21` — a live Vercel deployment serving "Philip Rutberg - Portfolio".
It is **not** a zone in the Cloudflare account, which holds `rutberg.dev` and
nothing else.

That matters because the only inbound path into this cluster is the Cloudflare
tunnel, and Cloudflare will not proxy a hostname for a zone it is not
authoritative for. Pointing `app.philiprutberg.com` at `external.rutberg.dev`
with a CNAME from Porkbun does not work: the request reaches Cloudflare's edge
with a Host header for an unknown zone and is rejected before it ever reaches
the tunnel. There is no DNS trick that avoids this.

So serving any `philiprutberg.com` hostname from the cluster requires moving
that zone's DNS to Cloudflare. That is a migration of a live site, and it is a
human step (see Prerequisites).

## Design

Add a second substitution variable rather than generalising to a list. A list
would need every consumer to iterate, which Kustomize cannot do without a
templating layer the repo deliberately does not have. Two named variables stay
readable and diff cleanly; a third domain is the same edit again.

`cluster-secrets` gains `SECRET_DOMAIN_ALT`. Then:

1. **Tunnel** learns two more ingress rules, apex and wildcard, pointing at the
   same `external-ingress-nginx` service. One tunnel, not two — the tunnel
   routes by hostname and has no per-domain state.
2. **Tunnel DNS** gains an `external.${SECRET_DOMAIN_ALT}` CNAME to the same
   `02c0d90f-…cfargotunnel.com` target.
3. **external-dns** gains the zone in `domainFilters`. It already uses one
   Cloudflare token, so the token must cover both zones.
4. **ClusterIssuer** gains a second `solvers` entry selecting the new
   `dnsZones`. Same Cloudflare credential, same DNS01 mechanism.
5. **A second wildcard Certificate** is issued for the alt domain into its own
   secret.

### How an app picks its domain

nginx serves `default-ssl-certificate` (the `rutberg.dev` wildcard) to any
ingress that declares no `tls` block, which is why most apps here carry none.
An app on the alt domain therefore differs by exactly three things:

```yaml
metadata:
  annotations:
    external-dns.alpha.kubernetes.io/target: "external.${SECRET_DOMAIN_ALT}"
spec:
  ingressClassName: external
  rules:
    - host: "myapp.${SECRET_DOMAIN_ALT}"
      # ...
  tls:
    - hosts: ["myapp.${SECRET_DOMAIN_ALT}"]
      secretName: "${SECRET_DOMAIN_ALT/./-}-production-tls"
```

That is the "annotate which domain" ergonomics: the host and the target
annotate the domain, and the `tls` block points at the matching wildcard.
Everything else — ingress class, tunnel, cert renewal — is unchanged.

### What stays single-domain on purpose

`k8s-gateway` keeps serving only `rutberg.dev` for LAN split-DNS. Internal
service discovery is a homelab concern, and the alt domain exists to publish
things outward. Pi-hole's conditional forwarding for `rutberg.dev` likewise
stays as-is.

## Prerequisites (human steps, in order)

These must happen before the plumbing is landed, because cert-manager and
external-dns will both error continuously against a zone that is not there.

1. **Inventory the current Porkbun DNS** for `philiprutberg.com`. At minimum
   the apex `A 76.76.21.21` and `www CNAME cname.vercel-dns.com`, plus any MX
   or TXT records — email and domain-verification records are the usual
   casualties of a nameserver move.
2. **Add the zone in Cloudflare** and recreate every record from step 1 *before*
   changing nameservers. Set the Vercel records to DNS-only (grey cloud);
   proxying them through Cloudflare breaks Vercel's own certificate handling.
3. **Change the nameservers at Porkbun** to the pair Cloudflare assigns. Allow
   for propagation; the site keeps serving from Vercel throughout if step 2 was
   complete.
4. **Re-scope the Cloudflare API token** to cover both zones. The current token
   is scoped to `rutberg.dev` alone — verified by listing zones with it, which
   returns exactly one. The same token is used by external-dns and cert-manager,
   so one re-scope covers both.
5. **Update the SOPS secret** with the new domain, then land the plumbing.

Only after step 4 does `external-dns` stop being a no-op for the new zone.

## Risks

- **The portfolio site is live.** Every risk here is concentrated in the
  nameserver change. Recreating records first (step 2) makes the switch a
  no-op from a visitor's perspective; skipping it causes an outage that lasts
  as long as DNS propagation.
- **Cloudflare proxying defaults.** external-dns runs with `--cloudflare-proxied`,
  so records *it* creates are proxied. The hand-created Vercel records are not
  managed by external-dns and must be left DNS-only. They do not collide as long
  as the homelab uses subdomains Vercel does not.
- **Wildcard certificate scope.** A `*.philiprutberg.com` wildcard does not cover
  the apex; the Certificate lists both, as the existing one does for `rutberg.dev`.

## Alternatives rejected

- **Second Cloudflare tunnel per domain.** No benefit. The tunnel routes on
  hostname and the existing one already fronts the same nginx service.
- **Keeping DNS at Porkbun and CNAME-ing into the tunnel.** Does not work;
  Cloudflare rejects hostnames outside its zones (error 1014).
- **Generalising `SECRET_DOMAIN` into a list.** Kustomize has no loop, so every
  consumer would need a templating layer. Two variables cost less than that.
