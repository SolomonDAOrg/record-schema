# Upstream Declaration (SCHEMA_UPSTREAM)

Status: Draft
Schema family: `record-schema`
Current schema version: `1`

This document defines `SCHEMA_UPSTREAM.yaml`: a machine-readable declaration that:

1. makes upstream lineage explicit (dependency graph / provenance); and
2. optionally provides local resolution hints so tooling can locate the correct profile, registry, and packs.

`SCHEMA_UPSTREAM.yaml` lives at repository root (alongside `.git/`, `README.md`, etc.).

---

## 1. File identity (normative)

`SCHEMA_UPSTREAM.yaml` MUST be a YAML document whose root object includes:

- `schema`: `record-schema-upstream`
- `schema_version`: integer `>= 1`

Tooling SHOULD validate the parsed YAML object against `schema/schema_upstream.schema.json`.

---

## 2. Root structure (normative)

All Record Schema–specific content SHOULD live under `record_schema`:

```yaml
schema: record-schema-upstream
schema_version: 1

record_schema:
  upstreams: []
  provides: []
```

Top-level keys outside `record_schema` are permitted, but downstream tooling MAY ignore them.

---

## 3. `record_schema.upstreams` (normative)

`record_schema.upstreams` is an ordered list of upstream dependencies (nearest parent first):

```yaml
record_schema:
  upstreams:
    - name: Record Schema
      repo: "https://example.com/org/record-schema"
      revision: "v1.2.3" # git tag or commit sha
      license: "SOLOMON DAO LLC SCHEMA REGISTRY LICENSE (PERMISSIVE)"
```

### 3.1 Fields

Each upstream entry SHOULD include:

- `name` (string, required): human name
- `repo` (string, recommended): URL or local path
- `revision` (string, recommended): git tag or commit sha
- `license` (string, recommended): license identifier/name

Tooling MAY treat missing `repo`/`revision` as incomplete provenance and emit warnings.

---

## 4. `record_schema.provides` (normative)

`record_schema.provides` declares what this repository provides to downstreams (identity + role):

```yaml
record_schema:
  provides:
    - id: "legal-templates-registry-internal"
      name: "Legal templates registry (internal)"
      kind: "profile"
```

### 4.1 Fields

Each provides entry MUST include:

- `id` (string, required): stable identifier used by tooling for matching
- `name` (string, required): human name
- `kind` (string, required): one of:
  - `profile` (publishes one or more profiles)
  - `registry` (publishes a registry catalog)
  - `tooling` (publishes tooling/packs without being primarily a registry)
- `license` (string, recommended): license identifier/name
- `licenseFile` (string, recommended): license file reference
- `attributionFile` (string, recommended): attribution file reference

Tooling MAY ignore unknown kinds.

---

## 5. Local resolution hints (recommended)

The following keys are OPTIONAL. When present, they allow tooling to avoid brittle heuristics.

All paths are repo-relative, unless explicitly absolute.

### 5.1 Profile

- `record_schema.profile_path` (string): explicit profile file path
- `record_schema.profile_hint` (string): profile identity hint (used to select a profile from a toolkit)
- `record_schema.profile` (string): convenience alias; tooling MAY treat it as a path if it exists, otherwise as a hint

### 5.2 Registry

- `record_schema.registry_path` (string or string[]): explicit registry path(s) (first existing wins)
- `record_schema.registry` (string or string[]): alias

### 5.3 Packs

- `record_schema.formatting_packs` (string or string[]): formatting pack JSON paths
- `record_schema.render_packs` (string or string[]): render pack JSON paths

`record_schema.packs` MAY be used as an alias for `formatting_packs`.

---

## 6. Full example

```yaml
schema: record-schema-upstream
schema_version: 1

record_schema:
  upstreams:
    - name: Record Schema
      repo: "https://github.com/SolomonDAOrg/record-schema"
      revision: "v1.0.0"
      license: "SOLOMON DAO LLC SCHEMA REGISTRY REPOSITORY LICENSE (PERMISSIVE)"

  provides:
    - id: "dao-proposals"
      name: "DAO proposals registry"
      kind: "registry"

  profile_hint: "dao-proposals"
  registry_path: "registry/dao-proposals.yaml"

  formatting_packs:
    - "formatting/packs/base-v1.json"
    - "formatting/packs/dao-proposals-v1.json"

  render_packs:
    - "render/packs/base-v1.json"
```
