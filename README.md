# Record Schema

A specification and starter kit for organizing **records** as directories with stable IDs, typed
documents, and machine-readable metadata.

This convention is intentionally:

- **Machine-lintable** (names, structure, metadata)
- **Human-readable** (slugs, structured docs)
- **Non-limiting** (unknown categories remain valid)

## Scope and boundaries

This repository publishes specification/registry **Schema Materials** for the Record Schema convention.

- **Schema Materials only.** This repo is a schema/spec starter kit. It is not a production system, service, or
  implementation, and it does not grant any production-use rights to Protocol IP.
- **Implementations are separately licensed.** Any implementation that uses this convention does so under its own
  terms and any applicable IP License Framework or other written agreement with the IP holder.
- **No operational control; no agency.** Publication, maintenance, or contribution here does not create any duty or
  authority to direct, supervise, or control any implementer, licensee, contributor, or third party.
- **No professional advice.** Nothing in this repository is legal, tax, investment, or other professional advice.


## Specifications

Human-readable specifications live in `specifications/`:

| Specification | Description |
|---------------|-------------|
| [SPEC.md](specifications/SPEC.md) | Core convention for naming, structure, and metadata |
| [UPSTREAM.md](specifications/UPSTREAM.md) | Upstream/lineage declaration (`SCHEMA_UPSTREAM.yaml`) and resolution hints |
| [FORMATTING.md](specifications/FORMATTING.md) | Formatting and normalization rules (baseline + `canonical-ascii`) |
| [PACK_ARCHITECTURE.md](specifications/PACK_ARCHITECTURE.md) | Formatting pack and render pack architecture |
| [CHARTS.md](specifications/CHARTS.md) | Chart/diagram DSL with proper escaping and multiline labels |

## Contents

- `specifications/` - human-readable specification documents
- `schema/` - JSON Schemas for metadata, registries, and typed structured documents
- `registry/` - suggested series codes, document type codes, and commitment kind codes
  (non-limiting)

  Note: `REG` is the doc type for a register-style list/table document; a repo that stores many records may still be called a "registry repo" in plain English.
- `formatting/` - reusable formatting packs, shapes, and templates referenced by profiles
- `templates/` - starter record packs (minimal, DAO, security, legal)
- `examples/` - example records that validate against the schemas

## Core concepts

Each record is a directory named:

```
<SER>-<NNNNN>-<slug>/
```

Inside the directory, documents are named:

```
<SER>-<NNNNN>_<DOC>-<short-description>.<ext>
```

The metadata file is always:

```
<SER>-<NNNNN>_META.yaml
```


Optional but common additions:

- Per-record index (multipart records): `{RECORD_ID}_IND-index.md`
- Compiled filing/submission packet (derived): `{RECORD_ID}_PKT-filing.pdf`

### Required baseline files (normative)

Each record MUST contain:

- `{RECORD_ID}_META.yaml`
- At least one primary document:
  - `{RECORD_ID}_DOC-main.md`, or
  - `{RECORD_ID}_MEM-main.md`

Each record SHOULD contain:

- `{RECORD_ID}_LOG-notes.md` (if the record evolves)

See `specifications/SPEC.md` for the full normative requirements and regexes.

### Markdown envelope (recommended)

For Markdown documents (e.g., `DOC`, `MEM`, `SOP`), prefer the standard header envelope from
`specifications/SPEC.md`:

```md
# `<SER>-<NNNNN>-<slug>` <TITLE>

**Status:** <value>
**Owner:** <value>
**Applies to:** <value>
**Related:** <value>

---
```

Profiles MAY additionally require a standard footer/disclaimer (commonly for `MEM`) and MAY define a
hash surface that hashes only the body (excluding the header/footer) for stability.

- `SER` is a 2-5 letter ASCII uppercase series code (`[A-Z]{2,5}`).
- `NNNNN` is a 5-digit, zero-padded series counter (`\d{5}`).
- `slug` and `short-description` are lowercase kebab-case.

Series codes are intentionally flexible. This repo provides a small set of **core** suggestions plus
a larger list of **suggested** series, but tooling should not block unknown series.

### Formatting profile (normative hook)

If a repository needs strict, reproducible source text (adopted text surfaces, filings, hashed
sources), declare a formatting profile in metadata and validate it in tooling:

```yaml
extensions:
  formatting:
    profile: canonical-ascii # see specifications/FORMATTING.md
  language:
    locale: en-US # or en-GB
```

### Document metadata blocks (optional)

Documents MAY include a machine-readable metadata block at the end of the file (PEM-style delimiters
per `specifications/FORMATTING.md`). When computing a hash surface (e.g., `markdown-body-v1`), tooling SHOULD
exclude the metadata block.

### Verifiable licenses

Custom licenses use the existing header structure plus a repeated top `Version:` and
`Checksum-SHA256:` declaration. The trailing metadata block records the existing SPDX
identifier, extensionless canonical URL, checksum, and `Checksum-Surface: license-body-v1`.

`license-body-v1` begins immediately after the first exact 80-character `=` separator
and includes every line through the closing separator after `END OF LICENSE`. It does
not skip the following blank line and does not permit legal text or schedules to be
removed. Canonical licenses are published by `SolomonDAOrg/licenses`; repository copies
remain named `LICENSE` and verify against the same legal-body checksum.

## Using this

- Copy a template pack from `templates/` to your repo.
- Adopt the naming rules from `specifications/SPEC.md`.
- Validate `*_META.yaml` files after YAML parse using `schema/record.meta.schema.json`.
- Optionally use `registry/` to provide autocompletion, hints, and warnings in tooling.
- Use `rules.structured_document_schemas` in a profile when JSON/YAML artefacts require field-level schema validation; use `required: true` and `max_count: 1` for machine-authoritative singleton documents.

### Deployment and release evidence profile

`profiles/deployment-release-evidence.profile.yaml` defines the `DEP` record surface for immutable initial-deployment and program-upgrade batches. It applies the deployment META overlay, validates exactly one PLAN/MAN/ATT/VER/EVD document against each dedicated JSON Schema, and selects the deployment formatting and render packs. The EVD document is the typed evidence dossier: it inventories report policy and retained files and normalizes transactions, actions, receipts, outcomes, and omitted optional artifacts. The deployment render pack selects an A4 portrait packet profile for `PACKET`/`PKT` documents so the retained toolkit produces a deterministic deployment-specific review surface. The attestation schema binds the immutable manifest/root plus the post-root cryptographic summary and PDF hashes, while upgrade plans bind the preceding MAN and ATT file hashes.

## Relationship to DAO proposals (DP)

The Solomon DAO proposals repository is a concrete implementation of this convention:

- Series code: `DP`
- Record directory: `DP-00001-<slug>/`
- Common doc types: `MEM`, `CHA`, `ANN`, `IND`, `REG`, `PKT`, `TX`, `LOG`, `META`

The DAO proposals profile adds extra requirements (e.g., annotated tag pinning on adoption and an
adopted-text freeze surface), but it stays compatible with the base naming rules from `specifications/SPEC.md`.

## Upstream lineage

Repos/registries that vendor or extend this convention SHOULD declare their upstream(s) in a
machine-readable `SCHEMA_UPSTREAM.yaml` at repo root.

- Normative spec: `specifications/UPSTREAM.md`
- Example snippet + attribution guidance: `ATTRIBUTION.md`

## License

Copyright (C) 2026 **SOLOMON DAO LLC**, a Marshall Islands DAO LLC organized
under the Decentralized Autonomous Organizations Act of 2022 as amended.

This repository is licensed under the **SOLOMON DAO LLC SCHEMA REGISTRY REPOSITORY LICENSE (PERMISSIVE)**.
See [LICENSE](./LICENSE) for full terms. See [ATTRIBUTION](./ATTRIBUTION.md) for customary attribution.
