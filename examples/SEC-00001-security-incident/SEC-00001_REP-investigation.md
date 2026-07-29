# `SEC-00001-compromised-dependency` Compromised npm Dependency Investigation

**Status:** Closed
**Owner:** Security Team
**Applies to:** Engineering, DevOps, Compliance
**Related:** SOP-00012 (Incident Response), POL-00003 (Dependency Management)

---

## Executive Summary

On 2026-01-05, the internal security scanner detected malicious code in a
transitive npm dependency (`event-stream-utils@2.1.4`). The package contained
obfuscated JavaScript targeting environment variables and cryptocurrency
private keys. Immediate containment actions were taken, and no evidence of
successful exfiltration was found.

## Detection

The compromise was detected at 14:32 UTC by the automated dependency scanner
during a routine CI pipeline run. The scanner flagged the package for:

- Obfuscated string literals matching known exfiltration patterns
- Network calls to domains not present in the declared package functionality
- Access to `process.env` with base64 encoding of values

## Scope Assessment

Affected systems:

- CI/CD pipeline runners (3 instances)
- Developer workstations (estimated 8)
- Staging environment (1 instance)

The package was introduced as a transitive dependency of `@example/logger@4.2.0`
which was added to the monorepo on 2026-01-03.

## Timeline

| Time (UTC)         | Event                                           |
| ------------------ | ----------------------------------------------- |
| 2026-01-03 09:15   | Dependency added to package.json                |
| 2026-01-05 14:32   | Scanner detection triggered                     |
| 2026-01-05 14:45   | Security team notified                          |
| 2026-01-05 15:00   | CI pipelines paused                             |
| 2026-01-05 15:10   | Affected package removed from lockfile          |
| 2026-01-05 16:30   | Network log analysis completed                  |
| 2026-01-06 10:00   | Workstation remediation completed               |
| 2026-01-06 18:00   | All systems verified clean                      |
| 2026-01-07 00:00   | Investigation closed                            |

## Root Cause

The upstream package `event-stream-utils` was compromised via a maintainer
account takeover. The malicious version was published approximately 48 hours
before detection. The attack followed a known pattern where dormant packages
with broad install bases are targeted.

## Impact Assessment

No evidence of successful data exfiltration was found:

- Network logs showed no outbound connections to C2 domains
- Environment variables were rotated as a precaution
- No unauthorized transactions detected on monitored addresses

## Remediation Actions

1. Removed compromised package from all lockfiles
2. Rotated all environment secrets and API keys
3. Regenerated CI/CD tokens
4. Added package hash to internal blocklist
5. Updated scanner rules with new IOC patterns
6. Notified npm security team

## Recommendations

1. Implement lockfile integrity verification in CI pre-flight
2. Add network egress monitoring to CI runners
3. Review transitive dependency policy (max depth)
4. Consider vendoring critical dependencies

## Annexes

- **Annex A**: Remediation verification checklist
- **IOC**: Indicators of compromise (hashes, domains, addresses)
- **EVD**: Raw scanner output

---

*This document is classified INTERNAL. Do not distribute outside the organization.*
