# Data-table cells

A `data-table` directive names a document-relative CSV or TSV resource and declares
its columns. The first source record must match the declared headers exactly.
Quote cells containing newlines, separators or quotes using CSV/TSV quoting rules.

```markdown
:::data-table tables/payments.tsv
columns:
  - { header: Payment, type: text, align: left, width: max-content }
  - { header: Particulars, type: text, format: markdown, align: left, width: auto }
striped_rows: true
:::
```

## Text interpretation

For `type: text`, the optional `format` is one of:

| Format | Interpretation |
|---|---|
| Omitted or `plain` | Literal text, including Markdown punctuation and brackets. |
| `markdown` | Inline Markdown: bold/emphasis, inline code, links and line breaks. |

For example, a particulars cell may contain
`**Signature:** [full signature](https://solscan.io/tx/full-signature) (external link)`.
Inline markup controls presentation; it does not change the underlying CSV/TSV value.
Backslash escapes retain literal Markdown punctuation. Column headers are always literal.
Block constructs, nested tables and images are not supported within these cells.

The same text-column declaration applies to `datasets.*.columns` in a document template
contract, as defined in `schema/document.template.schema.json`. Date columns still
require `YYYY-MM-DD` or `DD MMM YYYY`; decimal columns use their existing precision,
rounding and grouping properties. `format: markdown` is not valid for either type.

## Rendering

PDF and DOCX output preserve inline formatting and hyperlinks inside cells.
Intrinsic widths and PDF wrapping are measured using each run’s font. A long link
can wrap without truncation; every visible fragment remains linked to the complete
destination. PDF rows stay together, and continuing tables repeat their headers.
A row taller than a full content page is rejected rather than clipped.

External-link indicators are ordinary cell content. PDF viewers decide whether a URI
opens in a browser tab or window; document rendering does not force that preference.
