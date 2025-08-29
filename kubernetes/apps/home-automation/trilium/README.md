# Trilium Authentication Setup

## Current State
- `ingress.yaml` - Original ingress without authentication (currently active)
- `ingress-with-auth.yaml` - Ingress with Authentik forward authentication 
- `ingress.yaml.backup` - Backup of original ingress

## To Enable Authentication

When Authentik is deployed and configured, switch to the authenticated ingress:

```bash
# Switch to authenticated ingress
cd kubernetes/apps/home-automation/trilium/
cp ingress.yaml.backup ingress-original.yaml  # Keep original as backup
cp ingress-with-auth.yaml ingress.yaml
```

## To Disable Authentication

To revert to direct access:

```bash
# Switch back to direct access
cd kubernetes/apps/home-automation/trilium/
cp ingress-original.yaml ingress.yaml
```

## Notes

- The authenticated ingress uses `trilium.rutberg.dev` (same as original)
- The TLS certificate name has been updated to match the hostname
- Additional security headers are included in the authenticated version
- Authentication requires users to log in via `auth.rutberg.dev` first