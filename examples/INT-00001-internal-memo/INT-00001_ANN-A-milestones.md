# `INT-00001-q1-engineering-priorities` Annex A: Milestone Breakdown

**Status:** Final
**Owner:** Engineering Leadership
**Applies to:** Engineering, Product
**Related:** INT-00001_MEM-main.md

---

## Infrastructure Milestones

| ID   | Milestone                        | Owner    | Target Date | Dependencies |
| ---- | -------------------------------- | -------- | ----------- | ------------ |
| I-01 | Circuit breaker design complete  | Platform | Jan 15      | None         |
| I-02 | Circuit breakers deployed (P0)   | Platform | Jan 31      | I-01         |
| I-03 | Circuit breakers deployed (all)  | Platform | Feb 15      | I-02         |
| I-04 | Redundant RPC evaluation         | SRE      | Jan 20      | None         |
| I-05 | Redundant RPC deployed           | SRE      | Feb 10      | I-04         |
| I-06 | Multi-region DB design           | Platform | Jan 25      | None         |
| I-07 | Multi-region DB staging          | Platform | Feb 20      | I-06         |
| I-08 | Multi-region DB production       | Platform | Mar 15      | I-07         |

## Security Milestones

| ID   | Milestone                        | Owner    | Target Date | Dependencies |
| ---- | -------------------------------- | -------- | ----------- | ------------ |
| S-01 | CI scanner integration           | Security | Jan 20      | None         |
| S-02 | Network egress monitoring design | Security | Jan 25      | None         |
| S-03 | Network egress monitoring deploy | SRE      | Feb 15      | S-02         |
| S-04 | SOC 2 gap analysis               | Security | Jan 31      | None         |
| S-05 | SOC 2 remediation plan           | Security | Feb 15      | S-04         |
| S-06 | SOC 2 controls implemented       | Security | Mar 15      | S-05         |

## Developer Experience Milestones

| ID   | Milestone                        | Owner    | Target Date | Dependencies |
| ---- | -------------------------------- | -------- | ----------- | ------------ |
| D-01 | CI pipeline analysis             | DevTools | Jan 15      | None         |
| D-02 | CI pipeline optimization (v1)    | DevTools | Feb 01      | D-01         |
| D-03 | CI pipeline optimization (v2)    | DevTools | Feb 28      | D-02         |
| D-04 | HMR implementation               | DevTools | Feb 15      | None         |
| D-05 | TypeScript strict mode (50%)     | Platform | Feb 01      | None         |
| D-06 | TypeScript strict mode (100%)    | Platform | Mar 01      | D-05         |
| D-07 | Component library v1             | DevTools | Mar 15      | None         |

## Feature Delivery Milestones

| ID   | Milestone                        | Owner    | Target Date | Dependencies |
| ---- | -------------------------------- | -------- | ----------- | ------------ |
| F-01 | Limit orders design              | Product  | Jan 15      | None         |
| F-02 | Limit orders implementation      | Product  | Feb 01      | F-01         |
| F-03 | Limit orders QA                  | Product  | Feb 10      | F-02         |
| F-04 | Limit orders launch              | Product  | Feb 15      | F-03         |
| F-05 | Analytics dashboard design       | Product  | Jan 20      | None         |
| F-06 | Analytics dashboard impl         | Product  | Feb 15      | F-05         |
| F-07 | Analytics dashboard launch       | Product  | Mar 01      | F-06         |
| F-08 | Mobile v2.0 biometric impl       | Mobile   | Feb 01      | None         |
| F-09 | Mobile v2.0 QA                   | Mobile   | Mar 01      | F-08         |
| F-10 | Mobile v2.0 launch               | Mobile   | Mar 15      | F-09         |

---

## Critical Path

The following milestones are on the critical path for Q1 success:

1. I-08 (Multi-region DB) -- blocks 99.95% SLA commitment
2. S-06 (SOC 2 controls) -- blocks audit readiness
3. D-03 (CI optimization) -- blocks velocity improvement
4. F-04, F-07, F-10 (Feature launches) -- blocks product commitments

Risk mitigation for critical path items is documented in the project tracker.
