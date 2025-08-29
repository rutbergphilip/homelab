# Authentik Proxy Authentication Setup Guide

This guide covers the complete setup of Authentik as a proxy authentication layer for your homelab services.

## Overview

Authentik provides OAuth2/OIDC-based authentication with forward auth capabilities for nginx ingress. This setup includes:

- PostgreSQL database for persistent storage
- Redis cache for session management
- Authentik server and worker pods
- Forward authentication configuration for nginx ingress
- Example configuration for Trilium notes service

## Prerequisites

1. Kubernetes cluster with nginx ingress controller
2. cert-manager for TLS certificates
3. external-dns for DNS management
4. SOPS for secret encryption
5. Flux for GitOps deployment

## Initial Setup

### 1. Generate Required Secrets

Before deploying, you need to generate several secrets and update the SOPS-encrypted file:

```bash
# Generate Authentik secret key (base64 encoded)
AUTHENTIK_SECRET_KEY=$(openssl rand -base64 50)

# Generate PostgreSQL password
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Generate Redis password
REDIS_PASSWORD=$(openssl rand -base64 32)

# Generate bootstrap token for initial admin setup
BOOTSTRAP_TOKEN=$(openssl rand -base64 32)

# Generate OAuth2 client secret
OAUTH2_CLIENT_SECRET=$(openssl rand -base64 32)
```

### 2. Update Secrets File

Edit `/kubernetes/apps/security/authentik/app/secrets.sops.yaml` and replace the placeholder values:

```bash
# Edit the secrets file
sops /kubernetes/apps/security/authentik/app/secrets.sops.yaml
```

Replace these placeholders:
- `CHANGE_ME_POSTGRES_PASSWORD` → Generated PostgreSQL password
- `CHANGE_ME_REDIS_PASSWORD` → Generated Redis password  
- `CHANGE_ME_AUTHENTIK_SECRET_KEY_BASE64_ENCODED` → Generated Authentik secret key
- `CHANGE_ME_BOOTSTRAP_TOKEN` → Generated bootstrap token
- `CHANGE_ME_OAUTH2_CLIENT_SECRET` → Generated OAuth2 client secret

For SMTP (optional):
- `CHANGE_ME_SMTP_USERNAME` → Your SMTP username (e.g., Gmail address)
- `CHANGE_ME_SMTP_PASSWORD` → Your SMTP password or app password

### 3. Deploy Authentik

Apply the configurations to deploy Authentik:

```bash
# Deploy the security namespace and Authentik components
kubectl apply -k /kubernetes/apps/security/authentik/
```

### 4. Initial Authentik Configuration

After deployment, access Authentik at `https://auth.rutberg.dev`:

1. **Initial Login**: Use the bootstrap token as both username and password
2. **Change Admin Credentials**: Immediately change the admin password
3. **Create User Groups**: Set up groups like `homelab-users`, `admin`
4. **Add Users**: Create user accounts and assign to appropriate groups

## OAuth2/OIDC Provider Setup

### 1. Create OAuth2/OIDC Provider

Navigate to **Applications → Providers** and create a new OAuth2/OIDC Provider:

- **Name**: `Homelab Forward Auth`
- **Client Type**: `Confidential`
- **Client ID**: `homelab-forward-auth`
- **Client Secret**: Use the `oauth2-client-secret` from your secrets
- **Redirect URIs**: 
  ```
  https://auth.rutberg.dev/outpost.goauthentik.io/callback
  https://trilium.rutberg.dev/outpost.goauthentik.io/callback
  https://*/outpost.goauthentik.io/callback
  ```
- **Scopes**: `openid`, `profile`, `email`
- **Subject Mode**: `Based on User's hashed ID`
- **Include claims in id_token**: `true`

### 2. Create Application

Navigate to **Applications → Applications** and create:

- **Name**: `Trilium Notes`
- **Slug**: `trilium`
- **Provider**: Select the provider created above
- **Policy Engine Mode**: `any` (or configure specific policies)
- **Launch URL**: `https://trilium.rutberg.dev`

### 3. Create Forward Auth Outpost

Navigate to **Applications → Outposts** and create:

- **Name**: `Forward Auth Outpost`
- **Type**: `Proxy`
- **Provider**: Select the OAuth2/OIDC Provider
- **Configuration**:
  - **External Host**: `https://auth.rutberg.dev`
  - **Internal Host**: `http://ak-outpost-forward-auth.security.svc.cluster.local:9000`
  - **Skip Path Regex**: `^/outpost\.goauthentik\.io/`

## Service Configuration

### Trilium Example

To enable authentication for Trilium:

1. **Replace the ingress**: 
   ```bash
   # Backup current ingress
   cp trilium/ingress.yaml trilium/ingress.yaml.backup
   
   # Use the authenticated version
   cp trilium/ingress-with-auth.yaml trilium/ingress.yaml
   ```

2. **Update kustomization.yaml** to include the new ingress.

### Adding Other Services

To add authentication to other services, modify their ingress with these annotations:

```yaml
annotations:
  # Authentik forward authentication
  nginx.ingress.kubernetes.io/auth-url: "https://auth.rutberg.dev/outpost.goauthentik.io/auth/nginx"
  nginx.ingress.kubernetes.io/auth-signin: "https://auth.rutberg.dev/outpost.goauthentik.io/start?rd=$escaped_request_uri"
  nginx.ingress.kubernetes.io/auth-response-headers: "Set-Cookie,X-authentik-username,X-authentik-groups,X-authentik-email,X-authentik-name,X-authentik-uid"
  nginx.ingress.kubernetes.io/auth-snippet: |
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Security Considerations

### 1. Network Policies

Consider implementing Kubernetes Network Policies to restrict traffic:

```yaml
# Allow only necessary ingress traffic to Authentik
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: authentik-network-policy
  namespace: security
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: authentik
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: network
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to:
    - podSelector:
        matchLabels:
          app: authentik-postgresql
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: authentik-redis
    ports:
    - protocol: TCP
      port: 6379
```

### 2. RBAC Configuration

The default Authentik deployment uses least-privilege service accounts. No additional RBAC configuration is required for basic operation.

### 3. Backup Strategy

**Database Backup**:
```bash
# Create PostgreSQL backup
kubectl exec -n security authentik-postgresql-0 -- pg_dump -U authentik authentik > authentik-backup.sql
```

**Configuration Backup**:
- Export Authentik configuration through the admin interface
- Store provider configurations and application settings
- Document custom policies and groups

## Troubleshooting

### Common Issues

1. **502 Bad Gateway on auth URLs**:
   - Check outpost pod status: `kubectl get pods -n security`
   - Verify outpost configuration in Authentik admin
   - Check nginx ingress logs

2. **Authentication loop**:
   - Verify redirect URIs match exactly
   - Check client secret matches between provider and outpost
   - Ensure external host configuration is correct

3. **Database connection errors**:
   - Check PostgreSQL pod status
   - Verify database credentials in secrets
   - Check network connectivity between pods

### Useful Commands

```bash
# Check Authentik pods
kubectl get pods -n security

# View Authentik logs
kubectl logs -n security deployment/authentik-server

# Check outpost logs
kubectl logs -n security -l app.kubernetes.io/name=authentik-outpost

# Test database connection
kubectl exec -n security authentik-postgresql-0 -- psql -U authentik -d authentik -c "SELECT version();"

# Test Redis connection
kubectl exec -n security deployment/authentik-redis -- redis-cli ping
```

## Monitoring and Observability

### Metrics

Authentik exposes Prometheus metrics on port 9300. Add ServiceMonitor:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: authentik
  namespace: security
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: authentik
  endpoints:
  - port: http-metrics
    path: /metrics
```

### Alerting

Consider setting up alerts for:
- Authentik pod restarts
- Database connection failures
- High authentication failure rates
- Certificate expiration

## Scaling Considerations

### High Availability

For production deployments:

1. **Increase replicas**:
   ```yaml
   server:
     replicas: 3
   worker:
     replicas: 2
   ```

2. **Use external PostgreSQL**:
   - Consider managed PostgreSQL service
   - Implement proper backup/restore procedures

3. **Implement Redis clustering**:
   - Use Redis Sentinel or Cluster mode
   - Configure appropriate persistence

### Resource Limits

Monitor resource usage and adjust limits:

```yaml
resources:
  requests:
    cpu: 200m
    memory: 1Gi
  limits:
    cpu: 1000m
    memory: 2Gi
```

## Extending to Other Services

To add authentication to additional services:

1. **Create new application** in Authentik admin
2. **Add redirect URI** for the service domain
3. **Update service ingress** with auth annotations
4. **Configure policies** for access control (optional)

Example services to consider:
- Jellyfin: Media server
- Grafana: Monitoring dashboards  
- Home Assistant: Smart home automation
- Arr stack: Media automation tools

## Security Best Practices

1. **Regular Updates**: Keep Authentik and dependencies updated
2. **Strong Passwords**: Enforce password policies in Authentik
3. **MFA**: Enable multi-factor authentication for admin accounts
4. **Audit Logs**: Monitor authentication events and failures
5. **Network Segmentation**: Use network policies to limit traffic
6. **Secret Rotation**: Regularly rotate database and API secrets
7. **TLS Everywhere**: Ensure all communications use TLS
8. **Backup Testing**: Regularly test backup and restore procedures

## Migration Path

To migrate existing services:

1. **Test with one service** (like Trilium) first
2. **Verify authentication flow** works correctly
3. **Monitor for issues** during initial deployment
4. **Gradually migrate** other services
5. **Document any service-specific** configuration needs