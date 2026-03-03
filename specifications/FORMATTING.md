# Formatting Specification

Status: Draft
Schema family: `record-schema-formatting`
Current schema version: `1`

This document defines **repository-wide** formatting rules for records and their documents.

There are two levels:

1. **Baseline** — applies to all text files in the repo.
2. **Canonical profile (`canonical-ascii`)** — MUST be used for any text that is treated as a canonical surface (e.g., adopted text paths, filings, hashed sources).

If a project needs strict reproducibility, declare the profile in `*_META.yaml` under `extensions.formatting.profile`.

---

## 1. Encoding and newlines (baseline)

- **Encoding:** UTF-8 **without BOM**.
- **Newlines:** **LF** (`\n`) only. No CRLF.
- **Trailing whitespace:** forbidden.

Recommended repo settings:

- `.gitattributes` (recommended):

  ```
  * text=auto eol=lf
  ```

- `.editorconfig` (recommended):

  ```
  root = true

  [*]
  charset = utf-8
  end_of_line = lf
  indent_style = space
  indent_size = 4
  insert_final_newline = true
  trim_trailing_whitespace = true

  [*.{yaml,yml}]
  indent_size = 2
  ```

- `.prettierrc` (recommended):

  ```json
  {
      "endOfLine": "lf",
      "tabWidth": 4,
      "useTabs": false,
      "singleQuote": false,
      "trailingComma": "none",
      "printWidth": 80
  }
  ```

- `.vscode/settings.json` (recommended):

  ```json
  {
      "files.encoding": "utf8",
      "files.eol": "\n",
      "files.trimTrailingWhitespace": true,
      "files.insertFinalNewline": true,
      "editor.tabSize": 4,
      "editor.insertSpaces": true,
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "[markdown]": {
          "editor.wordWrap": "bounded",
          "editor.wordWrapColumn": 80
      },
      "[yaml]": {
          "editor.tabSize": 2
      }
  }
  ```

---

## 2. Unicode and punctuation

### 2.1 Canonical profile: `canonical-ascii` (MANDATORY where used)

Files governed by `canonical-ascii` MUST NOT contain typographic “smart punctuation” or ambiguous glyphs.

Disallowed characters (non-exhaustive):

- Curly quotes: `“ ” ‘ ’`
- En dash / em dash: `– —`
- Ellipsis character: `…`
- Non-breaking spaces and "fancy" spaces: `\u00A0`, `\u2000`–`\u200B`

Required substitutions:

- Quotes: use straight ASCII only: `"` and `'`
- Dashes:
  - Use `-` for compounds: `machine-readable`, `on-chain`
  - Use `--` (space dash dash space) for parenthetical asides in prose
  - For ranges, write `to` (e.g., `§104 to §111`) instead of an en dash
- Ellipsis: use `...`

Allowed non-ASCII characters in canonical text are limited to **semantically necessary** symbols (e.g., `§` when citing statutes). If you can express it clearly in ASCII, do that.

### 2.2 Baseline (non-canonical)

Non-canonical documents MAY use Unicode (including typography) where it improves readability, but avoid it in anything likely to be incorporated by reference, hashed, or pinned.

---

## 3. Emoji policy

- **File and directory names:** emojis are **never allowed**.
- **Canonical profile (`canonical-ascii`):** emojis are **not allowed**.
- **Baseline:** emojis are allowed only in non-authoritative docs (`README`, changelogs, informal logs) and must never change the meaning of a requirement (emojis are decoration, not semantics).

---

## 4. Line width

These rules exist to keep diffs readable. They are guidance unless a linter enforces them.

### 4.1 Default maximums

- Markdown prose (`*_DOC-*.md`, `*_MEM-*.md`, `*_LOG-*.md`): **80** characters per line
- YAML (`*_META.yaml`, registries): **120** characters per line
- JSON: **120** characters per line (format with stable key ordering where possible)

### 4.2 Exceptions

The following are exempt from line-width checks:

- Markdown tables
- URLs
- Code blocks
- Base58/base64 hashes, signatures, program addresses
- Long legal citations where splitting would harm clarity

### 4.3 Legal/filing instruments

For instruments intended to be executed/filed (charters, operating agreements, resolutions):

- Prefer **soft wrapping** in editors (do not hard-wrap paragraphs in a way that changes meaning).
- If hard wrapping is used, keep lines ≤ **100** where practical.

---

## 5. Spelling and locale

Default is **US English** (`en-US`) unless a document is intended as, or derived from, an instrument in a Commonwealth jurisdiction where **UK spelling** (`en-GB`) is appropriate (e.g., certain incorporation filings).

Rules:

- A document MUST NOT mix spelling variants.
- If locale matters, record it in metadata:

  ```yaml
  extensions:
    language:
      locale: en-US # or en-GB
  ```

- When quoting statutory or filed text, preserve the original spelling inside quotes.

---

## 6. Markdown conventions (baseline)

- Headings use ATX style: `#`, `##`, `###`.
- Lists use `-` (hyphen) bullets.
- Use fenced code blocks with triple backticks.
- Avoid raw HTML unless it is the only practical way to express something.

---

## 7. YAML conventions (baseline)

- Indentation: **2 spaces**.
- Keys: `lower_snake_case` preferred for new schemas/registries.
- Timestamps: ISO-8601 UTC strings (quote them to prevent YAML timestamp coercion), e.g. `"2026-01-04T00:00:00Z"`.

---

## 8. Canonical surfaces and pinning

If a repository defines an "adopted surface" (e.g., `governance.adopted_paths` in DAO proposals), every file in that surface MUST:

- comply with `canonical-ascii`; and
- avoid edits after pinning (amend via a new record that supersedes the prior one).


### 8.1 Index documents (`IND`) and packets (`PKT`)

`IND` (index) documents are normal source documents (usually Markdown). If an `IND` is part of a canonical
surface (e.g., an adopted text surface or a filing packet source), it MUST comply with the declared
canonical profile (commonly `canonical-ascii`).

`PKT` (packet) artefacts are derived outputs (often PDF) generated from ordered source documents. Formatting
rules apply to the *inputs* that feed a packet generator. Tooling SHOULD treat packet outputs as
regeneratable and SHOULD avoid manual edits to packet files.

If a project needs reproducible packet generation, define it in a formatting pack:

- inputs and ordering (e.g., `documents.pack` in metadata);
- templates (cover page, table-of-contents, footer/disclaimer blocks); and
- normalization rules for the packet generator (page size, margins, heading numbering, locale).

Binary artefacts like PDFs are typically *not* hashed as canonical surfaces unless a project explicitly
opts in and defines a stable generator + hash surface.

## 9. Document metadata blocks

Documents MAY include a machine-readable metadata block at the end of the file. This is distinct from the Markdown envelope header and is intended for tooling, indexing, and provenance tracking.

### 9.1 Format

Metadata blocks use PEM-style delimiters:

```
----------------------------BEGIN DOCUMENT METADATA-----------------------------
<Key>: <Value>
-----------------------------END DOCUMENT METADATA------------------------------
```

### 9.2 Placement

- The block MUST appear after the document content (including any footer or disclaimer).
- For documents with an `END OF <TYPE>` separator, the metadata block follows that separator.
- Exactly one blank line SHOULD precede `-----BEGIN DOCUMENT METADATA-----`.

### 9.3 Standard fields

| Field                    | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `SPDX-LicenseIdentifier` | SPDX license ID or `LicenseRef-*` for custom licenses  |
| `Document-Type`          | Category: `LICENSE`, `RESOLUTION`, `SOP`, `MEMO`, etc. |
| `Title`                  | Human-readable title                                   |
| `Version`                | Version string (e.g., `1.0`)                           |
| `Effective-Date`         | ISO-8601 date (`YYYY-MM-DD`)                           |
| `Canonical-URL`          | Authoritative URL for this document                    |
| `Record-ID`              | Associated record ID (e.g., `DP-00001`)                |

Additional fields are permitted. Field names use `Title-Case-Kebab`.

### 9.4 Example (license)

```
================================================================================

END OF LICENSE

================================================================================

----------------------------BEGIN DOCUMENT METADATA-----------------------------
SPDX-LicenseIdentifier: LicenseRef-SOLOMON-DAO-PUBLIC-GOVERNANCE-1.0
Document-Type: LICENSE
Title: SOLOMON DAO PUBLIC GOVERNANCE REPOSITORY LICENSE
Version: 1.0
Effective-Date: 2026-01-01
Canonical-URL: https://solomondao.org/licenses/governance-1.0
-----------------------------END DOCUMENT METADATA------------------------------
```

### 9.5 Example (resolution)

```
----------------------------BEGIN DOCUMENT METADATA-----------------------------
Document-Type: RESOLUTION
Record-ID: DP-00042
Title: Amendment to Treasury Management SOP
Adopted-Date: 2026-01-15
Effective-Date: 2026-02-01
SPDX-LicenseIdentifier: LicenseRef-SOLOMON-DAO-PUBLIC-GOVERNANCE-1.0
-----------------------------END DOCUMENT METADATA------------------------------
```

### 9.6 Hash surface interaction

When computing a hash surface (e.g., `markdown-body-v1`), tooling SHOULD exclude the document metadata block. The block is informational and not part of the canonical content.

## 10. License header format

Custom licenses SHOULD use a consistent header structure for readability and tooling recognition.

### 10.1 Structure

```
<LICENSE TITLE IN CAPS>

Version <X.Y> - Effective <Month YYYY>

================================================================================

<Licensor identification block>
<Canonical URL>

<Rights reservation>

<Scope summary - what this license covers>

================================================================================
```

### 10.2 Components

| Component          | Description                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Title              | All caps, descriptive name                                                                            |
| Version line       | `Version <X.Y> - Effective <Month YYYY>` or `Version <X.Y> – Effective <Month YYYY>`                  |
| Separator          | 80-character `=` rule                                                                                 |
| Licensor block     | Legal entity name, jurisdiction, governing law citation                                               |
| URL                | Canonical URL in angle brackets: `<https://...>`                                                      |
| Rights reservation | Brief statement (e.g., "All rights reserved except as expressly granted in this License.")            |
| Scope summary      | 1-3 sentences describing what the license covers; may include cross-references to related instruments |
| Closing separator  | 80-character `=` rule                                                                                 |

### 10.3 Template

```
<LICENSE NAME>

Version 1.0 - Effective <Month YYYY>

================================================================================

<ENTITY NAME> (the "<SHORT NAME>"), a <jurisdiction> <entity type> organized
under <governing law>.
<https://example.org>

All rights reserved except as expressly granted in this License.

<Brief description of what this license applies to and its relationship to
other licenses or governing documents if applicable.>

================================================================================

```

### 10.4 Cross-references

When a license is subordinate to or interpretive of other instruments, list them in the scope block using a bullet list:

```
This License forms part of the legal and operational framework described in:
 - the <Document Title> (<Record-ID>) (the "<Defined Term>");
 - the <Document Title> (<Record-ID>) (the "<Defined Term>"); and
 - the <Document Title> (<Record-ID>) (the "<Defined Term>").
```

### 10.5 Combining header and footer metadata

A complete license file structure:

```
<HEADER per §10.1>

<LICENSE BODY - numbered sections>

================================================================================

END OF LICENSE

================================================================================

----------------------------BEGIN DOCUMENT METADATA-----------------------------
SPDX-LicenseIdentifier: LicenseRef-<identifier>
Document-Type: LICENSE
Title: <License Title>
Version: <X.Y>
Effective-Date: <YYYY-MM-DD>
Canonical-URL: <https://...>
-----------------------------END DOCUMENT METADATA------------------------------
```

This keeps the human-readable header intact while adding machine-readable markers for tooling and indexing.

### 10.6 LICENSE body cadence and separators

Between the header and the END OF LICENSE footer, LICENSE bodies MUST follow these structural rules.

#### 10.6.1 Horizontal rule tokens

LICENSE files use exactly two horizontal rules:

- `RULE_EQ` (80 `=` chars): used ONLY for (a) the header boundary in §10.1, (b) the optional Table of Contents boundary in §10.6.5, and (c) the END OF LICENSE footer boundary.
- `RULE_DASH` (80 `-` chars): used ONLY between major sections.

```
RULE_EQ   := "================================================================================"
RULE_DASH := "--------------------------------------------------------------------------------"
```

Prohibitions:

- `RULE_EQ` MUST NOT appear between major sections.
- No other horizontal-rule spellings are permitted (no shorter/longer rules; no mixed characters).

#### 10.6.2 Major sections

Major section headings MUST be:

```
{N}.  <SECTION-TITLE>
```

Rules:

- `{N}` is a positive integer (1, 2, ...).
- Exactly two spaces after the period.
- Exactly one blank line follows the heading.
- Titles SHOULD be uppercase.

Between major sections, insert:

```

--------------------------------------------------------------------------------

```

(No `RULE_DASH` before section 1, and no trailing `RULE_DASH` after the final section.)

#### 10.6.3 Subsections (non-indented mode)

Within a non-indented section, subsections MUST be one of:

**(a) Titled subsection**

```
{N}.{M} <SUBSECTION-TITLE>
<Subsection-body>
```

**(b) Inline subsection**

```
{N}.{M}  <Subsection-inline>
```

Rules:

- For (a): exactly one space after `{N}.{M}`; body begins on the next line.
- For (b): exactly two spaces after `{N}.{M}`; text remains on the same line.

#### 10.6.4 Indented section mode (clause ladders)

A major section MAY use indented mode.

If indented mode is used:

- The section body MUST be indented by 12 spaces.
- Numeric subsection numbering (`{N}.{M}`) MUST NOT be used inside that section.
- Clauses MUST use the following nesting order to avoid ambiguity:
  - `(a)`, `(b)`, `(c)` ...
  - `(i)`, `(ii)`, `(iii)` ...
  - `(A)`, `(B)`, `(C)` ...

Clauses MAY be inline or block, but nesting MUST remain unambiguous.

Example:

```
4.  CONTRACTOR ACCESS AND LEAST PRIVILEGE

            (a) Access is granted only to the minimum scope required.
            (b) Credentials must be individual and revocable.
                (i) Shared credentials are prohibited.
                (ii) Exceptions require written authorization.
                    (A) Authorization must identify scope and duration.
                    (B) Authorization must be retained as a record.
```

#### 10.6.5 Optional TABLE OF CONTENTS (long licenses)

Long licenses MAY include a Table of Contents immediately after the header and before Section 1.

If present, it MUST be framed by `RULE_EQ` at top and bottom and list major section numbers/titles using the same `{N}.  <SECTION-TITLE>` titles as the body.

Example:

```
================================================================================

                            TABLE OF CONTENTS

    1.  OWNERSHIP
    2.  RESTRICTIONS
    3.  AUTHORIZED USE
   10.  TERMINATION
   11.  SEVERABILITY

================================================================================
```

## License

Copyright (C) 2026 **SOLOMON DAO LLC**, a Marshall Islands DAO LLC organized
under the Decentralized Autonomous Organizations Act of 2022 as amended.

This specification is licensed under the **SOLOMON DAO LLC SCHEMA REGISTRY LICENSE (PERMISSIVE)**.
