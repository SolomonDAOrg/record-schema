# Chart Schema Specification

Status: Draft
Schema family: `record-schema-chart`
Current schema version: `1`

This document defines a chart/diagram DSL that doesn't require HTML entities to escape a fucking parenthesis.

## Design goals

1. **Real escaping** - backslash escapes work: `\(`, `\"`, `\\`
2. **Multiline labels** - heredoc-style blocks, no `<br>` nonsense
3. **Separation of concerns** - structure, content, and style are distinct
4. **Machine-lintable** - validates against JSON schema
5. **Multiple render targets** - SVG, PNG, ASCII, Mermaid export
6. **Record-schema integration** - works with formatting packs and render packs

## 1. File format

Charts are defined in YAML (`.chart.yaml`) or JSON (`.chart.json`).

```yaml
schema: record-schema-chart
schema_version: 1
chart_type: flowchart  # flowchart | sequence | state | entity | tree
direction: TD          # TD | LR | BT | RL (top-down, left-right, etc.)

nodes:
  - id: a
    label: "Simple label"

  - id: b
    label: |
      Multiline label
      with actual newlines
      and no escape gymnastics

  - id: c
    label: "Label with (parentheses) and \"quotes\" -- no problem"

edges:
  - from: a
    to: b
    label: "edge label"

  - from: b
    to: c
```

## 2. Escaping rules

Within quoted strings, standard escapes apply:

| Sequence | Result |
|----------|--------|
| `\\`     | Literal backslash |
| `\"`     | Literal double quote |
| `\'`     | Literal single quote |
| `\n`     | Newline (for inline multiline) |
| `\t`     | Tab |
| `\|`     | Literal pipe (in YAML contexts) |

Parentheses, brackets, braces require **no escaping** -- they're just text.

For multiline labels, use YAML block scalars:

```yaml
label: |
  First line
  Second line (with parens)
  Third line "with quotes"
```

## 3. Node definitions

### 3.1 Required fields

- `id` - unique identifier, pattern: `^[a-z][a-z0-9_]*$`

### 3.2 Optional fields

- `label` - display text (defaults to `id` if omitted)
- `shape` - node shape (see §3.3)
- `class` - style class reference (defined in formatting pack)
- `url` - clickable link
- `tooltip` - hover text

### 3.3 Shapes

```yaml
shapes:
  rect:        "[ ]"      # rectangle (default)
  round:       "( )"      # rounded rectangle
  stadium:     "([ ])"    # stadium/pill
  diamond:     "{ }"      # decision diamond
  hexagon:     "{{ }}"    # hexagon
  parallelogram: "[/ /]"  # parallelogram
  trapezoid:   "[\ /]"    # trapezoid
  circle:      "(( ))"    # circle
  cylinder:    "[( )]"    # database cylinder
  subroutine:  "[[ ]]"    # subroutine box
  asymmetric:  "> ]"      # flag/asymmetric
  note:        "[ . ]"    # note/comment shape
```

Shape can be specified by name or symbol:

```yaml
nodes:
  - id: decision
    label: "Is it valid?"
    shape: diamond

  # equivalent:
  - id: decision2
    label: "Is it valid?"
    shape: "{ }"
```

## 4. Edge definitions

### 4.1 Required fields

- `from` - source node id
- `to` - target node id

### 4.2 Optional fields

- `label` - edge label text
- `line_style` - line style: `solid` | `dashed` | `dotted` | `thick`
- `arrow` - arrow style (see §4.3)
- `class` - style class reference (defined in formatting pack)
- `bidirectional` - boolean, arrows on both ends

### 4.3 Arrow styles

```yaml
arrows:
  normal:    "--->"     # standard arrow (default)
  open:      "---o"     # open circle
  cross:     "---x"     # x mark
  none:      "---"      # no arrowhead
```

### 4.4 Shorthand edge syntax

For simple graphs, edges can use a compact string syntax:

```yaml
edges:
  - "a --> b"                    # basic edge
  - "a --> b : edge label"       # with label
  - "a -.-> b"                   # dashed
  - "a ==> b"                    # thick
  - "a <--> b"                   # bidirectional
  - "a --o b"                    # open arrow
  - "a --x b"                    # x arrow
```

Parser recognizes:
- `-->` normal arrow
- `-.->` dashed arrow
- `==>` thick arrow
- `--o` open circle
- `--x` x mark
- `<-->` bidirectional
- `---` no arrow

The `:` delimiter separates edge spec from label.

## 5. Subgraphs / groups

```yaml
subgraphs:
  - id: cluster_a
    label: "Processing Pipeline"
    nodes: [a, b, c]

  - id: cluster_b
    label: |
      Another group
      with multiline title
    nodes: [d, e]
```

Subgraphs can nest:

```yaml
subgraphs:
  - id: outer
    label: "Outer"
    contains:
      - id: inner
        label: "Inner"
        nodes: [a, b]
    nodes: [c, d]  # in outer but not inner
```

## 6. Styling

**Important**: Visual styling (colors, fonts, fills) lives in **render packs**, not in chart source files or formatting packs.

Charts reference style classes by name:

```yaml
nodes:
  - id: error_node
    label: "Error!"
    class: error

  - id: ok_node
    label: "Success"
    class: success
```

Style classes are defined in render packs under `chart_classes`:

```json
{
  "schema": "record-schema-render-pack",
  "schema_version": 1,
  "pack_id": "base-diagrams-v1",
  "document_policies": {
    "chart_classes": {
      "error": {
        "fill": "#ffcccc",
        "stroke": "#cc0000",
        "stroke_width": 2
      },
      "success": {
        "fill": "#ccffcc",
        "stroke": "#00cc00"
      }
    }
  }
}
```

### 6.1 Style cascade

Multiple render packs can define chart styles. Packs are loaded in order and merged:

1. Base pack (e.g., `render/packs/base-v1.json`)
2. Domain pack (e.g., `render/packs/base-diagrams-v1.json`)
3. Project pack (e.g., `render/packs/project-overrides.json`)

Later packs override earlier ones. Within a pack, `imports` are processed first.

### 6.2 Themes

Themes define coordinated defaults for nodes, edges, and subgraphs:

```json
{
  "chart_themes": {
    "dark": {
      "node_defaults": {
        "fill": "#2d2d2d",
        "stroke": "#666666",
        "text_color": "#ffffff"
      },
      "edge_defaults": {
        "stroke": "#888888"
      },
      "subgraph_defaults": {
        "fill": "#1a1a1a",
        "stroke": "#444444"
      }
    }
  }
}
```

Theme selection happens via `chart_targets` or ruleset configuration.

### 6.3 Class composition

Classes can extend other classes:

```json
{
  "chart_classes": {
    "highlight": {
      "stroke_width": 3,
      "stroke_dasharray": "5,5"
    },
    "error-highlight": {
      "extends": ["error", "highlight"]
    }
  }
}
```

## 7. Chart types

### 7.1 Flowchart (default)

Standard directed graph with nodes and edges.

### 7.2 Sequence diagram

```yaml
chart_type: sequence

participants:
  - id: client
    label: "Client"
  - id: server
    label: "Server"
  - id: db
    label: "Database"

messages:
  - from: client
    to: server
    label: "HTTP Request"
    type: sync       # sync | async | reply

  - from: server
    to: db
    label: "Query"

  - from: db
    to: server
    label: "Results"
    type: reply

  - from: server
    to: client
    label: "HTTP Response"
    type: reply

notes:
  - over: [client, server]
    label: "TLS Handshake"
    position: left   # left | right | over

loops:
  - label: "Retry logic"
    messages: [2, 3]  # message indices
```

### 7.3 State diagram

```yaml
chart_type: state

states:
  - id: idle
    label: "Idle"
    initial: true

  - id: processing
    label: "Processing"

  - id: complete
    label: "Complete"
    final: true

  - id: error
    label: "Error"
    final: true

transitions:
  - from: idle
    to: processing
    trigger: "start()"

  - from: processing
    to: complete
    trigger: "success"

  - from: processing
    to: error
    trigger: "failure"
    guard: "retries == 0"
```

### 7.4 Entity-relationship diagram

```yaml
chart_type: entity

entities:
  - id: user
    label: "User"
    attributes:
      - name: id
        type: uuid
        key: primary
      - name: email
        type: string
        key: unique
      - name: created_at
        type: timestamp

  - id: order
    label: "Order"
    attributes:
      - name: id
        type: uuid
        key: primary
      - name: user_id
        type: uuid
        key: foreign
      - name: total
        type: decimal

relationships:
  - from: user
    to: order
    cardinality: "1:N"    # 1:1 | 1:N | N:1 | N:M
    label: "places"
```

### 7.5 Tree diagram

```yaml
chart_type: tree

root:
  id: ceo
  label: "CEO"
  children:
    - id: cto
      label: "CTO"
      children:
        - id: dev_lead
          label: "Dev Lead"
        - id: ops_lead
          label: "Ops Lead"

    - id: cfo
      label: "CFO"
      children:
        - id: accounting
          label: "Accounting"
```

## 8. Comments and metadata

```yaml
schema: record-schema-chart
schema_version: 1

metadata:
  title: "System Architecture"
  description: |
    Overview of the processing pipeline.
    Updated 2026-01-23.
  author: "Ben"
  record_id: "ADR-00042"

# YAML comments work normally
nodes:
  - id: a
    label: "Node A"  # inline comments too
```

## 9. Render targets

Render configuration lives in **render packs**, not in chart source files.

### 9.1 Supported targets

| Target | Description |
|--------|-------------|
| `svg` | Native vector output. Supports all features. |
| `png` | Rasterized from SVG. |
| `ascii` | Text-based output for terminals and plain-text docs. |
| `mermaid` | Mermaid syntax export for compatibility. |

### 9.2 Render pack configuration

```json
{
  "schema": "record-schema-render-pack",
  "schema_version": 1,
  "pack_id": "diagrams-v1",
  "document_policies": {
    "chart_targets": {
      "svg": {
        "engine": "chart-schema-native",
        "theme": "default",
        "options": {
          "padding": 20,
          "background": "transparent"
        }
      },
      "png": {
        "engine": "chart-schema-native",
        "theme": "default",
        "options": {
          "scale": 2,
          "width": 1200,
          "height": "auto",
          "background": "#ffffff"
        }
      },
      "ascii": {
        "engine": "chart-schema-ascii",
        "options": {
          "max_width": 120,
          "box_chars": "unicode"
        }
      },
      "mermaid": {
        "engine": "chart-schema-mermaid-export",
        "options": {
          "escape_mode": "html_entities"
        }
      }
    },
    "rulesets": [
      {
        "id": "chart-default-outputs",
        "selectors": {
          "extensions": ["chart.yaml", "chart.json"]
        },
        "render": {
          "targets": ["svg", "png"]
        }
      }
    ]
  }
}
```

The Mermaid exporter handles escape bullshit so you don't have to.

## 10. Integration with record-schema

### 10.1 As record documents

Charts can be record documents:

```
ADR-00042-system-architecture/
  ADR-00042_META.yaml
  ADR-00042_DOC-main.md
  ADR-00042_DIA-architecture.chart.yaml   # DIA = diagram
  ADR-00042_DIA-architecture.svg          # rendered output (derived)
```

### 10.2 Doc type code

New doc type: `DIA` (Diagram)

```yaml
- code: DIA
  name: Diagram
  description: Chart or diagram source definition.
  recommended_extensions: [chart.yaml, chart.json]
```

### 10.3 Metadata reference

```yaml
# In ADR-00042_META.yaml
documents:
  primary: ADR-00042_DOC-main.md
  annexes:
    - path: ADR-00042_DIA-architecture.chart.yaml
      label: "Architecture diagram (source)"
    - path: ADR-00042_DIA-architecture.svg
      label: "Architecture diagram (rendered)"
```

### 10.4 Pack references in record metadata

```yaml
extensions:
  formatting:
    profile: canonical-ascii
    pack_paths:
      - formatting/packs/base-v1.json
      - formatting/packs/dao-diagrams-v1.json
  rendering:
    pack_paths:
      - render/packs/base-v1.json
      - render/packs/diagrams-v1.json
```

## 11. Formatting pack validation

Formatting packs validate chart source files (structural rules only, no visual styling):

- Schema compliance (`schema`, `schema_version`, `chart_type`)
- Node ID patterns (`^[a-z][a-z0-9_]*$`)
- Edge references (no orphan `from`/`to` references)
- Duplicate ID detection
- Label text normalization (if `canonical-ascii` profile active)
- Class reference validation (warn if class not defined in loaded render packs)

```json
{
  "schema": "record-schema-formatting-pack",
  "pack_id": "base-diagrams-v1",
  "document_policies": {
    "rulesets": [
      {
        "id": "chart-source-validation",
        "selectors": {
          "extensions": ["chart.yaml", "chart.json"]
        },
        "enforce": {
          "formatting_profile": "canonical-ascii",
          "chart_validation": {
            "require_metadata_title": true,
            "require_metadata_record_id": false,
            "warn_undefined_classes": true,
            "warn_orphan_nodes": true
          }
        }
      }
    ]
  }
}
```

## 12. Schema validation

Charts validate against `schema/chart.schema.json`.

Required fields:
- `schema` = `"record-schema-chart"`
- `schema_version` >= 1
- At least one of: `nodes`, `participants`, `states`, `entities`, `root`

Optional but recommended:
- `chart_type` (defaults to `flowchart`)
- `metadata.title`

## 13. Example: complete flowchart

```yaml
schema: record-schema-chart
schema_version: 1
chart_type: flowchart
direction: TD

metadata:
  title: "User Authentication Flow"
  record_id: "ADR-00015"

nodes:
  - id: start
    label: "User submits credentials"

  - id: validate
    label: |
      Validate input
      (email format, password length)

  - id: check_user
    label: "User exists?"
    shape: diamond
    class: decision

  - id: check_pass
    label: "Password correct?"
    shape: diamond
    class: decision

  - id: success
    label: "Grant access"
    class: success

  - id: fail_user
    label: "User not found"
    class: error

  - id: fail_pass
    label: "Invalid password"
    class: error

edges:
  - "start --> validate"
  - "validate --> check_user"
  - "check_user --> check_pass : yes"
  - "check_user --> fail_user : no"
  - "check_pass --> success : yes"
  - "check_pass --> fail_pass : no"

subgraphs:
  - id: auth_service
    label: "Authentication Service"
    nodes: [validate, check_user, check_pass]
```

Style classes (`decision`, `success`, `error`) are defined in render packs, not here.

## License

Copyright (C) 2026 **SOLOMON DAO LLC**, a Marshall Islands DAO LLC organized
under the Decentralized Autonomous Organizations Act of 2022 as amended.

This specification is licensed under the **SOLOMON DAO LLC SCHEMA REGISTRY LICENSE (PERMISSIVE)**.