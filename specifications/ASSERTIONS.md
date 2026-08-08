# Assertions

Record Schema validates one document at a time. A record's directory name, its
`_META.yaml`, and each document against its own JSON Schema — all of these are
questions that can be answered by looking at a single file.

Most of what a repository actually needs to hold true is not like that. An
ordinal allocated in one record and read in another. A byte width declared once
and restated at four embedding sites. A record nothing depends on. None of these
is visible from inside any one document, and every one of them is well-formed by
every check that only looks at one.

This specification defines the layer that answers those: a declarative set of
cross-document checks, carried by the repository as data and executed by any
conforming toolkit.

## Why the checks are data

The alternative is what repositories do without this layer: they grow a `tools/`
directory. That works, and it fails in a specific way.

A check written as code lives outside the thing it checks. It is not covered by
the repository's own provenance commitment, so it can change without the
repository's root moving. It acquires a dependency tree. It accumulates tables —
a width vocabulary, a fixture-to-layout binding, a list of exempt paths — and
those tables are then the only statement of facts the repository itself should
own. When a fixture is added after the tool's author stops looking, the tool
reports clean because nothing bound it.

Every one of those is a case of the repository's own conformance surface living
somewhere the repository does not control. An assertion pack is the repository's
statement of what must hold, in the same sense its profiles and schemas are.

The consequence for implementations is the one that matters: **a conforming
toolkit knows nothing about any repository's domain.** It does not know what a
packed struct is, or an ordinal registry, or a projection contract. A repository
declares which of its own paths play which role, and the engine does the rest. A
check the engine could only run because it recognised a domain would be a check
that domain has to keep alive inside somebody else's tool.

## Packs

A pack is a YAML document with `schema: record-schema-assertion-pack`, validated
by `schema/assertion.pack.schema.json`. It declares:

- **`sources`** — named document sets.
- **`selectors`** — named projections over those sets, referenced by identifier.
- **`tables`** — named key/value maps available to expressions.
- **`rules`** — the checks.
- **`imports`** — other packs to merge first. Later declarations win by
  identifier, so a repository can ship a base pack of sources and a set of
  narrow packs that import it without either copying the other.

A repository lists its packs in the profile under `rules.assertion_packs`.

A pack contains no code, no path outside the repository, and nothing an
implementation executes. Pack paths are resolved inside the repository and
rejected if they escape it, are symlinks, or are not regular files — a rule file
is data a toolkit trusts about the tree it is checking, and letting it name
`../../etc` would make the check a file-read primitive.

## Sources

A source selects files by glob, and may narrow by declared document type, schema
id, or series.

**Select by document type wherever the repository's naming convention allows
it.** A repository frequently names one kind of payload more than one way —
`WIR-00001_WIR-encoding.yaml` and `FSM-00001_WIR.yaml` are both wire documents —
and a glob written for one silently drops the other. Every rule built on that
source then reports clean over the documents it never opened. This is not
hypothetical; it is the single most productive way to make a whole pack inert
while every rule in it appears to pass.

## Selector paths

A deliberately small subset of JSONPath. Small because every construct it admits
has to be executable identically by any conforming implementation; an expression
language with a host escape hatch would put behaviour back into the consumer,
which is the thing this layer exists to remove.

| Form | Selects |
|---|---|
| `$` | the document root |
| `.key` | a child by key |
| `..key` | every descendant under that key, at any depth |
| `.*` / `[*]` | every child |
| `..*` | every descendant node |
| `[n]` | an array index; negative counts from the end |
| `['key']` | a child by quoted key |

Evaluation is total. A path that matches nothing yields an empty list rather
than an error, because absence is a condition rules test rather than a fault.

## Predicates

A predicate maps selector paths to conditions. `all`, `any`, `none`, `not`, and
`expr` are reserved as combinators; every other key is read as a path.

Conditions run against the *set* of values a path selects. `exists` and `absent`
are defined on the cardinality of that set; every other operator requires a
non-empty set and, by default, holds for all of it. `mode: any` relaxes that to
at least one.

`expr` evaluates arithmetic over the matched value. Some scoping conditions are
not "this field equals that" but a relation between several of a node's own
numbers — a dense ordinal registry has a maximum near its member count, a sparse
allocation table does not. Writing that as a chain of comparisons hides the
claim; writing it as an expression states it.

## Rule kinds

Eleven kinds, each a **shape of defect** rather than a subject. This is the
choice that keeps the engine domain-free: a rule kind describes what going wrong
looks like structurally, and a repository supplies what plays each part.

| Kind | Holds when |
|---|---|
| `forbid` | the selector matches nothing |
| `require` | every selected row satisfies a predicate |
| `pattern` | every selected value matches, or does not match, a regular form |
| `unique` | keys are distinct within their group |
| `consistent` | rows sharing a group agree on a value |
| `resolve` | every use resolves to a declaration |
| `agree` | two projections joined on a key relate as declared |
| `derive` | a computed value satisfies an expression |
| `count` | a group's cardinality falls within bounds |
| `reach` | every node is reached, modulo a categorised baseline |
| `decode` | declared bytes decode to the claimed fields |
| `digest` | a committed manifest matches the tree it names |

`unique` and `consistent` are worth distinguishing: `unique` asks whether two
rows collide on a key, `consistent` asks whether rows that share a key disagree
about something else.

### Joins are not always equalities

`agree` supports `lte`, `lt`, `gte`, and `gt` alongside the equality modes. A
declared ceiling and the thing it bounds are joined on one key and related by an
inequality; forcing that into an equality reports every subject comfortably
inside its bound as disagreeing with it.

A key that resolves to two different values on one side is **dropped**, not
resolved to the first seen. Such a key is not a key, and joining against
whichever copy was read first reports the rest of the repository as disagreeing
with an arbitrary winner.

### Keys built from absent fields

A key template referencing a path that selects nothing renders as `null`, and
the row is skipped. A join key built from a missing field is not the empty
string; it is no key at all, and collapsing the two joins every incomplete row
to every other one.

## Severity

`error`, `warning`, and `advisory`.

An advisory is an observation needing a human decision — a placeholder
identifier in an undeployed record, a fixture carrying bytes no layout claims.
Advisories print and never fail a run unless promoted. A gate that fails on
things it cannot itself adjudicate teaches people to silence it.

## Baselines

`reach` diffs its findings against a baseline file, so the check fails on a
*new* unreachable declaration rather than on the accepted set.

Two properties matter:

**Every entry carries a category, from a vocabulary the rule declares.** An
uncategorised exemption reads as accepted and names no edit that would remove
it. A category is a judgement about the design, not a fact about the tree, so it
is written by a person and preserved across regeneration.

**The baseline is checked in both directions.** An entry whose subject came back
to life is reported, because a stale exemption silently re-accepts the next
regression under the same name.

## Vacuity

This is the part of the specification that exists because of what goes wrong in
practice.

A rule that reports clean has either looked and found nothing, or never looked.
Nothing in a finding list distinguishes those, and the second is the more common
outcome when a rule is first written. Four distinct mechanisms were observed
while porting a large corpus onto this layer, each of which produced a rule that
passed while checking nothing:

1. A source glob that matched a fraction of the documents it was written for.
2. An `agree` rule whose two sides selected hundreds of rows each and shared no
   key.
3. A plural path bound as a scalar, so a guard clause meant to admit rows
   excluded all of them.
4. A `resolve` rule whose definition side selected hundreds of rows and whose
   use side selected none — hidden by a single combined row count.

**A conforming implementation must therefore report, per rule:** nodes examined
(scope), rows matched, join coverage for `agree` rules, and use and definition
counts separately for `resolve` rules. Scope rather than matches is the signal
for a ban, which passes *by* matching nothing.

None of this makes a rule correct. It makes an inert rule visible. The only
thing that establishes a rule works is breaking what it checks and watching it
fail, and a repository maintaining assertion packs should do that as a matter of
course.

## Coverage is a property worth reporting

Some rules are bounded by how much of the repository declares the thing they
read, rather than by how much of it exists. A golden decoder covers the fixtures
that say what their bytes are; a cross-record comparison covers names declared in
more than one record.

Such a rule is correct and may still compare nothing today. That is not a defect
and should not be reported as one — but it should be reported. A repository is
well served by an advisory rule that names the material a check would cover if
it were declared, because silent non-coverage is exactly what a passing run
cannot tell you about.
