# Pack Architecture Specification

Status: Draft
Schema family: `record-schema-pack`
Current schema version: `1`

This document defines the architecture for formatting and render packs within the record-schema system.

---

Two distinct pack types with separate concerns:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DOCUMENT PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Source Document                                                           │
│        │                                                                    │
│        ▼                                                                    │
│   ┌─────────┐     ┌──────────────────────────────────────────────────────┐  │
│   │ Parser  │────▶│                       AST                            │ │
│   └─────────┘     └──────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│                   ┌──────────────────────────────────────────────────────┐  │
│                   │              FORMATTING PACK                         │  │
│                   │  ┌────────────────────────────────────────────────┐  │  │
│                   │  │ • Validate source structure (shapes)           │  │  │
│                   │  │ • Check dialect/spelling (en-US, en-GB)        │  │  │
│                   │  │ • Enforce line widths                          │  │  │
│                   │  │ • Normalize characters (canonical-ascii)       │  │  │
│                   │  │ • Verify templates                             │  │  │
│                   │  └────────────────────────────────────────────────┘  │  │
│                   └──────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│                          Validated/Normalized AST                           │
│                                    │                                        │
│                                    ▼                                        │
│                   ┌──────────────────────────────────────────────────────┐  │
│                   │               RENDER PACK                            │  │
│                   │  ┌────────────────────────────────────────────────┐  │  │
│                   │  │ • Select target format (pdf, csv, html, ...)   │  │  │
│                   │  │ • Apply AST transforms                         │  │  │
│                   │  │ • Configure render engine                      │  │  │
│                   │  │ • Apply profile settings                       │  │  │
│                   │  └────────────────────────────────────────────────┘  │  │
│                   └──────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                    ┌───────────────┼───────────────┐                        │
│                    ▼               ▼               ▼                        │
│               ┌─────────┐    ┌─────────┐    ┌─────────┐                     │
│               │   PDF   │    │   CSV   │    │  HTML   │   ...               │
│               └─────────┘    └─────────┘    └─────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1. Formatting Pack (`record-schema-formatting-pack`)

**Domain**: Source document validation and normalization

- `dialect_packs` - Spelling/grammar rules (en-US-basic-v1, en-GB-basic-v1)
- `shapes` - Structural validation (headers, footers, metadata blocks)
- `style_profiles` - Prose conventions (heading style, list markers)
- `formatting_profiles` - Character normalization (canonical-ascii, baseline)
- `line_width_profiles` - Source line constraints
- `rulesets` - Selector-based enforcement rules
- `templates` - Source document templates

## 2. Render Pack (`record-schema-render-pack`)

**Domain**: AST transformation and output generation

- `targets` - Output format configurations (pdf, csv, html, json, yaml, ...)
- `render_profiles` - Named render configurations (legal-standard-v1, registry-export-v1)
- `rulesets` - Selector-based render rules
- `ast_transforms` - Pre-render AST transformations

## 3. Usage in Metadata

```yaml
extensions:
  formatting:
    profile: canonical-ascii
    pack_paths:
      - formatting/packs/base-v1.json
      - formatting/packs/dao-proposals-v1.json
  rendering:
    pack_paths:
      - render/packs/base-v1.json
    default_profile: legal-standard-v1
```

### Document identity and render profiles

Reusable render packs MUST NOT hardcode record identifiers, revision numbers, or repository-specific document filenames. Select common rules by document type and extension. `PACKET` is the synthetic selector for compiled packet output; it is not a document filename code.

Tracking identifiers come from the record META. For a standalone document, matching `documents` references are overlaid by the matching `assembly.pack` entry. Each reference may declare `doc_type`, `document_id`, `version`, and `render_profile_id`. Paths are relative to the record directory.

An explicit document identifier is used before the optional `/version` suffix. Otherwise the identifier uses META `id`, the document type, and the filename remaining suffix without the extension. META id replaces any stale record prefix in the filename. For packets, `assembly.packet.document_id`, then `document.document_id`, then META `id` supplies the identifier. Version priority is the selected reference, `document.version`, then root `version`; omit the suffix when absent. Explicit `page_tracking.identifier` in a custom render pack remains an override.

A reference `render_profile_id` overrides selector-based styling. The fallback is `extensions.rendering.default_profile`, followed by the matching pack rules. Missing selected profiles, missing parents, and inheritance cycles are errors. Per-document profiles affect standalone layout and packet section break/rule policies. Fixed page compositions are standalone layouts; packet tracking uses the packet identifier and physical page count.

The contractor services pack provides `contractor-services`, `contractor-services-compact`, and `contractor-services-certificate` profiles. The certificate profile consumes the declared heading slots in its fixed layout. Titles and entity names come from META; no jurisdiction is assumed.

```yaml
id: AGR-00127
version: "2.4"
entity:
  legal_name: Example Services Ltd
extensions:
  rendering:
    pack_paths: [render/packs/contractor-services-v1.json]
    default_profile: contractor-services
documents:
  primary:
    - path: AGR-00127_DOC-confirmation.md
      doc_type: DOC
      document_id: AGR-00127-confirmation
      version: "3.1"
      render_profile_id: contractor-services-compact
assembly:
  packet:
    path: AGR-00127_PKT-filing.pdf
    document_id: AGR-00127
```

## 3.1 META overlays (registry profiles)

Formatting/render packs are selected by metadata for normalization and output.

Separately, a registry implementation profile MAY apply *META overlay schemas* to constrain specific
metadata extension blocks (e.g. `extensions.dao_proposals.*`) while keeping the base META schema permissive.

Example (in a registry profile):

```yaml
rules:
  meta_policies:
    overlay_schema_paths:
      - overlays/dao-proposals.record.meta.schema.json
```

## 4. Key Benefits

1. **Separation of concerns** - validation vs transformation
2. **Composable** - mix different formatting + render packs
3. **Target-agnostic formatting** - same source rules regardless of output
4. **Multiple outputs** - one validated AST → many render targets

## License

Copyright (C) 2026 **SOLOMON DAO LLC**, a Marshall Islands DAO LLC organized
under the Decentralized Autonomous Organizations Act of 2022 as amended.

This specification is licensed under the **SOLOMON DAO LLC SCHEMA REGISTRY LICENSE (PERMISSIVE)**.
