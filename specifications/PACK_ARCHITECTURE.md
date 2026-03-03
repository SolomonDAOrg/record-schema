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
- `profiles` - Named render configurations (legal-standard-v1, registry-export-v1)
- `rules` - Selector-based render rules
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

## 3.1 META overlays (registry profiles)

Formatting/render packs are selected by metadata for normalization and output.

Separately, a registry implementation profile MAY apply *META overlay schemas* to constrain specific
metadata extension blocks (e.g. `extensions.dao_proposals.*`) while keeping the base META schema permissive.

Example (in a registry profile):

```yaml
rules:
  meta_policies:
    overlay_schema_paths:
      - overlays/dao_proposals.record.meta.schema.json
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
