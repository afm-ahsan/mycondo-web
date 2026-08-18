/**
 * Semantic column-width tokens for `DataGrid` tables.
 *
 * `DataGridTable` renders with `tableLayout.width: 'fixed'` by default, which sets each `<th>`'s
 * `width` from `column.getSize()` (TanStack's per-column `size`, 150px if unset — the same for
 * every column regardless of content). Because the table itself is `w-full`, the browser's
 * table-fixed algorithm scales all column widths proportionally to fill the container, so setting
 * a relative `size` per column (via these tokens) is enough to make wide-content columns wider and
 * compact columns narrower — no `min-width`/`max-width`/`auto` layout switch required.
 */
export const DATA_GRID_COLUMN_SIZE = {
  /** Kebab action-menu trigger, single icon/short badge. */
  action: 64,
  /** Status, date, short code/type/gender/boolean columns. */
  compact: 100,
  /** Flat/building references, phone numbers, categories. */
  medium: 160,
  /** Names, emails, descriptions, addresses — the columns that need the most room. */
  flexible: 220,
} as const;
