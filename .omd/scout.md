# Scout — fragment inventory, brick analysis, candidate assemblies

Surface `mixed`. Register `confident`. Capture route: headless reduced-motion Playwright
(`omd render` path behind `omd ref add-batch`). Reason: this installed CLI has no `browser-rs`
and no `browser doctor` subcommand, so the interactive provider is unavailable on this host.
Recorded per the reference-assembly browser boundary as a platform-unavailability fallback,
not a transient-failure swap.

Source identity, URLs, hostnames, capture paths, and pixels stay in the fragment inventory.
Everything below is sanitized: stable keys, measured rules, trust, uncertainty.

## Evidence gate applied

Every brick below is a component-scope capture with a measured blueprint and a saved part image.
No capture is scoped to a whole document. The two named anti-references are carried deliberately,
not discarded, because each one names a pattern this product's constraints forbid.

## Reference synthesis

### Feature: Weekday day-state control
- Origin: inferred
- Assumption: The demo day control is the recovery path for the costliest error and must therefore be a first-class screen object, not chrome.
- Primitive: Switch the screen between weekday and weekend meaning
- Source ref: SEGMENTED-PARTIAL-LOCK
- Trust: Directly observed stable reference
- Uncertainty: Observed on a light surface; contrast steps must be re-derived for the dark palette.
- Structural rule: A partly closed option group keeps the whole track live and drops contrast only on the closed labels, so what is open now and what exists but is closed are visible in one control.
- Adaptation: Carry both states in one banner-scale control at the top of every product screen, sized as the largest object on a weekday first paint.
- Token variation: Selection is expressed with a surface step, never with the reserved signal colour.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /portfolio
- Destination selector: [data-region="day-state"]
- Mobile behavior: Full-bleed within the capped column, options stay side by side, each option keeps a 44px minimum height.
#### Axes
- Information architecture/navigation | adapt | The control states which mode the whole screen is in before any content is read. | Promote it above the page header so it is the first fact on a weekday arrival.
- Macro layout and panel/region geometry | adapt | One horizontal track spans the content width. | Span the capped column and pin it so it survives scroll.
- Content density | accept | Options carry a single short label each with no secondary text. | Keep one word per option.
- Typography/hierarchy | adapt | Available and closed labels differ by weight and contrast at one size. | Hold one size and vary weight and contrast only.
- Spacing/rhythm | accept | Equal padding on every option so selection does not reflow the track. | Keep padding identical across states.
- Component anatomy | accept | Recessed track, one raised selected face, per-option disabled treatment. | Reuse this three-part anatomy exactly.
- Interaction/state/feedback | adapt | Closed options are non-interactive but remain legible. | Add a plain-language line naming what the closed mode opens.
- Responsive/mobile recomposition | adapt | The track keeps its option count and shrinks padding. | Preserve option count; never collapse to a dropdown.
- Motion/transition | decline | A short fade moves the selected face. | Decline; the destination has no motion budget for chrome and reduced motion must be honoured.

### Feature: Locked allocation editor
- Origin: explicit
- Assumption: N/A
- Primitive: Read and, on the weekend, edit the six-front point allocation
- Source ref: STEPPER-LOCKED-STATE
- Trust: Directly observed stable reference
- Uncertainty: The reference locks a single field; a six-row group locked as a unit is inferred from it.
- Structural rule: The locked state keeps identical geometry and full size and lowers only foreground and border contrast, so a closed control still reads as a real control.
- Adaptation: Lock the six rows as one group while every row keeps its real current value visible.
- Token variation: Use the muted foreground and border tokens for the closed state; no grey overlay.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /portfolio
- Destination selector: [data-region="allocation-editor"]
- Mobile behavior: Rows stack full width; the reason line stays inside the same card as the rows.
#### Axes
- Information architecture/navigation | adapt | The control that reopens the locked field sits directly above it. | Place the day control immediately above the editor at the same width.
- Macro layout and panel/region geometry | accept | Locked and open states occupy identical space. | Reserve the same height in both states so the page does not jump.
- Content density | adapt | One value per row with a label. | Six front rows plus a reserve row in one card.
- Typography/hierarchy | accept | The numeral holds full contrast; the label stays muted. | Keep the figure dominant in both states.
- Spacing/rhythm | accept | Row padding is constant regardless of state. | Keep the row rhythm identical when locked.
- Component anatomy | accept | Field, affordances, and helper text remain present when closed. | Never remove or shrink controls to express closure.
- Interaction/state/feedback | adapt | Closure is announced by contrast alone. | Add the reason and the reopen time in the same card at the same type size.
- Responsive/mobile recomposition | adapt | The field is full width at narrow sizes. | Stack rows; keep controls at 44px minimum.
- Motion/transition | N/A | N/A | The source shows no transferable motion for a state that must be legible on first paint.

### Feature: Point pool with visible remainder
- Origin: explicit
- Assumption: N/A
- Primitive: See how many of the twenty points are placed and how many remain
- Source ref: WEIGHTED-SEGMENT-METER
- Trust: Directly observed stable reference
- Uncertainty: The reference shows two filled segments; six segments plus a remainder will compress each segment.
- Structural rule: One track carries adjacent filled segments plus an unfilled tail, so segment width is itself the quantity and the unassigned remainder is part of the same reading.
- Adaptation: Make the unfilled tail the reserve, named and counted, so a finite pool is felt rather than stated.
- Token variation: Segments draw from the chart ladder; the reserved signal colour never appears in the track.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /portfolio
- Destination selector: [data-region="reserve"]
- Mobile behavior: Full-width track above the rows; segment labels move to the row list rather than onto the track.
#### Axes
- Information architecture/navigation | N/A | N/A | The meter is a readout, not a navigation surface.
- Macro layout and panel/region geometry | accept | A single full-width track summarises the group beneath it. | Place it directly above the six rows it summarises.
- Content density | adapt | Two segments plus remainder. | Six segments plus remainder; drop per-segment labels from the track itself.
- Typography/hierarchy | adapt | A single trailing figure states the total. | State placed and remaining as two figures with the unit.
- Spacing/rhythm | accept | Segments abut with a hairline separation, no gaps. | Keep segments contiguous so total width stays readable.
- Component anatomy | accept | Track, filled segments, unfilled tail, trailing figure. | Reuse this anatomy; the tail is required, not optional.
- Interaction/state/feedback | adapt | The meter is static. | Update it live as steppers change, and hold it at the cap when the pool is exhausted.
- Responsive/mobile recomposition | accept | The track is width-fluid. | Let it span the capped column at both widths.
- Motion/transition | decline | Segment width animates on change. | Decline animated width; an instant update avoids implying a transaction.

### Feature: Primary numeric figure with signed change
- Origin: explicit
- Assumption: N/A
- Primitive: Read the current training figure and how it moved
- Source ref: SIGNED-DELTA-ROW
- Trust: Directly observed stable reference
- Uncertainty: Observed on a light surface; directional hues need re-derivation against the dark ground.
- Structural rule: A small muted label sits above a large tabular numeral, and the change indicator is a separate small token beside the numeral, so directional colour never touches the headline figure.
- Adaptation: Apply to the single figure each screen is allowed, keeping the sign always present.
- Token variation: The numeral uses the plain foreground token; only the change token uses the up and down tokens.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /home
- Destination selector: [data-region="home-figure"]
- Mobile behavior: One figure per screen rather than a row; the label stays above the numeral.
#### Axes
- Information architecture/navigation | N/A | N/A | The figure row is a readout, not navigation.
- Macro layout and panel/region geometry | adapt | Several figures share one baseline across a row. | Reduce to one figure; the destination forbids a combined total tile.
- Content density | adapt | Six figures across one row. | One figure, because two curves must never be summed.
- Typography/hierarchy | accept | Small uppercase label, large tabular numeral, small change token. | Reuse this three-tier ladder with tabular figures.
- Spacing/rhythm | accept | Label and numeral sit tight; the change token is spaced away from the numeral. | Keep the change token visually detached.
- Component anatomy | accept | Label, numeral, arrow glyph, percentage. | Reuse, and keep the sign on the percentage always.
- Interaction/state/feedback | adapt | The selected metric takes a filled surface panel. | Use a surface step, never the signal colour, to mark the active figure.
- Responsive/mobile recomposition | adapt | The row scrolls or wraps at narrow widths. | Do not wrap a row; show one figure and move the rest into the front list.
- Motion/transition | N/A | N/A | No transferable motion was measured on this readout.

### Feature: Front terrain table
- Origin: explicit
- Assumption: N/A
- Primitive: Scan how the six fronts moved
- Source ref: DENSE-STATUS-TABLE
- Trust: Directly observed stable reference
- Uncertainty: The reference carries more columns than six fronts need; density will loosen.
- Structural rule: Only the status column carries chips while every other column stays neutral text, and headers are smaller and more muted than the cells, so data outweighs scaffolding.
- Adaptation: Let the movement column be the only tinted column; keep names and figures neutral.
- Token variation: Movement uses the up and down tokens with a sign; the reserved signal colour never appears in the table.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /portfolio
- Destination selector: [data-region="front-terrain"]
- Mobile behavior: Becomes a divider-separated row list; the movement figure stays right-aligned.
#### Axes
- Information architecture/navigation | N/A | N/A | The table is a readout and issues no navigation.
- Macro layout and panel/region geometry | accept | A full-width table inside the content column. | Reuse at the capped column width.
- Content density | accept | Tight row rhythm with no card border per row. | Reuse the tight rhythm; six rows only.
- Typography/hierarchy | accept | Headers are smaller and muted relative to cells. | Reuse this inversion so figures lead.
- Spacing/rhythm | accept | One constant row height. | Keep one row height for all six fronts.
- Component anatomy | adapt | Row, neutral cells, one chip column. | Replace the chip with a signed figure using tabular numerals.
- Interaction/state/feedback | adapt | Rows respond on hover. | Provide a pressed state instead; hover does not exist on the primary device.
- Responsive/mobile recomposition | adapt | Columns scroll horizontally at narrow widths. | Decline horizontal scroll; recompose to a two-value row list.
- Motion/transition | N/A | N/A | No transferable motion was measured.

### Feature: Weekday schedule and job links
- Origin: explicit
- Assumption: N/A
- Primitive: See what is open today and move to it
- Source ref: TASK-LIST-STATUS
- Trust: Directly observed stable reference
- Uncertainty: The reference is a one-off form journey; a weekly recurring rhythm is inferred.
- Structural rule: Each row pairs a name with a right-aligned status word, the finished state is plain text while the unfinished state takes a tinted chip, and optional hint text sits under the name at body size.
- Adaptation: Weight what is open now, leave what is done unstyled, and let each row explain itself in one line.
- Token variation: The chip uses a muted surface tint, not the reserved signal colour.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /home
- Destination selector: [data-region="job-links"]
- Mobile behavior: Rows stay full width with the status word right-aligned on the same line as the name.
#### Axes
- Information architecture/navigation | accept | The list is the primary way into each area of work. | Reuse as the most frequently used control on the home screen.
- Macro layout and panel/region geometry | accept | A single full-width list with hairline row separation. | Reuse; no card per row.
- Content density | accept | Name, optional one-line hint, status word. | Reuse all three slots.
- Typography/hierarchy | accept | The name is a link at body size; the hint is muted body. | Reuse; do not shrink the hint below body size.
- Spacing/rhythm | accept | Rows share one separator rhythm regardless of hint presence. | Reuse the constant rhythm.
- Component anatomy | accept | Name, hint, right-aligned status chip. | Reuse exactly.
- Interaction/state/feedback | adapt | The whole row is a link when actionable. | Keep the full row tappable at 44px minimum; closed rows are not links.
- Responsive/mobile recomposition | accept | The row layout already works at narrow widths. | Reuse unchanged.
- Motion/transition | N/A | N/A | No transferable motion was measured.

### Feature: Closed state expressed without lock iconography
- Origin: inferred
- Assumption: A screen showing several closed areas needs one quiet language for closure, or the judge reads the build as unfinished.
- Primitive: Distinguish what is open from what opens later
- Source ref: LOCKED-CALENDAR-DARK
- Trust: Directly observed stable reference
- Uncertainty: The reference is monospaced editorial rather than a product surface; type treatment does not transfer.
- Structural rule: Closed and open entries share one grid at one size and differ only by text brightness, with no badge, lock glyph, or hue carrying the state, and the current entry is marked by a slightly lifted surface band.
- Adaptation: Use brightness steps and one surface band for closure across every product screen, so closure reads as scheduled rather than broken.
- Token variation: Closure uses muted foreground steps; the lifted band is a surface token, not the signal colour.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /portfolio
- Destination selector: [data-region="calm-field"]
- Mobile behavior: The band spans the capped column; brightness steps are unchanged.
#### Axes
- Information architecture/navigation | adapt | Every entry stays in place whether open or closed. | Never hide or reorder a closed area; position carries the weekly rhythm.
- Macro layout and panel/region geometry | accept | One uniform grid holds both states. | Reuse one grid for open and closed alike.
- Content density | accept | Entries are uniform and tightly packed. | Reuse the uniform treatment.
- Typography/hierarchy | decline | A single monospace size carries the whole field. | Decline; the destination needs a real type hierarchy in Korean.
- Spacing/rhythm | accept | One constant row rhythm. | Reuse.
- Component anatomy | accept | Entry, brightness step, one lifted band for the current position. | Reuse this three-part anatomy.
- Interaction/state/feedback | accept | Closed entries are inert but fully legible. | Reuse; add a plain reason line, still without an icon.
- Responsive/mobile recomposition | adapt | The field is a wide grid. | Recompose to a single column; keep the brightness language.
- Motion/transition | N/A | N/A | No transferable motion was measured on a static field.

### Feature: Desktop recomposition at the wide viewport
- Origin: inferred
- Assumption: The observed defect is a phone column centred in black at 1280 wide; the container, not the component, must change.
- Primitive: Read the same work surface on a laptop
- Source ref: PAIRED-CARDS-WIDE
- Trust: Directly observed stable reference
- Uncertainty: The capture is partly occluded by a consent layer; the lower image region is not evidence.
- Structural rule: Two cards sit side by side separated by a hairline rule rather than a gap, and each card owns its own reading width so the viewport never stretches text lines.
- Adaptation: Pair the front list with the allocation detail at the wide viewport, divided by a rule, each pane keeping the capped reading width.
- Token variation: The divider uses the border token; panes use the surface token, not new colours.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /portfolio
- Destination selector: [data-region="workspace-split"]
- Mobile behavior: Handled by the paired narrow-viewport record below.
#### Axes
- Information architecture/navigation | adapt | Two peer regions are visible at once. | Pair list and detail so selecting a front updates the detail without a route change.
- Macro layout and panel/region geometry | accept | A hairline divides two equal panes edge to edge. | Reuse the divider rather than a gutter.
- Content density | accept | Each pane keeps generous internal padding. | Reuse; do not increase density just because width exists.
- Typography/hierarchy | accept | Headings stay at one line because the pane caps the measure. | Reuse the capped measure per pane.
- Spacing/rhythm | accept | Internal padding is identical in both panes. | Reuse.
- Component anatomy | accept | Heading, one supporting line, one action, then a content area. | Reuse this pane anatomy.
- Interaction/state/feedback | adapt | Each pane carries its own action. | Keep exactly one signal-coloured action across both panes, not one per pane.
- Responsive/mobile recomposition | adapt | The pair is a wide-viewport arrangement only. | Recompose per the narrow-viewport record; do not scale the pair down.
- Motion/transition | N/A | N/A | No transferable motion was measured.

### Feature: Narrow viewport keeps the component and changes the container
- Origin: inferred
- Assumption: The same measured component at two viewports is the only direct evidence of recomposition available.
- Primitive: Read the same work surface on a phone
- Source ref: PAIRED-CARDS-NARROW
- Trust: Directly observed stable reference
- Uncertainty: The capture is partly occluded by a consent layer; only the upper card anatomy is evidence.
- Structural rule: At the narrow viewport the card keeps its internal proportions unchanged and the container becomes a stack or track instead, so the heading rewraps but nothing is redesigned.
- Adaptation: Stack the two panes vertically at narrow widths with card padding and type sizes unchanged from the wide viewport.
- Token variation: No token changes between viewports; only the container changes.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /portfolio
- Destination selector: [data-region="workspace-stack"]
- Mobile behavior: This record is the mobile behaviour; panes stack in list-then-detail order.
#### Axes
- Information architecture/navigation | adapt | Peer regions become sequential. | Stack list above detail; keep both reachable without a route change.
- Macro layout and panel/region geometry | accept | The container changes; the card does not. | Reuse this rule exactly; it is the fix for the observed defect.
- Content density | accept | Density is identical to the wide viewport. | Reuse; do not compress on mobile.
- Typography/hierarchy | accept | Headings rewrap to more lines at the same size. | Allow rewrap; never step the size down.
- Spacing/rhythm | accept | Card padding is unchanged across viewports. | Reuse.
- Component anatomy | accept | The card is byte-identical in structure at both widths. | Reuse.
- Interaction/state/feedback | adapt | A horizontal track implies swipe. | Decline the swipe track; use a vertical stack so nothing is hidden offscreen.
- Responsive/mobile recomposition | accept | Only the container recomposes. | Reuse as the governing responsive rule for the whole product surface.
- Motion/transition | N/A | N/A | No transferable motion was measured.

### Feature: Korean tile grid across viewports
- Origin: inferred
- Assumption: Korean label behaviour in a grid is needed because the destination is Korean-first and the type stack is fixed.
- Primitive: Move to a named area of the product
- Source ref: KO-TILE-GRID-WIDE
- Trust: Directly observed stable reference
- Uncertainty: The paired narrow capture measured the same spacing ladder, so this pair evidences column count only, not spacing change.
- Structural rule: At the wide viewport tiles run as a four-column grid inside a capped content column, so the page gains columns rather than line length, and Korean labels stay short noun phrases at one size without truncation.
- Adaptation: Gain columns on the laptop instead of stretching the phone column, holding tile and label size constant.
- Token variation: Tiles use the surface token; no tile takes the signal colour.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /home
- Destination selector: [data-region="home-tiles-wide"]
- Mobile behavior: The same tiles fall to two columns at the identical gap with unchanged tile and label size.
#### Axes
- Information architecture/navigation | accept | The grid is a flat set of peer destinations. | Reuse as a flat set; no nesting.
- Macro layout and panel/region geometry | accept | Column count changes; the content cap does not. | Reuse; this is the direct answer to the empty-margin defect.
- Content density | accept | Tiles keep one icon and one short label. | Reuse; Korean labels stay short noun phrases.
- Typography/hierarchy | accept | One label size across the whole grid. | Reuse a single size so the grid stays even.
- Spacing/rhythm | accept | The gap is identical at both viewports. | Reuse the constant gap.
- Component anatomy | accept | Tile, mark, single-line label. | Reuse.
- Interaction/state/feedback | adapt | Tiles respond on hover. | Use a pressed state; keep each tile at 44px minimum.
- Responsive/mobile recomposition | accept | Only the column count changes. | Reuse.
- Motion/transition | N/A | N/A | No transferable motion was measured.

### Feature: Generative-AI disclosure notice
- Origin: explicit
- Assumption: N/A
- Primitive: Read an AI-produced statement and know what produced it
- Source ref: NOTICE-VARIANT-SET
- Trust: Directly observed stable reference
- Uncertainty: The reference set has no AI-provenance variant; the provenance meaning is destination-specific.
- Structural rule: One notice anatomy is reused across every severity — a left keyline, a bold single-clause heading, one body sentence — and severity changes only the keyline hue and background tint, never the geometry.
- Adaptation: Make the AI disclosure and the rule-based fallback two variants of one notice, so the fallback is a token change rather than a different component.
- Token variation: Informational tint only; the disclosure never uses the reserved signal colour or a warning hue.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /home
- Destination selector: [data-region="ai-notice"]
- Mobile behavior: Full width above the response block; the heading never truncates.
#### Axes
- Information architecture/navigation | adapt | Notices sit inline with the content they qualify. | Place the disclosure above the response it qualifies, never in a footer.
- Macro layout and panel/region geometry | accept | Left keyline, full-width tinted block. | Reuse.
- Content density | accept | One heading clause plus one sentence. | Reuse; the disclosure is one clause.
- Typography/hierarchy | accept | Bold heading at body size, regular body beneath. | Reuse; never set the disclosure below body size.
- Spacing/rhythm | accept | Constant internal padding across variants. | Reuse so variants do not shift the page.
- Component anatomy | accept | Keyline, heading, body. | Reuse for both the AI and rule-based variants.
- Interaction/state/feedback | adapt | Notices are static. | Swap the variant when the source changes from model to rule, keeping position and size.
- Responsive/mobile recomposition | accept | Full width at all sizes. | Reuse.
- Motion/transition | decline | Notices may fade in. | Decline; a required disclosure must be present on first paint.

### Feature: Mode control that does not claim the page accent
- Origin: inferred
- Assumption: Six simultaneous accent sites were measured on one screen; a second mode control must not add a seventh.
- Primitive: Switch a view between modes
- Source ref: SEGMENTED-RAISED-INSET
- Trust: Directly observed stable reference
- Uncertainty: Observed on a light surface; the raised-face contrast step must be re-derived for the dark ground.
- Structural rule: The selected segment is a raised inset face with a border inside a recessed track, not a filled accent block, and every segment keeps identical padding and text weight so the control does not reflow as selection moves.
- Adaptation: Express every secondary mode switch this way so the reserved signal colour stays on the single action.
- Token variation: Selection uses a surface step plus border token; no accent fill.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /portfolio
- Destination selector: [data-region="day-mode"]
- Mobile behavior: Segments stay side by side at 44px minimum height; the control never becomes a dropdown.
#### Axes
- Information architecture/navigation | accept | The control scopes the view without changing route. | Reuse as in-page scoping only.
- Macro layout and panel/region geometry | accept | A compact inline track, not a full-width bar. | Reuse at intrinsic width.
- Content density | accept | Short single-word labels. | Reuse.
- Typography/hierarchy | accept | Identical weight across segments including the selected one. | Reuse; do not bolden the selection.
- Spacing/rhythm | accept | Identical padding per segment. | Reuse so the track width is stable.
- Component anatomy | accept | Recessed track, raised selected face with border. | Reuse exactly; this is the accent-free selection pattern.
- Interaction/state/feedback | accept | Selection is conveyed by elevation and border. | Reuse; add a visible focus ring.
- Responsive/mobile recomposition | adapt | The track keeps intrinsic width. | Allow it to span the column when labels would otherwise truncate.
- Motion/transition | decline | The raised face slides between segments. | Decline the slide; honour reduced motion and keep the change instant.

### Feature: Week position indicator
- Origin: inferred
- Assumption: The weekly cycle is the product's core rhythm and must be legible without relying on the day control alone.
- Primitive: Know where in the week the current day sits
- Source ref: STEP-INDICATOR-SEQ
- Trust: Directly observed stable reference
- Uncertainty: The reference models a linear form journey, not a repeating cycle.
- Structural rule: Done, current, and upcoming segments share one bar and differ by fill density alone, with a text counter stating position in words as the accessible fallback.
- Adaptation: Show the weekday run and the weekend decision window, with the position also written in words.
- Token variation: Fill density uses surface and muted tokens; no hue encodes position.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /home
- Destination selector: [data-region="week-progress"]
- Mobile behavior: Segments compress but the word counter stays at body size.
#### Axes
- Information architecture/navigation | adapt | The bar states progress through a sequence. | Restate as a repeating week; never imply an unrepeatable journey.
- Macro layout and panel/region geometry | accept | A single full-width bar above content. | Reuse.
- Content density | adapt | One segment per form step. | One segment per day, grouped into weekdays and the weekend window.
- Typography/hierarchy | accept | The word counter is body size beside the bar. | Reuse; the words are the fallback, not decoration.
- Spacing/rhythm | accept | Equal segment widths. | Reuse equal widths.
- Component anatomy | accept | Bar, segments, word counter. | Reuse.
- Interaction/state/feedback | decline | Segments are sometimes navigable. | Decline navigation; days are not selectable and the day control owns mode changes.
- Responsive/mobile recomposition | accept | Segments compress without wrapping. | Reuse.
- Motion/transition | N/A | N/A | No transferable motion was measured.

### Feature: Money figure with its unit
- Origin: explicit
- Assumption: N/A
- Primitive: Read a won amount unambiguously
- Source ref: MONEY-FIELD-AFFIX
- Trust: Directly observed stable reference
- Uncertainty: The reference is an editable field; most destination figures are read-only.
- Structural rule: The unit sits inside the field as a fixed affix rather than in the label, so figure and unit read as one token while the numeral stays right-aligned for column comparison, with the affix muted and the numeral at full contrast.
- Adaptation: Attach the won unit to every figure as a muted affix and right-align numerals wherever they form a column.
- Token variation: Affix uses the muted token; the numeral uses the plain foreground token.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /portfolio
- Destination selector: [data-region="front-stepper"]
- Mobile behavior: The affix never wraps away from its numeral.
#### Axes
- Information architecture/navigation | N/A | N/A | A field affix issues no navigation.
- Macro layout and panel/region geometry | N/A | N/A | The affix has no panel-level geometry.
- Content density | accept | Unit and value occupy one line. | Reuse one line per figure.
- Typography/hierarchy | accept | Muted affix against a full-contrast numeral. | Reuse; the unit must never outweigh the value.
- Spacing/rhythm | accept | The affix sits tight to the numeral inside one boundary. | Reuse.
- Component anatomy | accept | Bounded field, inline affix, right-aligned numeral. | Reuse; use tabular numerals so columns align.
- Interaction/state/feedback | adapt | The field is editable. | Most destination figures are read-only; keep the same anatomy without an input boundary.
- Responsive/mobile recomposition | accept | The pairing is width-independent. | Reuse.
- Motion/transition | N/A | N/A | No transferable motion was measured.

### Feature: Chart that never borrows the action colour
- Origin: inferred
- Assumption: The equity chart's accent-coloured gradient was one of six measured accent sites on a single screen.
- Primitive: Read the shape of a series over time
- Source ref: COMPACT-CHART-CARD
- Trust: Directly observed stable reference
- Uncertainty: Observed at small size; behaviour with six series is not evidenced.
- Structural rule: The plot occupies nearly the whole card with axis furniture reduced to a few muted ticks, and the series colour is distinct from any action colour on the surface, so a chart never competes with a button.
- Adaptation: Draw every series from the chart ladder and let the plot fill the card, so the chart stops being an accent site.
- Token variation: Series use the chart ladder only; the reserved signal colour is forbidden in any plot.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /portfolio
- Destination selector: [data-region="equity-chart"]
- Mobile behavior: The plot keeps its aspect and the tick count drops rather than the plot shrinking.
#### Axes
- Information architecture/navigation | N/A | N/A | The chart is a readout and issues no navigation.
- Macro layout and panel/region geometry | accept | The plot fills the card with minimal frame. | Reuse; remove chart chrome.
- Content density | accept | Few muted ticks rather than a full grid. | Reuse the reduced furniture.
- Typography/hierarchy | accept | Tick labels are the smallest muted text on the card. | Reuse.
- Spacing/rhythm | accept | The plot is inset by one consistent padding step. | Reuse.
- Component anatomy | accept | Card, plot area, sparse ticks, no legend when one series. | Reuse.
- Interaction/state/feedback | adapt | Hover reveals a value tooltip. | Provide a touch-driven readout instead of hover.
- Responsive/mobile recomposition | accept | Tick count reduces with width. | Reuse.
- Motion/transition | decline | Series draw in on mount. | Decline the draw-in; a figure that animates on every paint reads as unstable.

### Feature: Landing claim block
- Origin: inferred
- Assumption: The landing is marketing and needs one committed claim, which the product screens do not supply.
- Primitive: Understand in one line what the product asks of you
- Source ref: FINANCE-HERO-CLAIM
- Trust: Directly observed stable reference
- Uncertainty: The reference is an English consumer brand; sentence length does not transfer to Korean directly.
- Structural rule: The hero commits to one long plain-language sentence at display size, one short supporting line, and a single action, with type doing the work and colour staying out of the way.
- Adaptation: Lead with one Korean sentence about the reader's situation, one supporting line, and exactly one action.
- Token variation: The single action carries the reserved signal colour; nothing else in the block does.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /
- Destination selector: [data-region="landing-claim"]
- Mobile behavior: The sentence rewraps at the same size; the action goes full width.
#### Axes
- Information architecture/navigation | accept | One action leaves the block. | Reuse a single entry action.
- Macro layout and panel/region geometry | accept | A centred column over a full-bleed ground. | Reuse.
- Content density | accept | Three elements only. | Reuse; add nothing else to the block.
- Typography/hierarchy | accept | Display sentence, small supporting line, action label. | Reuse this three-tier ladder.
- Spacing/rhythm | accept | Generous constant spacing between the three elements. | Reuse.
- Component anatomy | accept | Sentence, supporting line, one pill action. | Reuse.
- Interaction/state/feedback | accept | One unmistakable primary action. | Reuse; the demo entry is that action.
- Responsive/mobile recomposition | accept | The sentence rewraps without a size step. | Reuse.
- Motion/transition | decline | A background video sits behind the block. | Decline; the deployment must be dependable and cheap to paint during judging.

### Feature: Curated work card
- Origin: inferred
- Assumption: The learn deck and drill cards are the product's only gallery-shaped surfaces and currently read as uniform slabs.
- Primitive: Choose one card from a set of peers
- Source ref: AWARD-ENTRY-CARD
- Trust: Directly observed stable reference
- Uncertainty: The reference card is image-led; the destination cards are text-led, so proportion transfers but content does not.
- Structural rule: The card gives almost its whole height to one dominant region and compresses all metadata into one short bottom strip of small muted labels, keeping the outline rectangular and repeatable.
- Adaptation: Give each learn and drill card one dominant region and one muted metadata strip instead of stacking equal-weight rows.
- Token variation: Metadata uses muted tokens; the card takes the surface token and no accent.
- Conflict resolution: Task, accessibility, mobile, then one destination system win.
- Destination route: /learn
- Destination selector: [data-region="learn-card"]
- Mobile behavior: One card per row full width; proportions and the metadata strip are unchanged.
#### Axes
- Information architecture/navigation | accept | Each card is one destination in a flat set. | Reuse; cards address by identifier, not position.
- Macro layout and panel/region geometry | accept | One dominant region plus a thin metadata strip. | Reuse this proportion so cards stop reading as uniform slabs.
- Content density | accept | Three short metadata fields in one line. | Reuse; keep the Korean metadata line to three fields.
- Typography/hierarchy | accept | Dominant region carries weight, metadata stays muted and small. | Reuse.
- Spacing/rhythm | accept | Identical outline and padding across every card. | Reuse so a grid of them is repeatable.
- Component anatomy | accept | Dominant region, corner badge, bottom metadata strip. | Reuse; the badge marks the anchored card.
- Interaction/state/feedback | adapt | The image reveals detail on hover. | Use a pressed state; the anchored card opens expanded on arrival.
- Responsive/mobile recomposition | adapt | Cards run as a multi-column grid. | One column on mobile with unchanged internal proportion.
- Motion/transition | decline | A hover-driven media rollover. | Decline; hover does not exist on the primary device.

### Decline: Continuous slider for allocation
- Origin: inferred
- Source ref: CONTINUOUS-SLIDER-ANTI
- Trust: Directly observed stable reference
- Uncertainty: None material; the mismatch is structural rather than stylistic.
- Reason: A continuous track invites a value anywhere along it, gives no landing point for whole units, and hides how much of a fixed pool remains. The destination allocates twenty discrete points across six fronts with no automatic rebalancing, so a slider would misrepresent the rule the product exists to teach. Carried as a named anti-reference so the pattern is not reintroduced.

### Decline: Hover-revealed increment affordances
- Origin: inferred
- Source ref: STEPPER-HOVER-ANTI
- Trust: Directly observed stable reference
- Uncertainty: None material; the measured resting capture shows the field without visible controls.
- Reason: The increment and decrement affordances exist only on pointer hover, so on the destination's primary touch device they do not exist at all. The most-pressed control in the product cannot depend on hover, and both buttons must be rendered at full touch size in the resting state. Carried as a named anti-reference against borrowing this desktop pattern.

## Supporting bricks measured but not issued as separate transfers

| Key | What it settles | Folded into |
|---|---|---|
| PROPORTIONAL-BREAKDOWN | Divider-separated label and right-aligned figure rows read as one object without per-row cards | Front terrain table; front list pane |
| KO-NAV-CHROME | Korean nav labels separate by word spacing alone, active marked by weight not hue | Mode control; tile grid |
| KO-TILE-GRID-NARROW | Same tiles at two columns with gap and label size unchanged | Korean tile grid record |
| KO-AWARD-THUMB | A Korean metadata line holds three fields at small size without wrapping | Curated work card |
| DARK-GALLERY-HERO | A dark ground with one centred display line and one large soft-cornered panel, no chrome | Landing claim block |
| SHOWCASE-CLAIM-COUNT | A claim followed immediately by a concrete count reads as fact rather than adjective; two-level type ladder with no middle tier | Landing claim block |
| AWARD-FILTER-BAR | Borderless, fill-free filter labels stay subordinate to the work they filter; only the active one takes weight | Mode control |

## Coverage gaps — reported, not invented

1. **Pool-with-remainder allocator, shipped-product evidence.** WEIGHTED-SEGMENT-METER supplies the
   remainder anatomy and STEPPER-LOCKED-STATE supplies the locked-control anatomy, but no publicly
   reachable, unauthenticated product shows a full multi-envelope allocator with a live remaining
   pool. The one open-source candidate reachable in this pass renders only a welcome screen without
   a session. The destination's editor therefore composes from two bricks rather than from one
   observed whole. Treat the composed result as unvalidated by precedent and prove it in the build.
2. **Motion.** No motion study is issued. Measured animated share was zero or near zero on every
   captured component, the destination register is `confident` rather than showpiece, and the
   deployment must paint dependably during a five-day judging window. Motion is declined explicitly
   on five records above rather than manufactured.
3. **Award case studies.** The craft lane captured gallery and award surfaces, but no case-study
   write-up naming concept, stack, and motion approach was captured, because the register does not
   call for a scroll-sequence or WebGL moment and no such moment is proposed.
4. **Four component-only story pages and one minimal example page were rejected by the capture
   guard** as near-empty documents, and one dark gallery timed out. Each was replaced in a single
   repair pass by a reachable source at an equally tight selector; no decision was left unsettled
   by these failures except gap 1 above.
5. **Prior visual norm partially absent.** The project's own design rules cite an eleven-artboard
   canvas as the source of screen vocabulary. It is not in the repository and was not supplied, so
   no brick claims continuity with it.
