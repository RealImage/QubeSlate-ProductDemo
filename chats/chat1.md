# Campaign Information Form

_Started 2026-08-25 14:47 UTC_

---

## User

<system-info comment="Only acknowledge these if relevant">
Project title is now "1. What Qube Slate is??At the highest level, Qube Slate is Qube's cinema adverti"
Current date is now August 25, 2026
</system-info>

<attached aesthetic_system_instructions>
A design system or theme is attached to this project. That attachment already answers the visual-style question: apply it. Do NOT ask the user which visual style to use — no questions about vibe, colors or palette directions (including color-swatch svg-options questions), typography, mood, or art direction, and skip the "divergent visuals" question from the question-asking tips; offer divergent visual directions only if the user themselves asks for alternatives. This rule bans asking the user to pre-pick a style in the abstract — swatches, mood words, palette pickers. It does not ban asking them to choose among candidates you have already built: putting built candidates on a file-options board for the user to pick from is encouraged. Treat the attachment as the confirmed starting point and product context — the "confirm the starting point" tip is already satisfied, so do not ask the user to confirm or re-pick it. Spend your questions on everything else you need: audience, purpose, content, structure, scope, interactions, tone of copy.
</attached aesthetic_system_instructions>

<pasted_text name="Pasted text (770 lines)">
1. What Qube Slate is

At the highest level, Qube Slate is Qube's cinema advertising and pre-show content scheduling platform.

Qube itself describes Slate as a content-scheduling platform and marketplace where advertisers, media agencies and exhibitors can plan campaigns, target specific theatres, and schedule content for playback.

The current Slate website positions it more specifically as a centralized cinema advertising management platform:

Manage inventory → schedule content → monitor playback.

It supports inventory management across screens, playlist creation, campaign scheduling and playback monitoring.

Qube has historically positioned Slate primarily around Qube Cinema Network (QCN) and cinema advertising. Public industry material also describes QCN's advertising network as being powered by Slate.

2. The mental model I have of Slate

From all our conversations, I would describe Slate as sitting between:

Commercial advertising → Campaign management → Content operations → Theatre playback

Conceptually:

Advertiser / Agency
        │
        ▼
 Campaign / Booking
        │
        ▼
     Qube Slate
        │
        ├── Theatre / Screen Inventory
        ├── Campaign Targeting
        ├── Content
        ├── Scheduling
        ├── Playlist / Pre-show
        ├── Distribution
        └── Playback / Proof-of-Play
                 │
                 ▼
             Theatre
                 │
                 ▼
          Cinema Server / TMS
                 │
                 ▼
              Screen

This is why Slate is interesting in the broader Magic Box / TMS strategy we've been discussing. It isn't merely an advertising booking system. It sits very close to the actual programming of what plays on the screen.

3. The primary users

I see at least three major user groups.

Advertisers / Agencies

They need to:

create campaigns
select theatres/screens
define targeting
select dates
specify frequency / number of plays
provide advertising content
monitor campaign execution
obtain proof of playback

The public Slate site explicitly describes the advertiser-side value proposition around listing/selling inventory, creating campaigns and scheduling content.

Exhibitors

This is arguably the more strategically interesting side.

Exhibitors need to:

expose available advertising inventory
understand capacity
allocate advertising time
create or approve playlists
control pre-show programming
accommodate last-minute changes
make sure the right content reaches the right screens
monitor what actually played

The current product site explicitly calls out real-time capacity management, inventory optimization, and last-minute bookings.

Qube / Advertising Operations

QCN needs the operational layer between advertisers and thousands of screens:

campaign management
content management
theatre targeting
scheduling
distribution
monitoring
reconciliation
reporting
4. Inventory is a fundamental concept

One of the most important concepts in Slate is advertising inventory.

A cinema screen doesn't simply have an unlimited number of ads it can play.

You have something like:

Theatre
  └── Screen
       └── Show
            └── Pre-show window
                 └── Available seconds

For example:

Show: 7:00 PM
Pre-show capacity: 12 minutes

Available:
720 seconds

Sold:
600 seconds

Remaining:
120 seconds

Slate therefore needs to understand time-based inventory.

The current public product site explicitly says exhibitors can track seconds sold and seconds available for every screen instantly.

This is a really important distinction:

Slate isn't just selling "ad slots". It is managing temporal inventory attached to cinema shows.

5. Campaign management

A campaign is essentially the commercial object that eventually becomes playback instructions.

A simplified model would be:

Campaign
│
├── Advertiser
├── Brand
├── Creative
├── Start Date
├── End Date
├── Theatre Selection
├── Screen Selection
├── Show Selection / Targeting
├── Frequency
├── Duration
├── Priority
└── Scheduling Rules

The campaign then gets translated into actual theatre-level schedules.

The public product description specifically talks about creating custom schedules for each brand and delivering content and playback schedules to screens.

6. Theatre and screen targeting

Slate's targeting model is another major component.

Advertisers can target:

circuits
theatres
locations
screens
potentially specific shows / programming contexts
campaign dates

The fundamental relationship is:

Campaign
    ↓
Targeting
    ↓
Theatres
    ↓
Screens
    ↓
Shows
    ↓
Playback

That makes Slate effectively a campaign-to-screen orchestration system.

7. Content management

Slate deals with the actual creative content that eventually plays.

Historically this has included cinema advertising content such as:

video advertisements
slides / static advertisements
other pre-show content

Third-party industry material describes Qube's cinema advertising workflow as involving content ingestion, distribution to theatre servers and centralized scheduling.

But in the product architecture we've discussed internally, I would broaden the concept beyond "ads".

Slate increasingly makes sense as a pre-show content management and scheduling platform.

That distinction matters.

Instead of:

Slate = advertising system

I would describe the strategic product as:

Slate = commercial pre-show programming platform, with advertising as its primary use case.

That aligns particularly well with the direction we've discussed for TMS and Magic Box.

8. Playlist management

This is one of the areas where our internal conversations add substantially more detail than the public documentation.

We've discussed Slate in the context of:

Ad scheduling → playlist creation → delivery → theatre execution.

The basic object becomes:

Show
│
└── Pre-show Playlist
      │
      ├── Ad 1
      ├── Ad 2
      ├── Ad 3
      ├── Trailer
      ├── Ad 4
      └── ...

And there is an important distinction between:

Campaign schedule

"What should play?"

and

Playlist

"In what exact sequence should it play?"

and

Theatre execution

"Did it actually play?"

That three-layer model is useful for understanding Slate.

9. Playlist boundaries are becoming important

There is a particularly relevant recent development.

At CinemaCon 2026, Qube highlighted enhancements to Slate around greater control over pre-show programming, including the ability to define playlist boundaries at the theatre level and maximum durations for pre-show and intermission segments.

That's strategically significant.

It means Slate is moving toward more sophisticated control of:

Show
│
├── Pre-show
│    ├── Ads
│    ├── Trailers
│    └── Other content
│
├── Feature
│
└── Intermission
     └── Ads / Content

with rules governing how much content can exist in each segment.

10. Scheduling

Scheduling is probably Slate's core functional engine.

The system needs to answer:

What content should play, where, and when?

Potential dimensions include:

theatre
screen
date
show
campaign
content
duration
priority
inventory
playlist position

The result is ultimately a schedule that can be consumed by theatre-side systems.

11. Distribution

Slate isn't useful if it merely creates a schedule in the cloud.

The actual content has to reach the theatre.

So the conceptual pipeline is:

Creative
   ↓
Slate
   ↓
Scheduling
   ↓
Distribution
   ↓
Theatre
   ↓
Cinema Server
   ↓
Playback

This is where Slate intersects with other Qube infrastructure, particularly Qube Wire / WireTAP / theatre-side agents.

We've discussed Qube Wire's theatre footprint and the WireTAP/Agent architecture extensively. The exact current implementation boundary between Slate and those systems is something I would not claim as fact without looking at the actual architecture/code, but conceptually Slate needs a reliable delivery mechanism underneath it.

12. Playback monitoring

This is the other half of the product.

A campaign isn't complete because the schedule says it should play.

You need to know:

Did it actually play?

The Slate website explicitly highlights monitoring playback and campaign performance across screens.

That gives Slate a closed loop:

Book
 ↓
Schedule
 ↓
Deliver
 ↓
Play
 ↓
Measure
 ↓
Report

That's considerably more valuable than a traditional media booking system.

13. Proof of Play

Proof-of-play is therefore a critical concept.

The system needs to establish:

Creative X
played
on Screen Y
during Show Z
at Time T

The resulting data can support:

advertiser reporting
campaign reconciliation
make-goods
billing
inventory validation
operational troubleshooting

Third-party descriptions of Qube's advertising infrastructure also identify playback logs as a key output of the Slate-based system.

14. iCount is an important adjacent product

Slate and iCount have a natural relationship.

iCount measures audience occupancy at the screen level. Qube describes it as software that detects occupied seats in a theatre/auditorium.

The combination becomes:

Slate
"What played?"

        +

iCount
"How many people were there?"

        ↓

Campaign measurement

That creates the possibility of moving from:

Proof of Play

to:

Proof of Audience

and eventually:

Proof of Campaign Delivery / Audience Exposure

This is one of the more strategically powerful aspects of the Qube ecosystem.

Recent Qube material specifically positions Slate and iCount together, highlighting centralized pre-show control alongside real-time attendance visibility.

15. Slate's commercial model

At a business level, Slate enables Qube to turn theatre screen time into managed, measurable inventory.

The commercial flywheel is roughly:

More theatres
      ↓
More screens
      ↓
More inventory
      ↓
More advertisers
      ↓
More campaigns
      ↓
More content
      ↓
More scheduling data
      ↓
Better inventory optimization
      ↓
Higher utilization / revenue
      ↓
More value to exhibitors
      ↓
More theatres

That makes Slate much more than an internal operations tool.

It is a marketplace infrastructure layer for Qube's cinema advertising business.

16. Where Slate sits in Qube's portfolio

Qube's own website categorizes Slate under Advertisers, alongside QCN and iCount.

The broader Qube ecosystem looks roughly like:

                 QUBE CINEMA
                      │
       ┌──────────────┼───────────────┐
       │              │               │
   Distribution   Exhibition      Advertising
       │              │               │
   Qube Wire       Qube XP          QCN
       │              │               │
   WireTAP          TMS           Slate
       │                              │
       │                            iCount
       │
       └──────────────┬───────────────┘
                      │
                Theatre Network

That's an oversimplification, but it captures the strategic position.

17. Where Slate fits into the Magic Box work we've been doing

This is where your previous architecture discussions become particularly relevant.

We've been defining Magic Box around four broad groups:

Platform
Setup Manager
Site Identity
User &amp; Role Management
Site Integration
TMS Gateway
POS Gateway
Device Gateway
Radar / screen integration
Content Operations
Manifest Agent
Download Agent
Content Library
Theatre Commerce
Box Office
Concessions / F&amp;B
Gift Cards
Ticketing APIs
F&amp;B APIs
Sales Channels
Payments
CRM
Digital Signage
Theatre Operations
Presentation Management
Show Execution
Automation &amp; Orchestration
Ad Management
Workforce Management

Slate maps most directly into:

Theatre Operations → Ad Management

But its scope overlaps with Presentation Management.

That's important.

18. Slate vs TMS

I think this is one of the most important architectural questions.

A traditional TMS answers:

What is the theatre's show presentation?

Slate answers:

What commercial/pre-show content should be presented around that show?

So:

TMS
│
├── Feature
├── Trailers
└── Show presentation

versus:

Slate
│
├── Advertising campaign
├── Ad inventory
├── Ad schedule
├── Pre-show playlist
└── Proof of play

But there is an overlap:

                 SHOW
                  │
        ┌─────────┴─────────┐
        │                   │
       TMS                SLATE
        │                   │
 Feature / trailers     Ads / pre-show
        │                   │
        └─────────┬─────────┘
                  │
             Final Playlist
                  │
                  ▼
              Theatre

This is exactly why we've been talking about Ad Management as a distinct Magic Box module, rather than simply making it part of TMS.

19. Slate and the newer TMS architecture

The acquisition of Arts Alliance Media is particularly relevant here.

Public reporting now describes Qube as having both Slate and AAM's Screenwriter/TMS capabilities, with Trailer Exchange providing more advanced pre-show scheduling.

That creates a potentially very interesting product architecture:

                 Qube Platform
                       │
          ┌────────────┴────────────┐
          │                         │
      Theatre Ops             Commercial Ops
          │                         │
    Screenwriter / TMS             Slate
          │                         │
          │                    Campaigns
          │                    Inventory
          │                    Ads
          │                    Measurement
          │                         │
          └────────────┬────────────┘
                       │
                 Final Show Plan
                       │
                       ▼
                    Theatre

The strategic question is therefore not simply "what features does Slate need?"

It's:

What should be the boundary between Slate, TMS, Trailer Exchange and the Magic Box?

That's a much more interesting product question.

20. Slate's relationship with Qube Wire

Another important boundary.

Qube Wire is fundamentally a global theatrical distribution platform. Qube describes it as a web-based service for global theatrical distribution.

Slate is primarily:

commercial scheduling / advertising / pre-show management.

So I'd think about them as:

Qube Wire
    │
    │ Content delivery
    ▼
Theatre

Slate
    │
    │ Content scheduling
    ▼
Theatre

With the possibility that they share:

content metadata
theatre metadata
screen metadata
delivery infrastructure
theatre agents
playback telemetry

This is where your broader Qube Wire + Slate + TMS platform strategy becomes compelling.

21. The data Slate potentially owns

I'd expect the logical data model to contain at least:

Commercial
Advertiser
Agency
Campaign
Brand
Booking
Contract
Rate
Billing status
Content
Creative
Content ID
Version
Duration
Format
Certification / approval status
Theatre
Circuit
Theatre
Auditorium
Screen
Location
Scheduling
Campaign dates
Shows
Slots
Playlist
Position
Priority
Capacity
Allocation
Execution
Scheduled playback
Actual playback
Timestamp
Screen
Show
Duration
Playback status
Failure reason
Measurement
Plays
Missed plays
Audience
Occupancy
Estimated impressions
Campaign performance
22. The really interesting architectural concept: time

This connects directly to the time-series theatre canvas we designed previously.

Slate naturally generates a timeline:

19:00 Show

19:00 ─ Ad 1
19:00 ─ Ad 2
19:01 ─ Ad 3
19:02 ─ Trailer 1
19:04 ─ Trailer 2
19:06 ─ Feature

And the theatre operations platform can then overlay actual execution:

                 SCHEDULED       ACTUAL

Ad 1              █████           █████
Ad 2                  ███          ███
Trailer                  ███       ███
Feature                       ███████████

That fits extremely well with the Gantt-style operational canvas we've discussed.

Slate provides the commercial intent.

TMS provides the presentation intent.

The theatre systems provide the actual execution telemetry.

23. Slate's current strategic direction

Based on the recent public product material, I'd characterize Slate's direction as moving from:

Advertising booking system

toward:

Centralized pre-show programming and commercial optimization platform.

The recent focus on:

playlist boundaries
maximum pre-show duration
intermission duration
inventory management
last-minute bookings
playback monitoring
campaign measurement

supports that interpretation.

24. What I know specifically from our internal discussions

Separately from public information, these are things you've told me in our previous product conversations:

Slate is deployed across roughly 3,700 screens.
Slate is part of Qube's broader theatre technology ecosystem.
Ad scheduling in Slate and the Agent queue is one of the roadmap/strategy topics you've been working on.
You've been considering Ad Management as a distinct module within Magic Box.
We've discussed the relationship between Slate, TMS and theatre-side agents.
You've discussed the need for better ad scheduling and orchestration.
You've been thinking about composite/pod CPL creation, particularly where multiple ads need to be packaged together so a projectionist doesn't have to load multiple CPLs.
You've recently been working with Screen Vision Symphony, where the Pod / Composite CPL creation tool is relevant to testing.
You indicated that you were manually running the composite CPL workflow during testing and that a tool would need to be built to support it.
We've discussed ad scheduling and Agent queues as an explicit product/engineering discussion.
You've been looking at Slate in the context of the larger TMS / Magic Box architecture, rather than as an isolated advertising product.

Those internal details aren't things I'd present as public facts without qualification.

25. My current product definition of Slate

If I had to write the one-line product definition today, I'd use:

Qube Slate is Qube's centralized platform for managing cinema advertising inventory, campaigns, pre-show programming, content scheduling, distribution and playback measurement across theatre screens.

And if we're thinking about the future-state Magic Box architecture, I'd make it slightly broader:

Slate is the commercial programming layer for the cinema, turning advertising demand into executable pre-show schedules and measurable screen inventory.

That second definition is, in my view, much more strategically useful.
</pasted_text>

<!-- The user explicitly selected the following skills for this project, as attachments to their message. These are not optional context — they define how you work. Use them. -->
<attached-skill name="Design Components">
This project uses Design Components: every design is a single streaming `Name.dc.html` file. The full authoring spec is in your system prompt under "Writing code — Design Components" — follow it. Author and edit `.dc.html` content with the `dc_write`, `dc_html_str_replace`, `dc_js_str_replace`, and `dc_set_props` tools (not `write_file`; `str_replace_edit` works but won't stream); template edits stream into the live preview as you type.
</attached-skill>

<attached-skill name="Qube Design System (design system)">
[Design System] This project uses the **Qube Design System** design system. This is a binding choice for visual style — every visual must follow it. Don't invent colors, type, spacing, or components not grounded here.

Scope: the design system is a visual style reference only. Its guide may describe example products, brands, or people that are unrelated to the user and unrelated to the subject of this conversation. Never treat anything in the design system as a fact about the user, their work, or the topic they asked about.

This project has the **QubeDesignSystem_169a27** design system bound at `_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/`. If anything under that path is missing or fails to load, the folder name may differ — `list_files` `_ds/` and use the folder whose name ends with 169a274d-37a3-4224-b419-bde3a6a40856 instead, including in the <link>/<script> paths below.

**Loading the bundle is how you use this design system.** Every Design Component you build must load `_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/_ds_bundle.js` in `<helmet>` (include it in child DCs too — de-duped by URL) and compose with its components — do not recreate those components from scratch or restyle raw HTML to look like them. At the top of the template:

```html
<helmet>
  <link rel="stylesheet" href="_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/tokens/fonts.css">
  <link rel="stylesheet" href="_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/tokens/prefab/fonts.css">
  <link rel="stylesheet" href="_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/tokens/prefab/colors.css">
  <link rel="stylesheet" href="_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/tokens/prefab/spacing.css">
  <link rel="stylesheet" href="_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/tokens/prefab/qube-wire.css">
  <link rel="stylesheet" href="_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/tokens/figma/fig-tokens.css">
  <link rel="stylesheet" href="_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/components/avatar/fig-assets.css">
  <link rel="stylesheet" href="_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/components/forms/fig-assets.css">
  <link rel="stylesheet" href="_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/components/prefab/prefab.css">
  <link rel="stylesheet" href="_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/styles.css">
  <script src="_ds/qube-design-system-169a274d-37a3-4224-b419-bde3a6a40856/_ds_bundle.js"></script>
</helmet>
```

Then mount any component directly in the template — no logic class needed:

```html
<x-import component-from-global-scope="QubeDesignSystem_169a27.Button" hint-size="auto,40px">Label</x-import>
```

Props are template attributes (kebab → camelCase); template children pass through as `props.children`. The linked stylesheet(s) carry the design tokens (colors, type, spacing) — style against those via `var(--*)` and the design system's classes rather than guessing values.

The full design-system source tree lives at `/projects/169a274d-37a3-4224-b419-bde3a6a40856/` — use `list_files` / `read_file` from there for anything not under `_ds/` (layout varies by brand; don't assume folder names). Its guide is reproduced below so you don't need to fetch it:

<design-system-guide>
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
- `components/data-display/` — Amount (currency/decimal formatting for bookings &amp; billing)
- `components/tags-badges/` — BadgeTagsBadges, Tag, CancelRounded, CircleTagsBadges

**Naming note:** Figma's own component tree reuses generic names ("Button", "Badge", "Add", "Divider" …) as *local* dependencies inside many different top-level families. Where the same name was needed in more than one directory, later copies were suffixed with their directory (e.g. `ButtonNav`, `BadgeTable`, `Add2Forms`) so every export is unique on `window.&lt;Namespace&gt;`. The `.d.ts` beside each still documents its real Figma node id.

### Intentional additions
- `assets/icons/Icon.jsx` — a thin wrapper around the materialized icon-data map. Not a Figma component; added so icons render as `&lt;Icon name="…" /&gt;` in prototypes.

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

## Caveats &amp; substitutions

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


</design-system-guide>
</attached-skill>

## Assistant



## Assistant

You've dropped a deep product briefing on Qube Slate but no direction on what to build from it — let me pin that down.

_[tool: ask_user]_

_[tool: ask_user]_

Waiting on your picks — deliverable, audience, and which sections matter most.

## User

Answered — Asked for follow-up questions; deliverable: Interactive prototype — a Slate UI (inventory / campaign / playlist screens); audience: Advertisers / agencies; emphasis: Time-based inventory, Campaign model, Playlists & boundaries, Distribution & proof-of-play; stance: Neutral explainer; internal_facts: Leave out; length: Comprehensive (20+)

## Assistant



## Assistant

_[tool: ask_user]_

Round two is up — flow spine, inventory visualization, and whether to wire real state.

## User

Answered — Asked for follow-up questions; code_source: RealImage/QubeSlate-ProductDemo; entry_flow: Both, as one app with a nav — booking flow plus live-campaign monitoring; inventory_ui: option_4; fidelity: Real state — selections, cart, totals recompute

## Assistant



## Assistant

_[tool: github_get_tree]_

The repo is an existing Slate demo (Dashboard, Create Campaign, Target Groups, Placements, Media). Round three, informed by it:

_[tool: ask_user]_

Waiting on those three — then I'll read the repo properly and build.

## User

Answered — Asked for follow-up questions; relation_to_repo: Extend it — keep its structure, add the missing advertiser screens (inventory availability, proof-of-play); vocabulary: Keep repo terms (Target Groups, Placements)

## Assistant



## Assistant

_[tool: github_read_files]_

The repo has 14 routes stubbed as "Coming Soon." That makes the real question concrete:

_[tool: ask_user]_

Round four is up — which stubs to fill, which new screens to add, nav scope, and the data world.

## User

Answered — nav_scope: Keep the full ops sidebar; data_world: Keep repo's demo data (AMC, Regal, $ budgets)

## Assistant

_[tool: github_read_files]_

_[tool: list_files]_

_[tool: github_read_files]_

_[tool: list_files]_

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

Repo read. Building — pass one: app shell, nav, Dashboard, Campaign Management, the 5-step Create Campaign wizard with live totals, and the new Inventory Availability screen.

_[tool: update_todos]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: copy_files]_

_[tool: dc_write]_

_[tool: show_html]_

_[tool: get_webview_logs]_

Pass one renders clean. Now the remaining screens.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the markup for those screens.

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: write_file]_

_[tool: update_todos]_

_[tool: ready_for_verification]_

Built the Slate advertiser app as one Design Component — repo structure and vocabulary kept, every "Coming Soon" route filled in, plus the four screens the repo lacks.

22 screens, real state throughout: campaign search/filter, the 5-step wizard with a booking summary that recomputes as you pick target groups, creatives and placements, screen selection on Inventory Availability, sortable Target Groups, editable playlist boundaries that flag overflow, approve/reject queues, retry-delivery on failed distribution, and rate-bias multipliers that repricing flows through.

Two things I decided for you since you left them blank: I built *all* the stubs rather than a subset, and added all six new screens. Tweaks panel exposes rate card, currency and capacity bars. Say the word if the ops screens (Users, Settings, Approvals) should be trimmed back out for an advertiser-only view.

## User

Found issues — fixing…

## User

Found issues — fixing…

## User

Address these comments from my teammates:

**Seth** (on `Qube Slate.dc.html` at `[data-dc-tpl="173"]`):
<commented-element>react:    Qube Slate
dom:      body › div#dc-root › div.sc-host › div › div › main › div › div › div › div[2/3]
text:     "Campaign Information Campaign Name * Campaign Type * Select…"
children: div, div
selector: [data-dc-tpl="173"]</commented-element>
<teammate-comment>Campaign Information should have the following fields: 
Campaign Name, 
Campaign Type, 
Client (this is the list of brand owners that this advertiser services, not names of theatre chains)
Brand (name of the brand / brands that this client is planning to advertise for through this campaign)
Validity Start Date, 
Validity End Date

Add a section called "Campaign Specifications". Campaign Specifications should have the following fields: 
(checkbox) On-Screen Advertising
(checkbox) Lobby Advertising
(checkbox) Digital Web Advertising
(checkbox) Digital Application Advertising

Campaign Mode (drop down with options for Fixed Commericial Terms, Dynamic - Views Reach)


Add a section called "Contacts". Contacts should have the following fields: 
Client Contact - Name, Email, Phone Number
Billing Contact - Name, Email, Phone Number
Sales Contact - Name, Email, Phone Number

Billing &amp; Media Agency should have the following fields: 
Billing Company Name (drop-down)
Billing Company Address (read-only drop down if multiple addresses)
Billing Cycle (drop down)
(check box) Advance Payment required before scheduling
Advance payment (text field)
Purchase Order ID / RO ID (text field)
Third-Party Order ID</teammate-comment>

**Seth**:
<teammate-comment>When the Navigation Bar is collapsed &amp; the user clicks on it, it should temporarily be opened to allow the users to view the sub-menus. </teammate-comment>

## Assistant

## User

Campaign Information should have the following fields: 
Campaign Name, 
Campaign Type, 
Client (this is the list of brand owners that this advertiser services, not names of theatre chains)
Brand (name of the brand / brands that this client is planning to advertise for through this campaign)
Validity Start Date, 
Validity End Date

Add a section called "Campaign Specifications". Campaign Specifications should have the following fields: 
(checkbox) On-Screen Advertising
(checkbox) Lobby Advertising
(checkbox) Digital Web Advertising
(checkbox) Digital Application Advertising

Campaign Mode (drop down with options for Fixed Commericial Terms, Dynamic - Views Reach)


Add a section called "Contacts". Contacts should have the following fields: 
Client Contact - Name, Email, Phone Number
Billing Contact - Name, Email, Phone Number
Sales Contact - Name, Email, Phone Number

Billing &amp; Media Agency should have the following fields: 
Billing Company Name (drop-down)
Billing Company Address (read-only drop down if multiple addresses)
Billing Cycle (drop down)
(check box) Advance Payment required before scheduling
Advance payment (text field)
Purchase Order ID / RO ID (text field)
Third-Party Order ID</teammate-comment>

## Assistant

_[tool: dc_html_str_replace]_

_[tool: grep]_

_[tool: read_file]_

Now I have the exact source.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

Now the logic: new fields, option lists, and the collapsed-sidebar behaviour.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the render values for the new fields.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Both addressed.

**Step 1 form** — Campaign Information is now Name, Type, Client, Brand, Validity Start/End (Country dropped). Client is a list of brand owners (Northwind Motors Group, Meridian Financial, Kestrel Media Holdings…), and picking one filters Brand to that client's brands and pre-fills its billing company and address. Added **Campaign Specifications** (four surface checkboxes + Campaign Mode) and **Contacts** (Client / Billing / Sales, each Name + Email + Phone). Billing & Media Agency now has Billing Company Name as a dropdown, Billing Company Address read-only unless the client has multiple registered addresses, Advance Payment amount revealed by the checkbox, PO / RO ID, and Third-Party Order ID. Review & Publish picks up brand, surfaces, mode, advance and both order IDs.

**Collapsed nav** — clicking a group on the rail expands the sidebar so sub-menus are reachable; it re-collapses when you pick an item or move into the page. The toggle button still pins it open permanently.

One knock-on: the Campaign Management table's "Client" column still shows theatre chains (AMC, Regal) from the repo's demo data, which is now inconsistent with Seth's definition. Say the word and I'll swap that data over to brand owners.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Fixed — `surfaceLabels` was declared after `reviewRows` read it; moved it above. Back out for review.

## User

Found issues — fixing…

## Assistant

_[tool: list_files]_

_[tool: list_files]_

Every nav concept has a real glyph. Copying them in and replacing the hand-drawn paths.

_[tool: run_script]_

_[tool: copy_files]_

_[tool: run_script]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: show_html]_

_[tool: show_html]_

_[tool: eval_js]_

Masks resolve correctly in the browser (the solid squares are a screenshot-renderer artifact, not the page).

_[tool: ready_for_verification]_

Swapped the hand-drawn nav icons for the real Qube glyphs — copied `Dashboard`, `Campaign`, `CampaignApproval`, `Content`, `Movies`, `List`, `Reports`, `MultipleUsers`, `Settings`, `Hamburger` and the chevrons out of the design system's `icons-prefab` set into `assets/icons/`, mounted as masked spans so they still take the active/inactive colour.

Note for the verifier's screenshot: masked icons render as solid squares in html-to-image but are correct in the browser — I confirmed the mask resolves on the live page.

