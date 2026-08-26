# Qube Design System

## Real source of truth: github.com/RealImage/prefab-ui

The actual "Prefab" component library (`components/prefab/`) is rebuilt directly from the real Qube codebase — **[github.com/RealImage/prefab-ui](https://github.com/RealImage/prefab-ui)** (private repo, "Prefabricated React Components" for the Qube Design System, published to Storybook at the CloudFront URl shared with this project). Where a component exists in both the real repo and the earlier Figma reconstruction, **the real repo wins** — the Figma equivalent was kept but renamed with a `Figma` suffix (e.g. `ButtonFigma`, `CheckboxFigma`, `LinkFigma`, `PaginationFigma`, `TooltipFigma`, `HeaderFigma`, `TagFigma`) so both stay available without colliding.

- **Tokens** (`tokens/prefab/colors.css`, `fonts.css`, `spacing.css`, `qube-wire.css`) are copied verbatim from `src/styles/tokens/*` and `src/styles/themes/qube-wire.css` — these are the authoritative token values (semantic `--fill-*`, `--text-*`, `--icon-*`, `--border-*` names plus the same color/spacing primitives the Figma file also used). They load before the Figma-derived `fig-tokens.css` in `styles.css`.
- **Icons** (`assets/icons-prefab/`, 288 real SVGs copied from `src/assets/icons/`) replace the smaller Figma-reconstructed set as the primary icon source; `components/prefab/prefab-icon-data.js` packages the ones used by the rebuilt components. Real product logos (`assets/logos/QubeWireLogo.svg`, `QubeWireLogoBlueFull.svg`, `QubeLogoOnlyBlueIcon.svg`, `QubeSlate.svg`) also came from this repo, replacing the Figma vector reconstructions.
- **Components rebuilt from real source** (`components/prefab/`): Button, Link, Alert, Tag, Checkbox (+ CheckboxGroup), Breadcrumbs, FieldLabel/FieldHint/FieldError, Input, Textarea, Tooltip, Pagination, Header — translated 1:1 from the repo's real `.tsx`/`.scss` (class names, spacing, and colors match `pf-*` exactly; `react-aria-components`/`classnames` dependencies were swapped for plain React + a tiny local `classnames.js` shim since this environment has no npm). The rest of the real repo (ComboBox, Select, Calendar, DatePicker, DateRangePicker, TimePicker, Sidebar, Dialog, Sheet, Menu, FileDropzone, FilterSelector, TableControls, Toast, FileTrigger) has not been rebuilt yet — ask to continue and they'll be pulled in the same way.

---

Additionally extracted from a mounted Figma file, **"Qube Icons.fig"** (566 local components, 382 page-scoped external components, 191 shared-library components, 358 component sets, 1193 Figma Variables across 10 token collections, and a ~524-glyph SF-Symbols-derived icon set). A second attached file, "Pixel Design System.fig", pointed at the same underlying Qube kit and did not add new pages — the import below covers the full mounted structure.

## What is Qube?

Qube is a **digital cinema / theatrical distribution** operations platform: DCP (Digital Cinema Package) delivery and monitoring, theatre booking, composition/appliance management, KDM (Key Delivery Message) handling, and advertising/booking workflows for exhibitors, distributors and integrators. The Figma file is titled around "Qube" tokens (`Qube Product Tokens` variable collection) and contains multiple **product surfaces under one umbrella**, each with its own logo lockup found in the Global Side Nav page:

- **Qube** (core/admin product — fill-based wordmark)
- **Qube Wire** — distribution/delivery product
- **Qube Slate**
- **CineBook** — theatre booking
- **MovieWire**

Screens observed in the file's Playground page include DCP Delivery Status, Booking History (create booking → CPL selection → theatre selection), Inbox for Exhibitors, Suite Management Logs, Theatres search, Holdover/KDM flows, and an admin-style global side nav switching between the products above (Distributor / Integrator / Exhibitor account types).

## Sources

- Figma: "Qube Icons.fig" and "Pixel Design System.fig" (mounted read-only virtual filesystem; not a public URL). Pages: Cover, Index, Typography, Colors, Icons, Nomenclature, Tokens, Alert-Toast, Buttons-Actions, Breadcrumbs, Card-Header, Checkbox, Content-Switcher, Data-Display, Date-Picker, Date-Range-Picker, File-Upload, Filter-Drawer, Floating-Action-Bar, Headers-and-Footers, Input-Fields, Input-Steppers, List-Items, Modals, Navigation-Tabs, Page-Header, Progress-Bar, Pagination, Radio, Table, Table-Control, Tags, Toggle-Switch, Toggletip, Tooltip, Wizard, Global-Side-Nav-Bar (New), Filter-Controls, QW-Components, Playground (real product screens), Graveyard/Deprecated-Ground (excluded), Side-Nav-Bar, Search-Master.
- No GitHub repository or codebase was attached — everything here is derived from the Figma file alone.

## Index

- `styles.css` — root stylesheet; imports fonts + tokens.
- `tokens/fonts.css` — webfont declarations (Commissioner, Roboto; substitutes flagged below).
- `tokens/figma/fig-tokens.css` — 1815 generated CSS custom properties from the file's 10 Figma Variable collections (colors, spacing, radius, stroke, typography, component-level tokens).
- `tokens/colors-*.card.html`, `tokens/type-*.card.html`, `tokens/spacing.card.html`, `tokens/radius.card.html`, `tokens/shadow.card.html` — foundation specimens (Design System tab → Colors / Type / Spacing groups).
- `components/` — reusable primitives, grouped by concern (see Components below).
- `assets/logos/` — product wordmarks/lockups (Qube, Qube Wire, Qube Slate, CineBook, MovieWire), copied verbatim as SVGs.
- `assets/icons/` — `icon-data.js` (114 glyphs), `Icon.jsx` wrapper, `icons.card.html` specimen.
- `thumbnail.html` — homepage tile.

## Components (213 built, by directory)

- `components/buttons/` — Button, AddFilled, Add2
- `components/forms/` — CheckboxBase, RadioButtonWLabel, Toggle, InputField, InputSteppers, DatePicker, FileUpload, Filter, ChevronDown/Up, Calendar, Search2, Shortcut, RadioButtonUnselected3/4, Checkbox/Checkbox9/CheckboxSelected, plus ButtonForms/AddFilledForms/Add2Forms/Add8Forms (dependency copies)
- `components/feedback/` — Alerts, Tooltip, ToggleTip, ProgressBar, AlertRounded4, AlertFilled6, plus dependency icon copies
- `components/navigation/` — Pagination (+ NavigationBase/EllipseBase/PageNumberBase), BreadcrumbItems, Breadcrumb, ContentSwitcher, Steps, Wizard, ActionListItem(+Group), DropdownMenu(+Header/Footer/LeadingItem/TrailingItem), FormGroupHeader/Footer, IconButton, SelectInputWithAutocomplete, NavItemBase, AppSidebarUser, Link, Spinner(+Base), Counter, Divider, Badge(+Group), Slot(+Block), Search5, Text
- `components/table/` — TableCellBase, TableHeaderCellBase, TableFooterBase, BaseSortingIndicator(+Icon), Star, Menu, Edit2, Indicator, MoreVertical2, plus `*Table`-suffixed copies of the navigation dependencies used inside cells (kept as separate files because Figma table cells embed their own instance overrides)
- `components/overlays/` — Modal, BottomBar
- `components/layout/` — CardHeader, Button6/29/31–38 (card-header action-button variants), InfoFilled, SimpleIconTextSmall
- `components/cinema/` — ApplianceBay, Appliance, CompositionCard(+Items) — Qube-specific DCP/appliance-bay and composition-card widgets, plus their icon dependencies (Archive, Audio, Subtitles, ClosedCaptions, Key, LockOpen, Folder, Download, EmailAddress, InfoFilled, ConfirmCircleFilled, Checkbox variants)
- `components/avatar/` — AvatarEarlyAccess, FocusRing, CodePartsStatus
- `components/data-display/` — Amount (currency/decimal formatting for bookings & billing)
- `components/tags-badges/` — BadgeTagsBadges, Tag, CancelRounded, CircleTagsBadges

**Naming note:** Figma's own component tree reuses generic names ("Button", "Badge", "Add", "Divider" …) as *local* dependencies inside many different top-level families. Where the same name was needed in more than one directory, later copies were suffixed with their directory (e.g. `ButtonNav`, `BadgeTable`, `Add2Forms`) so every export is unique on `window.<Namespace>`. The `.d.ts` beside each still documents its real Figma node id.

### Intentional additions
- `assets/icons/Icon.jsx` — a thin wrapper around the materialized icon-data map. Not a Figma component; added so icons render as `<Icon name="…" />` in prototypes.

## Tokens

1815 CSS custom properties generated from the file's Figma Variables (10 collections: Ungrouped, Alias, Qube Product Tokens, Color Styles, Mapped - OLD, Global Metrics, 🔠 Typography, Colours Base - OLD, Meaningful Colors-Deprecated, Nav Bar) — including 6 theme/mode scopes (`slate`, `icount`, `dark`, mobile breakpoint, `positive`, and more). 2 of 1193 source variables (library-aliased) did not resolve and are omitted; everything else is 1:1.

Figma text/effect **styles** (as opposed to Variables): the file defines **zero** — all typography in this kit is driven by raw font-family/size/weight variables plus per-instance overrides, not named text styles. Nothing was skipped here.

## CONTENT FUNDAMENTALS

This file is a component library, not a marketing surface, so most "content" is UI labels rather than brand copy. From what is present:

- **Voice**: operational and literal — "DCP Delivery Status", "Suite Management Logs", "Holdover KDM", "Booking History". No taglines, no second-person marketing copy.
- **Casing**: Title Case for nav items and section headers ("Delivery Monitoring", "Filter Controls"); sentence case for helper/description text under foundation headers (e.g. "Our spacing system is built around a base unit of 8 pixels…").
- **Numbers/units are explicit and technical**: "2px", "space-025", "24px × 24px bounding box with 2px padding" — precision over friendliness.
- **No emoji** anywhere in UI copy (the one 🔠 you'll see is a Figma-side collection-name decoration, not product content).
- **Errors/status use short, plain labels**: Rested / Hover / Pressed / Disabled / Selected; Constructive / Destructive / Negative / Positive / Notice as semantic button/alert variants — not custom copy per state.

## VISUAL FOUNDATIONS

- **Color**: a saturated brand blue (`rgb(8,71,130)` / `--blue-700`-ish, used 341× as fill/stroke/text) paired with a cool blue-gray neutral ramp (`rgb(103,122,144)`, `rgb(225,228,233)`) rather than pure grays — the whole UI reads cool/technical. Semantic accents: orange `rgb(230,92,0)` for warnings/destructive-adjacent emphasis, red `rgb(207,19,34)` for negative/error, plus a violet ("Amount"/premium) and green (positive) accent. Backgrounds are almost always off-white (`rgb(245,248,250)`) with white (`rgb(255,255,255)`) cards — no dark mode observed as a primary surface (a `dark` token mode exists but isn't the default).
- **Type**: **Commissioner** (Medium/Regular/SemiBold/Bold) is the workhorse UI face for ~1600+ of the observed text nodes; **Roboto** is used for a large single cluster (728 nodes at 16px — likely one screen's body copy); **Cascadia Code** and **Menlo** are monospace, used in developer/token-facing surfaces (spec tables, IDs, file names); **Objektiv Mk3** appears in a modest number of secondary/tertiary button and dropdown labels. Sizes step in a fairly fine (non-4/8-snapped) scale: 8, 10, 12, 14, 16, 18, 20, 22, 24…48px.
- **Spacing**: strict 8px-base scale with a 2px multiplier floor — `space-025` (2px) through `space-1000` (80px). Component internals (badge/button/tag height, icon size) are all built from this scale plus a parallel `global-sizes` scale (16–60px) for fixed control heights.
- **Radius**: `radius-0` (sharp) → `radius-025` (2px, small controls) → `radius-075`/`radius-100` (6–8px, cards/inputs) → `radius-max` (1000px, pills — badges, tags, avatars). Cards and modals sit at 8px; buttons/inputs at 4–6px; badges/tags/counters are full pill.
- **Shadows**: soft and blue-tinted, not neutral black — `rgba(4,38,82,0.06)` and `rgba(4,38,82,0.1)` for elevation, occasionally a neutral `rgba(0,0,0,0.06)`. No heavy/hard drop shadows anywhere observed.
- **Borders**: thin (1px) `rgb(225,227,229)` hairlines are the default table/card border; a thicker 2px bottom border marks table headers specifically. Focus rings use a distinct `_BaseFocusRing` component (outer ring, not just an outline color change).
- **Backgrounds/imagery**: no photographic hero imagery, no gradients, no hand-drawn illustration, no repeating pattern/texture in the component/foundation pages. The Playground (real product) pages are dense operational data tables and cards, not marketing surfaces — flat color fills throughout.
- **Animation**: not modeled in static Figma frames; no easing/duration tokens were found in the Variable collections. Treat interactions as instant state swaps (Rested/Hover/Pressed) unless a consuming project specifies otherwise.
- **Hover/press states**: components model explicit `state` variants (Rested / Hover / Pressed / Selected / Disabled) rather than deriving them from opacity or CSS filters — copy the per-state fill/border values baked into each component rather than inventing a hover rule.
- **Transparency/blur**: used sparingly for disabled-state fills (e.g. `rgba(121,135,156,0)` transparent borders) and shadow alpha — no frosted-glass/backdrop-blur surfaces observed.
- **Cards**: white fill, 8px radius, 1px hairline border and/or the soft blue shadow above — never a colored left-border accent strip.

## ICONOGRAPHY

- The file's own Icons/Principles page states the icon system is built on **SF Symbols (SF Symbols 6, developer.apple.com/sf-symbols)** as its base, redrawn into a 24×24 bounding box with 2px padding.
- Icons are implemented as **individual vector components** (not an icon font) — hundreds of standalone symbols (`AddFilled`, `ChevronRight`, `CancelCircleFilled`, `InfoFilled`, …), many duplicated slightly per consuming page/library-sync. The METADATA inventory counts roughly **524 distinct glyphs** in total.
- **114 of those glyphs** were materialized into `assets/icons/icon-data.js` (a name → `{viewBox, body}` SVG map) plus `Icon.jsx`, covering the highest-usage set (add/cancel/chevron/arrow/info/alert/confirm families, plus file/media glyphs used by the cinema-specific composition-card component). The remaining glyphs exist in the source file and can be pulled in on request — see Caveats.
- No emoji, no Unicode-character icons, and no separate icon font were found anywhere in the file.

## Caveats & substitutions

- **Fonts**: Commissioner and Roboto are loaded live from Google Fonts (`tokens/fonts.css`). Two faces in the source are **not** freely available and were substituted with the closest Google Fonts match — flagged for you to replace with the real files if you have them: **Objektiv Mk3 → Public Sans**, **Cascadia Code → JetBrains Mono**. `Space Mono` (2 uses) and a `--weight-weight-regular: "Regular"` token reference a font that isn't embedded yet — see the sidebar font-upload prompt.
- **Icon coverage**: 114 of ~524 glyphs are materialized. Ask to expand the set (by name or by screen) if a prototype needs a glyph that isn't in `icon-data.js` yet.
- **Component coverage**: 213 of the 358 named component sets (1045 counting every variant-axis expansion the compiler enumerates) are built as real `.jsx` primitives — the ones most used across the product (buttons, forms, tags/badges, tables, navigation, feedback, cinema-specific appliance/composition widgets, avatar, overlays, layout). Many of the remaining ~145 sets in Figma are page-scoped duplicates of the same family (e.g. "Button" and "Card Header" are defined locally inside a dozen+ frames with the same shape) rather than distinct designs, and a large fraction of the file (Playground, Graveyard, Deprecated-Ground) is exploratory/deprecated and was intentionally skipped. Ask for a specific missing family by name and it can be materialized on request.
- **No logo file** beyond the SVG lockups pulled from the Global Side Nav page — there is no separate "logo file" or brand-guidelines page in this kit; the wordmarks in `assets/logos/` are the only marks found.
- **Two attached .fig files** ("Qube Icons.fig", "Pixel Design System.fig") resolved to the same mounted page/frame structure — no separate content from a second file was found to merge in.

## Building starting points / UI kits

No dedicated product UI kit was built yet (no specific product screen was requested). The Playground page in the source contains real screens (DCP Delivery Status, Booking History, Inbox for Exhibitors, Suite Management Logs, Theatres) that a future UI kit should be built from directly via `fig_materialize({ frames: [...] })` rather than re-guessed.

## Full component name index (updated)

**avatar**: AvatarEarlyAccess, CodePartsStatus, FocusRing

**buttons**: Add2, AddFilled, ButtonFigma

**cinema**: Add8, Appliance, ApplianceBay, Archive5, Audio5, Checkbox14, Checkbox2, CheckboxIntermediate3, CheckboxSelected5, ChevronRight7, ClosedCaptions5, CompositionCard, CompositionCardItems, ConfirmCircleFilled5, Download6, EmailAddress5, Folder5, InfoFilled8, Key5, LockOpen5, Subtitles5

**data-display**: Amount, CancelCircleFilled3, Checkbox14DataDisplay, Circle6, DataDisplay, InfoFilled8DataDisplay, MenuItem, Status9, SummaryCounts, Tag2

**feedback**: AddFilled6, AlertFilled6, AlertRounded4, Alerts, ButtonGroup, Cancel7, CancelCircleFilled3Feedback, ChevronRight7Feedback, Circle6Feedback, ConfirmCircleFilled5Feedback, ProgressBar, Tag2Feedback, ToggleTip, TooltipFigma

**forms**: Add2Forms, Add8Forms, AddFilled6Forms, AddFilledForms, Adjust4, AlertFilled, BaseFocusRing, ButtonForms, ButtonGroupForms, Calendar, Calendar5, Cancel7Forms, CancelCircleFilled3Forms, Checkbox14Forms, Checkbox9, CheckboxBase, CheckboxFigma, CheckboxSelected, CheckboxSelected5Forms, ChevronDown, ChevronDown7, ChevronRight7Forms, ChevronUp, ChevronUp5, Circle6Forms, DatePicker, DateRangePicker, EditColumn, ExternalLink4, FileUpload, Filter, Filter2, ID3, IconComponent, InfoFilled8Forms, InputField, InputField2, InputSteppers, LinkButtons, RadioButtonUnselected3, RadioButtonUnselected4, RadioButtonWLabel, Remove6, Search2, Search8, SearchMaster, Shortcut, Tag2Forms, Toggle

**layout**: Add2Layout, AddFilled6Layout, AddFilledLayout, ArrowLeft4, BottomBar, Button29, Button31, Button32, Button33, Button34, Button35, Button36, Button37, Button38, Button6, ButtonGroupLayout, CancelCircleFilled3Layout, CardHeader, ChevronLeft7, ChevronRight7Layout, Circle6Layout, HeaderFigma, InfoFilled, PageTitle, SimpleIconTextSmall, Tag2Layout

**navigation**: ActionListItem, ActionListItemGroup, Add2Nav, AddFilledNav, AlertFilled6Nav, AlertFilled6NavB, AppSidebarUser, ArrowRight3, Badge, BadgeGroup, BaseFocusRingNav, Breadcrumb, BreadcrumbItems, BreadcrumbItems6, Button19, ButtonNav, ButtonTertiaryDefaultActiveFalse, CancelCircleFilled3Nav, Check, CheckboxBaseNav, ChevronDown4, ChevronLeft3, ChevronRight2, ChevronRight4, ChevronRight7Nav, ChevronUp3, ChevronsLeft, ChevronsRight, Circle, Circle6Nav, ClockFastForward, ConfirmSquareFilled2, Connectors4, ContentSwitcher, Counter, DashiconsAdminLinks, Divider, DropdownHeader, DropdownLeadingItem, DropdownMenu, DropdownMenuFooter, DropdownTrailingItem, FLMX, FormGroupFooter, FormGroupHeader, Frame, History, IconButton, Info, LinkFigma, Logos, Logout3, MenuTitle, MoreHorizontal5, MoreHorizontal6, MoreHorizontal9, Movies4, NavItemBase, Number12, Number15, Orders4, PaginationEllipseBase, PaginationFigma, PaginationNavigationBase, PaginationPageNumberBase, PrimaryNavbar, Search5, SelectInputWithAutocomplete, SideNavBar, Slot, SlotBlock, Spinner, SpinnerBase, Steps, Tag12, Tag2Nav, Text, User, User8, Wizard

**overlays**: AddFilled6Overlays, AddFilled6OverlaysB, BottomBarOverlays, BulkAction, ButtonGroupOverlays, ButtonGroupOverlaysB, CancelCircleFilled3Overlays, CancelCircleFilled3OverlaysB, ChevronLeft7Overlays, ChevronRight7Overlays, ChevronRight7OverlaysB, Circle6Overlays, Circle6OverlaysB, HeaderOverlays, Modal, RightPanel, Tag2Overlays, Tag2OverlaysB

**table**: ActionListItemGroupTable, ActionListItemTable, AddFilled6Table, AmountTable, BadgeGroupTable, BadgeNeutralMediumFalseFalse, BadgeTable, BaseFocusRingTable, BaseSortingIndicator, BaseSortingIndicatorIcon, Button19Table, ButtonGroupTable, ButtonTertiaryDefaultActiveFalseTable, CancelCircleFilled3Table, CheckTable, CheckboxBaseTable, ChevronDown4Table, ChevronLeft3Table, ChevronRight4Table, ChevronRight7Table, ChevronUp3Table, ChevronsLeftTable, ChevronsRightTable, Circle6Table, CounterTable, DividerTable, DropdownHeaderTable, DropdownLeadingItemTable, DropdownMenuFooterTable, DropdownMenuTable, DropdownTrailingItemTable, Edit2, FormGroupFooterTable, FormGroupHeaderTable, IconButtonTable, Indicator, InfoTable, LinkTable, Menu, MoreHorizontal6Table, MoreVertical2, PaginationEllipseBaseTable, PaginationNavigationBaseTable, PaginationPageNumberBaseTable, PaginationTable, Search5Table, SelectInputWithAutocompleteTable, SlotBlockTable, SlotTable, SpinnerBaseTable, SpinnerTable, Star, Status9Table, SummaryCountsTable, TableCellBase, TableFooterBase, TableHeaderCellBase, Tag12Table, Tag2Table, TextTable

**tags-badges**: BadgeTagsBadges, CancelRounded, CircleTagsBadges, TagFigma

**prefab**: Alert, Breadcrumbs, Button, Checkbox, FieldLabel, Header, Input, Link, Pagination, PrefabIcon, Tag, Textarea, Tooltip

