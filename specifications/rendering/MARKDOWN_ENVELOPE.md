# Markdown metadata envelopes

A render profile can style leading labelled Markdown paragraphs through
`markdown_envelope_style`. The declared `labels` select the consecutive entries
at the start of a section, following its title.

## Columns

`columns` accepts `1`, `2` or `"auto"`; its default is `1`.

- `1` gives each label/value entry a full row.
- `2` places consecutive entries in two equal-width columns. Values wrap
  within their column and the tallest value determines the row height.
- `"auto"` pairs adjacent entries when both values fit on one line in the
  two-column layout. Otherwise the next entry receives a full-width row.
  Source order is preserved. An unpaired final entry receives a full row.

`column_gap` is the horizontal distance between paired entries in points.
It defaults to 24 and must be non-negative. Labels share their measured width
across the block. If two columns leave insufficient value width, automatic mode
uses full rows; explicitly requesting two columns is an error.

## Spacing and pagination

`spacing_before` and `spacing_after` control clear space outside the box.
Padding controls space inside it. Row gaps apply between physical rows,
including rows holding two entries. The envelope remains together with its
section title and opening content when they fit on one page.
