# Assertion packs

Record Schema validates the structure of individual repository artefacts. Assertion packs define the repository-wide properties that require more than one artefact, a derived value, a graph, raw bytes, or a deterministic generated output.

A conforming assertion engine is domain-independent. It does not recognise corpus-specific record series, field names, storage models, instruction models, or governance concepts. The repository supplies sources, selectors, tables, embedded-language definitions, rules, reports, and materializers as data. The engine executes only the closed vocabulary defined by `schema/assertion.pack.schema.json` and this specification.

## Pack document

An assertion pack is a YAML or JSON document with:

```yaml
schema: record-schema-assertion-pack
schema_version: 1
pack_id: example
```

The normative top-level fields are:

| Field | Purpose |
|---|---|
| `schema` | Must be `record-schema-assertion-pack`. |
| `schema_version` | Positive integer format version. |
| `pack_id` | Stable pack identifier. |
| `description` | Human-readable pack purpose. |
| `imports` | Repository-relative assertion-pack paths merged before this pack. |
| `default_source` | Source used by selectors that omit `source`. |
| `sources` | Named file sets. |
| `tables` | Literal or repository-derived lookup tables. |
| `languages` | Named embedded-language lexer definitions. |
| `selectors` | Named row-producing projections. |
| `reports` | Named deterministic report definitions. |
| `rules` | Assertion rules. |

A repository activates packs with `rules.assertion_packs` in its profile. Explicit CLI pack paths may select a narrower execution surface.

### Import semantics

Imports are resolved relative to the importing pack. Pack paths must remain inside the repository, must not traverse symlinks, and must resolve to regular files.

Imported declarations are merged first. A declaration in the importing pack replaces an imported declaration with the same identifier. Rule identifiers must remain unique after import resolution. Import cycles and unresolved imports are errors.

## Repository containment

Every path read or written by an assertion pack is repository-relative and containment-checked. Absolute paths, traversal outside the repository, symlink escapes, and non-regular files are rejected where a regular file is required. Materializers may only write declared destinations inside the repository.

## Sources

A source selects repository files before structural projection.

```yaml
sources:
  machine_documents:
    include: records/FSM/**/*_MAC-*.yaml
    exclude: records/FSM/**/fixtures/**
    parse: yaml
    doc_types: MAC
    series: FSM
```

Source fields:

| Field | Meaning |
|---|---|
| `include` | One glob or a list of globs. |
| `exclude` | One glob or a list of globs removed from the include set. |
| `parse` | `auto`, `yaml`, `json`, `markdown`, `text`, or `none`. |
| `doc_types` | Optional document-type filter. |
| `schema_ids` | Optional structured-document `schema` filter. |
| `series` | Optional record-series filter. |

File enumeration and source output order are deterministic. `auto` selects the parser from the file extension and known document shape. `none` exposes file metadata and raw bytes without parsing a structured value.

Prefer document-type, schema-id, and series filters where those identities are declared. A filename glob alone can omit alternate legal filename forms while leaving every dependent rule apparently clean.

## Indexed units and built-in bindings

Each selected file becomes an indexed unit. Selectors expose these built-in bindings:

| Binding | Value |
|---|---|
| `#file` | Repository-relative path. |
| `#directory` | Repository-relative parent directory, or the empty string at the root. |
| `#base_name` | Filename including its extension. |
| `#stem` | Filename without its final extension. |
| `#extension` | Lower-case final extension without the dot. |
| `#record` | Record identifier where available. |
| `#series` | Record series where available. |
| `#doc_type` | Document-type token where available. |
| `#schema` | Structured-document schema identifier where available. |
| `#document` | Parsed document root. |
| `#raw` | Decoded UTF-8 file text. |
| `#bytes` | Raw file bytes as `Uint8Array`. |
| `#lines` | File text split on newline boundaries. |
| `#path` | Path of the selected value. |
| `#parent` | Parent of the selected value. |
| `#key` | Property name or array index of the selected value. |
| `#value` | Selected value. |
| `#scope_path` | Parent-scope path when `each` is used. |
| `#scope_key` | Rendered parent-scope key when declared. |
| `#scope_value` | Parent-scope value when `each` is used. |

Expression evaluation also exposes each `#name` binding as `name`, because the expression grammar does not admit `#` in identifiers.

## Markdown data model

`parse: markdown` exposes a deterministic structural representation rather than only raw lines. The representation includes:

- document, heading, and section nodes;
- paragraphs and text lines;
- ordered and unordered list items;
- fenced code blocks and their language labels;
- inline-code spans;
- links and link targets;
- pipe tables, headers, rows, and cells;
- source line ranges and plain text.

This permits agreement rules between prose tables, headings, inline constants, links, and structured declarations without repository-specific Markdown code.

## Selector paths

Selector paths use a closed JSONPath subset:

| Form | Selects |
|---|---|
| `$` | Current root. |
| `.key` | Child property. |
| `..key` | Every descendant property named `key`. |
| `.*` or `[*]` | Every direct child. |
| `..*` | Every descendant. |
| `[n]` | Array index; a negative index counts from the end. |
| `['key']` | Quoted child property. |

A path selecting nothing yields an empty row set. A path may also be a list; list members are alternative paths whose results are concatenated.

## Selectors

A selector is a deterministic row pipeline. A named selector may be one selector or a list of selector names and inline selectors. Selector lists concatenate their rows recursively.

```yaml
selectors:
  enum_members:
    source: definitions
    path: $..enums[*]
    where:
      $.members:
        exists: true
    each: $.members[*]
    scope_key: "{#file}:{name}"
    bind:
      enum_name: "{#scope_value.name}"
      member_name: "{name}"
    project:
      enum: "{#enum_name}"
      member: "{#member_name}"
```

The pipeline order is:

1. Resolve `extends` and source.
2. Apply `unit_where` to the document root.
3. Select `path` matches.
4. Apply `where` to each path match.
5. Apply optional `each` descent and `each_where`.
6. Add `scope_key` where declared.
7. Add `with_tables` bindings.
8. Evaluate `bind` values.
9. Apply `expand` as a deterministic cross-product.
10. Apply regular-expression `extract`.
11. Apply embedded-language `lex` transformation.
12. Apply `post_where`.
13. Replace the row value with `project` where declared.

### Selector inheritance

`extends` names another selector. Scalar fields in the derived selector replace base fields. Base and derived `where` predicates are conjoined; base and derived `unit_where` predicates are also conjoined.

### Binding and value specifications

`bind` maps names to value specifications. Value specifications may read paths, built-in bindings, templates, literal values, tables, or expressions accepted by the closed evaluator. Bound values are available as both `name` and `#name` to subsequent selector stages.

### Expansion

`expand` maps one or more binding names to list-valued specifications. A row is emitted for every deterministic cross-product member. Empty expanded lists emit no rows.

### Extraction

`extract` may be a regular-expression string or an object:

| Field | Purpose |
|---|---|
| `pattern` | Regular expression. |
| `from` | Value specification supplying the input text; defaults to the row value. |
| `flags` | Regular-expression flags. |
| `global` | Emit every match rather than the first. |
| `group` | Numeric or named capture used as the row value. |
| `groups` | Bind several numeric or named captures. |
| `project` | Project each emitted match. |

### Lex transformation

A selector-level `lex` transformation tokenises a selected string using a named or inline language definition. It can filter by token `kinds` and identifier `roles`, and emit token text or token objects.

### Projection

`project` constructs a new scalar, list, or mapping from the current row and bindings. The projected value becomes `#value`; file, path, scope, and custom bindings remain available.

## Predicates

Predicates apply to selector rows. `all`, `any`, `none`, `not`, and `expr` are combinators. Every other key is a selector path or a `#binding`.

A condition operates on the set of values selected by its path. `exists`, `absent`, `count_eq`, `count_gte`, and `count_lte` operate on cardinality. Other operators require a non-empty set and apply to every value unless `mode: any` is declared.

Supported condition operators are:

- equality and membership: `eq`, `ne`, `in`, `nin`;
- numeric comparison: `gt`, `gte`, `lt`, `lte`;
- text: `matches`, `not_matches`, `contains`, `starts_with`, `ends_with`;
- shape: `type`, `empty`, `has_key`, `lacks_key`;
- cardinality: `exists`, `absent`, `count_eq`, `count_gte`, `count_lte`.

Supported `type` values are `string`, `number`, `integer`, `boolean`, `array`, `object`, `null`, and `scalar`.

A predicate operand beginning with `#` resolves a selector binding when that binding exists. This permits field-to-field and row-to-scope comparison without host-language code.

An `expr` clause has `{ bind, assert }`. `bind` projects named values from the current row or selector bindings; `assert` is evaluated by the closed expression language.

## Templates and expressions

String templates use braces to render paths and bindings, for example `"{#record}:{name}"`. A missing component makes a key unusable rather than silently rendering an empty join key. This prevents incomplete rows from collapsing into one shared key.

The expression grammar supports:

- literals: booleans, `null`, decimal numbers, hexadecimal integers, and quoted strings;
- unary operators: `!`, unary `-`;
- arithmetic: `+`, `-`, `*`, `/`, `%`;
- comparison: `==`, `!=`, `<`, `<=`, `>`, `>=`;
- short-circuit logic: `&&`, `||`;
- parentheses and function calls.

It has no property access, assignment, host-language evaluation, filesystem access, network access, dynamic imports, or user-defined functions.

Function groups:

| Group | Functions |
|---|---|
| Numeric | `sum`, `product`, `min`, `max`, `numbers`, `abs`, `ceil`, `floor`, `round`, `int`, `align`, `bits_to_bytes`, `pow`, `number_or_null`, `sum_ceil_div` |
| Collection | `len`, `count`, `first`, `last`, `distinct`, `unique_values`, `all_equal`, `list`, `slice`, `flatten`, `compact`, `concat_lists`, `concat_each`, `same_set`, `subset`, `intersects`, `difference`, `intersection`, `difference_count`, `matching` |
| Text | `contains`, `starts_with`, `ends_with`, `lower`, `upper`, `trim`, `concat`, `join`, `split`, `replace`, `matches`, `capture`, `normalize_name`, `strip_wrapping_quotes`, `has_alpha` |
| Mapping and path | `keys`, `values`, `has_key`, `at`, `all_at`, `find_by`, `filter_by`, `lookup`, `lookup_all`, `coalesce` |
| Ordering and layout | `tiles`, `overlaps`, `sorted_ascending`, `contiguous_from`, `binary_width`, `layout_span`, `byte_width` |
| Canonicalisation and encoding | `json_stringify`, `canonical_json`, `identifier_forms`, `scalar_values`, `digest_hex`, `to_hex` |
| Conditional | `defined`, `choose` |

Collection functions preserve deterministic input order unless their contract explicitly canonicalises or sorts. `canonical_json` recursively sorts mapping keys and may omit a declared list of keys. Digest functions are fixed to SHA-256.

## Tables

A table is either literal:

```yaml
tables:
  scalar_widths:
    entries:
      u8: 1
      u16: 2
```

or derived from selector rows:

```yaml
tables:
  widths_by_type:
    select: packed_structs
    key: "{name}"
    value: "{encoded_size}"
    mode: scalar
    on_duplicate: error
```

Derived tables accept the selector pipeline fields and `with_tables`, followed by `key`, `value`, `mode`, and `on_duplicate`.

Modes:

| Mode | Result per key |
|---|---|
| `scalar` | One value. |
| `list` | Ordered list of values. |
| `set` | First-occurrence ordered unique values. |
| `count` | Number of rows. |
| `sum` | Numeric sum. |
| `minimum` | Numeric minimum. |
| `maximum` | Numeric maximum. |

Duplicate policies are `first`, `last`, and `error`. Cyclic table dependencies are errors.

Rules should declare table dependencies through `with_tables`. A `derive` rule
without that field also binds table identifiers referenced directly by its
`bind`, `when`, or `assert` expressions. Unreferenced tables are not projected.

## Embedded languages

A language definition configures a deterministic lexer for expressions embedded inside corpus strings. It may declare identifier and number patterns, keywords, multi-character and single-character operators, punctuation, line and block comments, string quotes, member operators, balanced pairs, and forbidden adjacent token-kind pairs.

Identifiers are classified as:

- `function` when followed by the configured call opener;
- `member` when preceded by a member operator;
- `reference` otherwise.

The lexer reports illegal characters, unterminated strings or comments, unbalanced delimiters, forbidden token adjacency, and empty expressions unless explicitly allowed by the runtime definition.

## Rule envelope

Every rule requires:

```yaml
- id: EXAMPLE_RULE
  kind: require
  message: The declared condition must hold.
```

Rule identifiers are uppercase identifiers with an optional `/SUBCODE` suffix. Common fields are:

| Field | Meaning |
|---|---|
| `severity` | `error`, `warning`, or `advisory`; default is `error`. |
| `severity_by_mode` | Mode-to-severity overrides. |
| `modes` | One mode or a list of modes in which the rule is selected. |
| `enabled` | `false` excludes the rule. |
| `with_tables` | Tables bound for rule evaluation. |
| `bind` | Rule-local projected bindings. |
| `when` | Expression guard. |
| `materialize` | Deterministic output operation associated with the rule. |

### Execution modes and severity

The default mode is `development`. `--production` selects mode `production`. Mode names are open strings owned by the repository.

A rule runs when it is enabled and its `modes` field is absent or contains the selected mode. `severity_by_mode[mode]` replaces `severity` for that run. Advisory findings are reported but do not fail a run unless explicitly promoted. Warnings follow the CLI warning policy. Errors fail the run.

## Rule kinds

The assertion vocabulary contains sixteen rule kinds.

| Kind | Holds when |
|---|---|
| `forbid` | The selected defect shape has no rows. |
| `require` | Every selected row satisfies `must`. |
| `pattern` | Every selected value satisfies `match` or `not_match`. |
| `unique` | Rendered keys are unique, optionally within a rendered group. |
| `consistent` | Rows sharing a group render one consistent value. |
| `resolve` | Every selected use resolves to an admissible declaration. |
| `agree` | Left and right keyed projections satisfy the declared comparison. |
| `derive` | A closed expression over projected bindings evaluates to true. |
| `count` | Group cardinality is within `min` and/or `max`. |
| `reach` | Every graph node reaches an accepted tier or reviewed baseline state. |
| `cycle` | The selected dependency graph has no disallowed strongly connected component. |
| `decode` | Raw vector bytes decode according to the selected layout and match symbolic claims. |
| `digest` | A manifest exactly commits to the selected raw-byte file set. |
| `lex` | Embedded text is syntactically valid and declared references resolve. |
| `path` | A declared repository path resolves safely to the requested kind. |
| `format` | Source text is already in the declared deterministic format. |

### `forbid`

Required field: `select`. Every selected row becomes a finding.

### `require`

Required fields: `scope` or `select`, and `must`. Every row for which the predicate is false becomes a finding.

### `pattern`

Required fields: `select`, plus `match` or `not_match`. `flags` supplies regular-expression flags.

### `unique`

Required fields: `select` and `key`. `within` optionally partitions rows. Rows whose key cannot be rendered are skipped rather than joined under an empty key.

### `consistent`

Required fields: `select`, `group`, and `value`. A group with more than one distinct rendered value becomes a finding.

### `resolve`

Required fields: `uses`, `defines`, and either shared `key` or separate `use_key` and `define_key`.

Optional scope fields partition resolution. `dedupe_uses` collapses duplicate use rows. `exempts` declares scoped exemptions, with optional exemption predicates and separate use-to-exemption key/scope projections. `activation_defines` restricts checked uses to declarations activated by a second declaration set.

A definition collision is not resolved by encounter order. Ambiguous declaration keys remain ambiguous and produce deterministic findings.

### `agree`

Required fields: `left` and `right`. Each projection declares a selector, `key`, `value`, and optional duplicate policy. Duplicate policies are `first`, `last`, and `error`.

Comparisons are `loose`, `strict`, `number`, `case_insensitive`, `lte`, `lt`, `gte`, and `gt`. `require_left` and `require_right` control one-sided key findings. A key that cannot be rendered is omitted, not converted to an empty key.

### `derive`

Required fields: `scope` or `select`, and `assert`. `bind` projects values used by the expression. Missing required bindings suppress the row unless `require_bindings: false`, which binds them as `null`. `when` is an expression guard. `dedupe_by` evaluates one representative row per rendered key.

### `count`

Required fields: `scope` or `select`, plus `min` and/or `max`. `group` partitions counts.

### `reach`

Required fields: `nodes`, `edges`, and `node_key` or `key`.

Nodes may declare aliases, origin, group, and context. Edges may be explicit `from`/`to` pairs or text observations matched against node names and aliases. Match modes are:

- `exact`: complete-value equality;
- `word`: identifier-boundary occurrence;
- `nearby`: alias and context occurrence within a line window.

Origin and group relations can require the same or different origin/group. Self-origin matches may be excluded. Each edge supplies a tier. `include_self` controls self-edges.

`propagations` permit a declaration selected in one surface to become reached when an activation surface names one of its values. Propagation uses the same exact, word, nearby, origin, boundary, window, and tier model.

`tier` order is declared by `tiers`; the best reached tier wins. `unreachable_tier` names the absence tier.

A baseline may list accepted unreachable nodes. Baseline entries carry a category from `baseline_categories`. The engine checks both directions: a newly unreachable node and a baseline entry that is reachable again are findings.

### `cycle`

Required fields mirror `reach`: `nodes`, `edges`, and `node_key` or `key`. The engine computes deterministic strongly connected components. `include_self` determines whether a self-loop is a cycle finding.

### `decode`

Required fields: `layouts`, `vectors`, `layout_key`, `vector_layout_key`, `hex`, and `claims`.

Layout rows declare fields through `layout_fields`, with configurable field-name, offset, width, encoding, and constant projections. Vector rows supply bytes and symbolic claims. The engine checks bounds, supported encodings, constants, and claimed decoded values. `strict_claims` requires claim/layout completeness rather than checking only present claims.

### `digest`

Required fields: `manifest` and `tracks`. The engine computes SHA-256 over the raw bytes of the exact sorted tracked file inventory. It checks path/digest entries, optional count, and optional corpus root.

Manifest fields are selected with `entries`, `entry_path`, `entry_digest`, `count_path`, and `root_path`. Commitment options define a domain-separation byte, `u16le` or `u32le` path length, and whether each entry contributes its path and digest. Unsupported algorithms are rejected.

### `lex`

Required fields: `scope` or `select`, and `language`. `value_path` selects embedded text. `syntax` controls syntax findings. `reference_roles` chooses token roles treated as references. `defines` and key fields provide the declaration set. `ignore` and `ignore_pattern` exempt known language terminals. `max_syntax_findings` bounds repeated syntax output per row.

### `path`

Required fields: `scope` or `select`, plus `value` or `path_value`. `path_kind` is `any`, `file`, or `directory`. Resolution is repository-contained and symlink-safe.

### `format`

Required field: `source`, plus `formatter` or `operation`. The normative formatter is `yaml_flow_mapping_spacing`. It identifies only YAML flow mappings, verifies semantic round-trip stability, and does not rewrite prose braces. `line_budget` and `minimum_size` may limit candidates.

## Findings and accounting

A finding carries severity, rule identifier, code, file, path, message, and rule-specific rendered context.

A conforming execution reports, per rule:

- structural scope examined;
- rows selected;
- joined keys for `agree`;
- use and definition counts for `resolve`.

This accounting distinguishes a clean rule from an inert rule. A `forbid` rule correctly selects zero defect rows, so structural scope rather than matches is its vacuity signal. An `agree` rule with non-empty sides but no shared keys is vacuous. A `resolve` rule with declarations but no uses is vacuous.

`--fail-on-vacuous` converts these conditions to a failing exit status. Rule authoring should also use controlled mutations: a rule that remains clean after its target defect is introduced does not establish coverage.

## Reports

Reports are named deterministic projections over the same sources, selectors, tables, expressions, and reach analysis as rules. They cannot execute repository code.

A report contains ordered sections of four kinds:

| Kind | Purpose |
|---|---|
| `text` | Literal text. |
| `table` | Selected, grouped, computed, sorted, fixed-column rows. |
| `reach_summary` | Tier and category totals from one or more reach rules. |
| `reach_catalogue` | Per-node reach tier and baseline category from one reach rule. |

A `reach_summary` section may declare literal `lines` rendered from flat,
deterministic bindings such as `#RULE_nodes`, `#RULE_unreachable`,
`#RULE_tier_name`, and combined `#category_name` totals. `category_groups`
declares named sums of categories for those templates. This permits a
byte-stable operator report without embedding repository-specific rendering in
the toolkit.

A `reach_catalogue` section uses `order: label` by default. `order: source`
preserves the deterministic declaration order of the selected node rows.

Table columns support `first`, `last`, `count`, `sum`, `min`, `max`, `any`, `all`, `list`, `unique_list`, and `join` aggregation. Columns may be hidden, conditionally present, aligned, width-constrained, ordered by a separate value, and given explicit null rendering. Verbose detail rows are separately declared.

Human-readable and JSON report forms are derived from the same evaluated rows.

## Materializers

A materializer is attached to a rule and computes deterministic repository state. The default CLI behaviour is read-only drift detection. Filesystem changes require `--write`.

Supported operations:

| Operation | Purpose |
|---|---|
| `rewrite` | Apply the deterministic rewrite associated with a format rule. |
| `yaml_inline_mapping_field` | Rewrite or append one declared scalar field in a matched YAML inline mapping. |
| `reach_baseline` | Regenerate declared reach-baseline sections while preserving reviewed categories for surviving entries. |
| `digest_manifest` | Regenerate exact path/digest inventory, count, and corpus root. |

Materializers preserve unrelated bytes wherever the operation is line-oriented. A candidate rewrite is parsed and semantically checked before writing. Output order and line wrapping are declared and deterministic.

A read-only materializer exits non-zero on drift. Materializer configuration or containment errors use a separate configuration-failure status.

## Doctor and validation integration

Structural validation validates every selected assertion pack against `schema/assertion.pack.schema.json`, including imported packs, even when rule execution is disabled.

The assertion doctor verifies runtime loading, import resolution, rule selection, report definitions, and materializer definitions. Deep diagnosis executes every selected rule, renders every report, and computes every materializer read-only. Corpus findings remain corpus findings; runtime, configuration, import, report, and materializer failures determine doctor health.

## Determinism requirements

A conforming implementation must provide deterministic:

- file enumeration;
- import merge order;
- selector list and path-alternative order;
- expansion cross-product order;
- table aggregation and duplicate handling;
- finding order;
- graph component and reach-tier order;
- report rows and rendering;
- materializer output;
- digest inventory and root commitment.

Assertion packs must not rely on YAML mapping iteration where an explicit list or sort key is required for semantic order.

## Security requirements

Assertion packs are data, not executable extensions. A conforming implementation must not provide:

- host-language evaluation;
- shell commands;
- dynamic module loading from packs;
- network access initiated by pack declarations;
- absolute or escaping repository paths;
- writes outside declared materializer destinations;
- symlink traversal for pack, source, manifest, baseline, schema, report, or output paths.

The repository owns domain facts. The toolkit owns only the closed mechanics in this specification.
