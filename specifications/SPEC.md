# Record Schema Specification

Status: Draft
Schema family: `record-schema`
Current schema version: `1`

This document defines a convention for organizing "records" as directories with stable identifiers, typed documents, and machine-readable metadata.

It is designed to be:

- Machine-lintable (names, structure, metadata)
- Human-readable (slugs, structured docs)
- Non-limiting (unknown categories remain valid)

## 1. Terminology

- **Record**: A single, addressable unit of documentation and artefacts stored in its own directory.
- **Series**: A category of record, identified by a short code (2-5 uppercase letters).
- **Record ID**: The stable identifier for a record, `{SER}-{NNNNN}`.
- **Doc Type Code**: A 2-5 letter uppercase code describing a document's role (e.g., `DOC`, `MEM`, `ANN`, `META`, `TX`).
- **Register**: A canonical list/table of items maintained as a document (typically doc type code `REG`).
- **Registry**: Context-dependent:
  - In this repository, the `registry/` folder is a non-normative catalog of suggested series/doc type/commitment kind codes.
  - In a downstream repo, a "registry" may also mean a repository that stores many records (e.g., a SOP Registry repository).
- **Index Document (`IND`)**: A human-readable per-record index / table-of-contents for multipart records.
- **Packet (`PKT`)**: A compiled artefact assembled from ordered record documents (e.g., a stitched PDF used for filings/submissions).

## 2. Record directory naming (normative)

A record MUST be stored in a directory whose name matches:

```
<SER>-<NNNNN>[-<slug>]/
```

### 2.1 Components

- `SER` MUST be 2 to 5 ASCII uppercase letters: `[A-Z]{2,5}`
- `NNNNN` MUST be 5 ASCII digits, zero-padded: `\d{5}`
- `slug` is OPTIONAL. When present it MAY contain ASCII letters (mixed case), digits, hyphens, and underscores. Spaces and non-ASCII characters MUST NOT appear in directory names.

### 2.2 Directory name regex

Normative regex:

```
^[A-Z]{2,5}-\d{5}(?:-[A-Za-z0-9][A-Za-z0-9_-]*)?$
```

### 2.3 Series counters

`NNNNN` is a per-series counter (recommended). This keeps IDs stable and avoids collisions without requiring a global allocator.

Tooling MAY implement "next ID" allocation by scanning existing directories with matching `SER`.

## 3. File naming inside a record (normative)

Files inside a record directory SHOULD be prefixed with the record ID and a doc type code:

```
<RECORD_ID>_<DOC>-<short-description>.<ext>
```

Where:

- `RECORD_ID` is `{SER}-{NNNNN}`.
- `DOC` is a 2–5 letter uppercase doc type code: `[A-Z]{2,5}`.
- `short-description` is optional but recommended. It MAY contain ASCII letters (mixed case), digits, hyphens, and underscores. Spaces and non-ASCII characters MUST NOT appear in file names.
- `ext` is the file extension.

### 3.1 File name regex

Normative regex:

```
^[A-Z]{2,5}-\d{5}_[A-Z]{2,5}(?:-[A-Za-z0-9][A-Za-z0-9_-]*)?\.[A-Za-z0-9]+$
```

### 3.2 Annex lettering

If you use annexes, the doc type code MAY incorporate a suffix in the description portion:

- `SER-00001_ANN-A-parameters.md`
- `SER-00001_ANN-B-state-machine.md`

The letter is part of the `short-description` by convention, and SHOULD match references in primary documents.

## 4. Required baseline files (normative)

Each record MUST contain:

- `{RECORD_ID}_META.yaml` -- machine-readable metadata

Each record SHOULD contain at least one primary document. By convention this is one of:

- `{RECORD_ID}_DOC-main.md`
- `{RECORD_ID}_MEM-main.md`

If the primary document(s) do not follow these naming conventions, the metadata file (`documents.primary`) is authoritative. A record MAY have multiple primary documents; in that case all MUST be referenced in `documents.primary`.

Each record SHOULD contain:

- `{RECORD_ID}_LOG-notes.md` -- chronological notes / operational log (if the record evolves)

Records that are multipart (multiple primary documents and/or annexes) SHOULD contain:

- `{RECORD_ID}_IND-index.md` -- per-record index / table of contents (human-readable)

Records intended for filing/submission MAY additionally include:

- `{RECORD_ID}_PKT-filing.pdf` -- compiled packet output (see §5.6)

Records MAY include any additional files.

## 5. Metadata (normative)

Metadata MUST be stored at:

```
{RECORD_ID}_META.yaml
```

Tooling MUST validate the parsed YAML object against `schema/record.meta.schema.json` (or an equivalent schema).

### 5.1 Required keys

Minimum required fields:

- `schema`
- `schema_version`
- `id`
- `series_code`
- `series`
- `title`
- `status.phase`
- `status.last_updated`

Type and range constraints (schema-aligned):

- `schema` MUST equal `record-schema`.
- `schema_version` MUST be an integer >= 1.
- `series_code` MUST match `^[A-Z]{2,5}$`.
- `series` MUST be an integer in the range 0..99999.
- `id` MUST match `^[A-Z]{2,5}-\d{5}$` and SHOULD correspond to `{series_code}-{series as 5 digits}`.

### 5.2 Unknown keys and extensions

To keep the system non-limiting:

- Tooling MUST allow extra keys in metadata.
- Tooling SHOULD encourage custom fields to live under `extensions`.

### 5.3 Dates and timestamps

All timestamps SHOULD be UTC ISO-8601 strings, e.g.:

- `2025-12-18T00:00:00Z`

Tooling MAY normalize or enforce timestamp formats.

### 5.4 Formatting profile (normative hook)

If a repository needs strict, reproducible source text (e.g., "adopted text surfaces", filings, cryptographic hashes), the record SHOULD declare a formatting profile in metadata, and tooling SHOULD validate it.

Recommended fields:

```yaml
extensions:
  formatting:
    profile: canonical-ascii # see FORMATTING.md
  language:
    locale: en-US # see FORMATTING.md
```

The authoritative formatting and normalization rules live in `FORMATTING.md`.


### 5.5 Registry profile META overlays (recommended)

Some registries need *typed* and *validated* metadata extension blocks (e.g. `extensions.dao_proposals.governance`),
without restricting other custom keys.

A registry implementation profile MAY specify one or more overlay schemas that are applied in addition to
`schema/record.meta.schema.json`.

Example:

```yaml
rules:
  meta_policies:
    overlay_schema_paths:
      - overlays/dao_proposals.record.meta.schema.json
```

Overlay schema (recommended location: top-level overlays/)s SHOULD constrain only the extension subtree(s) they care about, and SHOULD NOT set
`additionalProperties: false` at the root or `extensions` root (to preserve the base rule that extra keys are allowed).

### 5.6 Document ordering, indices, and packets (recommended)

Some records need a canonical *assembly order* (e.g., a charter + schedules + annexes) and a stable,
human-readable index.

Recommended metadata keys (all optional):

```yaml
documents:
  index: "{RECORD_ID}_IND-index.md"          # doc type IND
  packet: "{RECORD_ID}_PKT-filing.pdf"       # doc type PKT (derived artefact)
  pack:
    - path: "{RECORD_ID}_IND-index.md"
      label: "Index"
      precedence: 10
    - path: "{RECORD_ID}_CHA-charter.md"
      label: "Primary instrument"
      precedence: 20
    - path: "{RECORD_ID}_ANN-A-schedule-1.md"
      label: "Schedule 1"
      precedence: 30
```

Assembly order (informative default):

1. If `documents.pack` is present, include items where `include != false` and sort by
   `(precedence asc, path asc)`.
2. Otherwise, include `documents.index` (if present), then `documents.primary`, then `documents.annexes`
   in the order listed.

Tooling SHOULD treat `PKT` outputs as derived artefacts: regenerate them from source rather than editing
them directly.


### 5.7 Authority, legal primacy, and conflict handling (recommended)

Where records model instruments that may conflict (statutes/regulations vs company instruments vs
non-binding materials), store the *authority class* explicitly in metadata so tooling and humans can
reason about primacy.

Recommended metadata keys (optional):

```yaml
authority:
  domain: "government"        # or "company"
  class: "statute"            # e.g., statute, regulation, official-communication, primary, secondary, supplemental, nonbinding
  precedence: 0               # lower wins; informational unless a profile enforces it
```

Primacy model (informative):

- Government statutes override everything subordinate.
- Government regulations are subordinate to statutes.
- Official government communications (lawful instructions/notices/directions) are subordinate to
  statutes/regulations but override conflicting company instruments within their scope.
- Company primary instruments (e.g., charter/operating agreement) override subordinate company documents.
- Secondary/tertiary/supplemental documents are subordinate to primary instruments.
- Non-binding artefacts (e.g., memos, commentary) do not override anything.

Profiles MAY enforce stricter rules (e.g., requiring `authority.class` on `CHA` or requiring `documents.pack`
for filing records).

### 5.5 Markdown documents: standard header + optional footer (recommended)

Many record types use Markdown (`.md`) for primary documents, SOPs, policies, logs, and registries. To keep Markdown records consistent (and to enable stable, profile-defined hash surfaces), Markdown documents SHOULD use the following envelope.

Header (required):

```md
# `<SER>-<NNNNN>[-<slug>]` <TITLE>

**Status:** <value>
**Owner:** <value>
**Applies to:** <value>
**Related:** <value>

---
```

Body begins immediately after the delimiter line.

Footer (optional):

If a profile requires a standard disclaimer/footer (e.g., for `MEM`), place it after a second delimiter:

```md
---

<footer content here>
```

Notes:

- The ``<SER>-<NNNNN>[-<slug>]`` token SHOULD match the record directory name.
- Header fields SHOULD appear in the order shown. Additional fields MAY be added after `Related` using the same `**Label:** value` form.
- Delimiter lines MUST be exactly `---` on their own line.

#### 5.5.1 Hash surfaces (optional)

If you need cryptographic commitments that should survive header/footer edits, tooling MAY hash only the body portion of an enveloped Markdown document.

Recommended surface identifier:

- `markdown-body-v1`: the document body bytes, defined as content after the first envelope delimiter line (`---`) and before the earliest of: (a) the footer delimiter line (`---`) if present, (b) the start marker line `-----BEGIN DOCUMENT METADATA-----` if present, or (c) end-of-file. The document metadata block (between `-----BEGIN DOCUMENT METADATA-----` and `-----END DOCUMENT METADATA-----`) MUST be excluded. Hashing is performed after applying the declared `formatting_profile`.

If recorded, store the chosen surface identifier in `commitments[].hash_surface`.

Optional anchoring references:

Tooling MAY record external timestamp/anchor references for a commitment (e.g., an on-chain memo transaction) under `commitments[].anchors[]`.

Recommended fields (all optional except where noted):

- `kind` (required): anchor mechanism/type (e.g., `solana-memo`, `bitcoin-opreturn`, `ethereum-tx`)
- `network`: network identifier (e.g., `mainnet-beta`, `sepolia`)
- `ref` (required): anchor reference identifier (e.g., transaction signature/hash)
- `created`: ISO8601 UTC timestamp of the anchor (if known)
- `notes`: freeform notes


## 6. Registries (non-normative)

This repo ships registries in `registry/`:

- `doc-types.yaml` - suggested doc type codes
- `core-series.yaml` - small "core" series suggestions
- `commitment-kinds.yaml` - suggested commitment kind codes (hash/CID anchors)
- `suggested-series.yaml` - broader set of suggestions (optional)

Tooling SHOULD treat registry mismatches as warnings or informational hints, not as hard failures, except where a project explicitly opts in to stricter checks.

Notes:

- `REG` is the doc type for a register-style document (a canonical list/table). A repository that stores many
  records may still be called a "registry repository" in plain English.
- `IND` and `PKT` are optional doc types commonly used for multipart instruments and filing packets:
  - `IND` is the per-record index / TOC (source, usually Markdown).
  - `PKT` is a compiled packet output (derived, often PDF).

## 7. Indexing (informative)

A repository MAY include a repo-level `INDEX.md` (or similar) generated from `*_META.yaml` files.

If you build a repo-level index, recommended columns:

- `id`, `title`, `series`, `status.phase`, `status.last_updated`, `tags`

### 7.1 Per-record index documents (`IND`)

Multipart records (multiple primary documents and/or annexes) SHOULD include an `IND` document, typically:

- `{RECORD_ID}_IND-index.md`

An `IND` document is human-readable and SHOULD:

- list the included documents (primary + annexes + any schedules) in the intended reading/filing order;
- include stable filenames so tooling can validate missing items; and
- be referenced from metadata via `documents.index` (recommended).

## 8. Security considerations (informative)

- Do not store secrets in metadata or evidence files.
- When storing evidence (emails, screenshots, exports), consider:
  - redaction
  - access controls
  - provenance notes (`*_LOG-...`)

### 8.1 Government forms and identity/KYC artefacts

Some filings require government-issued forms, private correspondence with registrars, and/or identity
and KYC materials.

These items SHOULD NOT be stored as ordinary documents inside proposal or SOP registries. Instead:

- store only redacted derivatives where appropriate; and/or
- store an evidence/commitment anchor (hash/CID) in `commitments[]` with a clear kind (e.g.,
  `government-form-original`, `identity-kyc-package`) and retain the original in a separate controlled
  evidence store.

## 9. Interoperability goals (informative)

Implementations should be able to:

- Parse record IDs from directory names and file names.
- Resolve the primary doc and annexes from metadata.
- Generate consistent indices.
- Apply formatters/lints across multiple repos without needing per-repo special cases.

## 10. Profiles (informative)

A repository MAY publish "profiles" that tighten requirements for a specific series or domain (e.g., DAO proposals, security advisories, incorporation filings). Profiles MUST NOT change the base naming regexes in Sections 2–3.

Example: the Solomon DAO proposals repository uses the `DP` series and adds adoption pinning (annotated tags) plus an adopted-text freeze surface, while remaining compatible with this spec's naming rules.
Pre-formation records:

- Some series (e.g., DAO proposals) may reserve an initial record such as `DP-00000` for organizer/pre-formation
  materials that are not "voted on" by an entity that does not yet exist. Profiles SHOULD model this explicitly
  (e.g., with a `preformation` status phase and/or record overrides for reserved IDs).


### 10.1 Formatting and render policy packs (informative)

Profiles often need formatting and structure rules that vary by repository context (e.g., `MEM` disclaimer footers in a DAO registry, or strict `LICENSE` header/footer shapes in a legal repo), as well as render configurations for output generation (e.g., PDF rendering settings, CSV export options).

To keep schemas small and extensible, these rules SHOULD live in JSON **policy packs** under:

- `formatting/packs/*.json` - formatting packs for source validation and normalization
- `render/packs/*.json` - render packs for output transformation
- `formatting/templates/**` - standard header/footer templates referenced by shapes/rulesets

A registry profile references packs (rather than embedding the full rules inline) using:

```yaml
rules:
  document_policies:
    pack_paths:
      - type: formatting
        path: formatting/packs/base-v1.json
      - type: formatting
        path: formatting/packs/dao-proposals-v1.json
      - type: render
        path: render/packs/base-v1.json
```

Tooling loads packs in order by type (including `imports`) and merges from broad to specific.


## Upstream declaration (informative)

Repositories that vendor or extend this convention SHOULD declare their upstream lineage and (optionally)
local resolution hints (profile/registry/pack pointers) in a `SCHEMA_UPSTREAM.yaml` file at repo root.

The normative specification and schema live in:

- `UPSTREAM.md`
- `schema/schema_upstream.schema.json`

---

## Subsidiary Specifications

This specification is supported by the following subsidiary documents:

| Specification | Description |
|---------------|-------------|
| [FORMATTING.md](./FORMATTING.md) | Formatting and normalization rules (baseline + `canonical-ascii` profile) |
| [PACK_ARCHITECTURE.md](./PACK_ARCHITECTURE.md) | Formatting pack and render pack architecture |
| [CHARTS.md](./CHARTS.md) | Chart/diagram DSL for flowcharts, sequence diagrams, state machines, and ERDs |

---

## License

Copyright (C) 2026 **SOLOMON DAO LLC**, a Marshall Islands DAO LLC organized
under the Decentralized Autonomous Organizations Act of 2022 as amended.

This specification is licensed under the **SOLOMON DAO LLC SCHEMA REGISTRY LICENSE (PERMISSIVE)**.
See [LICENSE](./LICENSE) (terms) and [ATTRIBUTION](./ATTRIBUTION.md) (required notice).
