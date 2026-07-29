# `SEC-00001-compromised-dependency` Annex A: Remediation Steps

**Status:** Complete
**Owner:** Security Team
**Applies to:** Engineering, DevOps
**Related:** SEC-00001_REP-investigation.md

---

## 1. Immediate Containment

### 1.1 CI Pipeline Suspension

```bash
# Pause all CI workflows
gh workflow disable --all

# Verify no active runs
gh run list --status in_progress
```

Verification: Zero active runs confirmed at 15:02 UTC.

### 1.2 Package Removal

```bash
# Remove from lockfile
yarn remove event-stream-utils --all

# Verify removal
grep -r "event-stream-utils" yarn.lock
# Expected: no matches

# Clean node_modules
rm -rf node_modules
yarn install --frozen-lockfile
```

Verification: Package absent from all lockfiles at 15:15 UTC.

---

## 2. Secret Rotation

### 2.1 AWS Credentials

- [ ] Rotated IAM access keys for CI service account
- [ ] Rotated IAM access keys for deployment service account
- [ ] Verified old keys are inactive

### 2.2 Database Credentials

- [ ] Rotated production database password
- [ ] Rotated staging database password
- [ ] Updated connection strings in secrets manager

### 2.3 API Keys

- [ ] Rotated Stripe API keys
- [ ] Rotated SendGrid API keys
- [ ] Rotated internal service tokens
- [ ] Rotated GitHub personal access tokens

### 2.4 CI/CD Tokens

- [ ] Regenerated GitHub Actions secrets
- [ ] Regenerated deployment tokens
- [ ] Verified new tokens are functional

---

## 3. Workstation Remediation

### 3.1 Developer Instructions

Sent to all engineering team members:

```bash
# 1. Navigate to affected repositories
cd /path/to/repo

# 2. Remove node_modules
rm -rf node_modules

# 3. Clear yarn cache
yarn cache clean

# 4. Reinstall from clean lockfile
git pull origin main
yarn install --frozen-lockfile

# 5. Run local scanner
yarn security:scan

# 6. Report results to #security-incidents
```

### 3.2 Verification Checklist

| Developer | Workstation | Remediated | Scanner Clean | Reported |
| --------- | ----------- | ---------- | ------------- | -------- |
| @alice    | MBP-001     | Yes        | Yes           | Yes      |
| @bob      | MBP-002     | Yes        | Yes           | Yes      |
| @charlie  | MBP-003     | Yes        | Yes           | Yes      |
| @diana    | MBP-004     | Yes        | Yes           | Yes      |
| @eve      | MBP-005     | Yes        | Yes           | Yes      |
| @frank    | MBP-006     | Yes        | Yes           | Yes      |
| @grace    | MBP-007     | Yes        | Yes           | Yes      |
| @henry    | MBP-008     | Yes        | Yes           | Yes      |

---

## 4. Scanner Rule Update

Added new detection rules:

```yaml
# Added to scanner-rules.yaml
- id: EXFIL-001-ext
  name: Extended exfiltration pattern
  pattern: "fetch.*telemetry-cdn\\.example\\.net"
  severity: critical

- id: EXFIL-001-ext2
  name: Extended exfiltration pattern (secondary)
  pattern: "fetch.*metrics-collector\\.io"
  severity: critical
```

---

## 5. Blocklist Update

Added to `security/blocklist.json`:

```json
{
  "packages": [
    {
      "name": "event-stream-utils",
      "version": "2.1.4",
      "reason": "SEC-00001 - malicious package",
      "added": "2026-01-05"
    }
  ]
}
```

---

## 6. Verification Complete

All remediation steps verified complete at 2026-01-06T18:00:00Z.

- [ ] CI pipelines restored
- [ ] All secrets rotated
- [ ] All workstations clean
- [ ] Scanner rules updated
- [ ] Blocklist updated
- [ ] No evidence of exfiltration
