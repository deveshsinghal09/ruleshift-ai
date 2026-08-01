# RuleShift AI Design System

<!--
THESIS: RuleShift AI feels like a physical adventure console whose reality can
misalign, not a chatbot wrapped in neon cards.
OWN-WORLD: Ink-black hardware, layered graphite surfaces, pale interface text,
and one contextual signal color at a time. Controls use compact radii, etched
labels, and restrained offset depth.
STORY: The interface is dependable until a RuleShift introduces one deliberate
visual discontinuity; the player always retains a clear action and readable
state.
FIRST VIEWPORT: A calm calibration field frames a dominant component surface,
with controls grouped by task and the magenta reality seam reserved for the
RuleShift example.
FORM: Brief-pinned arcane console, staged as an operational component bench.
No concept seed was used because the combined specification already approved
the world.
-->

## Design intent

The visual system represents a magical game console corrupted by unstable AI.
Its base layer is calm, solid, and readable. Instability appears only when the
product communicates a meaningful RuleShift, error, or state transition.

The system deliberately avoids generic glass dashboards, glowing borders on
every component, gradient text, decorative blur, and constant animation.

## Color

### Base surfaces

| Token | Value | Purpose |
| --- | --- | --- |
| `--background-primary` | `#08090d` | Application canvas |
| `--background-secondary` | `#10131b` | Recessed regions |
| `--background-card` | `#161a24` | Primary component surface |
| `--background-elevated` | `#202635` | Menus, dialogs, active layers |
| `--background-pressed` | `#0c0f16` | Pressed and selected inset state |

### Text hierarchy

| Token | Value | Purpose |
| --- | --- | --- |
| `--text-primary` | `#f8fafc` | Headings and primary copy |
| `--text-secondary` | `#b6bfce` | Supporting copy |
| `--text-muted` | `#9aa4b5` | Metadata and placeholders |
| `--text-inverse` | `#08090d` | Text on bright actions |

### Context signals

| Token | Value | Purpose |
| --- | --- | --- |
| `--accent-primary` | `#8b5cf6` | AI Dungeon Master and primary action |
| `--accent-secondary` | `#22d3ee` | Exploration and player action |
| `--accent-chaos` | `#f43f5e` | RuleShift and reality instability |
| `--accent-success` | `#34d399` | Rewards and successful outcomes |
| `--accent-warning` | `#fbbf24` | Quests and warnings |
| `--accent-danger` | `#fb7185` | Damage, errors, and defeat |

Only one context signal should dominate a component or region. Color must be
paired with an icon, label, pattern, or message; it never carries meaning alone.

## Typography

- **Display:** Unbounded, weights 500–700. Used for world names, major state
  changes, and short page titles.
- **Interface:** Geist, variable weight. Used for body text and controls.
- **System:** Geist Mono. Used for turn counters, RuleShift duration, compact
  measurements, and console-status messages.

Display copy stays below `6rem`, uses no tighter than `-0.03em` tracking, and is
kept short. Body copy targets `65–72ch` and a line height of at least `1.6`.

## Spacing

The spacing scale is `4, 8, 12, 16, 24, 32, 48, 64` pixels.

- Inline icon gaps: 8 pixels
- Compact control padding: 8–12 pixels
- Standard control padding: 12–16 pixels
- Card padding: 16 pixels on mobile, 24 pixels from tablet upward
- Section separation: 32–64 pixels

Related content stays tight; unrelated systems receive visible separation.

## Radius

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | `10px` | Inputs, badges, compact controls |
| `--radius-md` | `12px` | Buttons, tabs, tooltips |
| `--radius-lg` | `16px` | Cards, dialogs, sheets |
| `--radius-full` | `999px` | Status dots and compact badges only |

## Borders and shadows

Surfaces generally use either a thin etched border or elevation, not both.

- Default border: `rgba(255, 255, 255, 0.08)`
- Strong border: `rgba(255, 255, 255, 0.14)`
- Active border: the current contextual signal at approximately 65% opacity
- Elevated shadow: a dark 10-pixel offset with a soft 28-pixel blur
- Action shadow: a short 3-pixel physical offset, reduced when pressed
- RuleShift seam: one displaced cyan/pink edge reserved for instability

## Motion

Motion communicates state change rather than decorating idle screens.

| Token | Duration | Use |
| --- | --- | --- |
| `instant` | `0ms` | Reduced-motion replacement |
| `fast` | `150ms` | Hover, press, focus |
| `standard` | `240ms` | Drawers, tab indicators, state changes |
| `deliberate` | `380ms` | Dialogs and narrative transitions |
| `ruleshift` | `650ms` | Major RuleShift choreography only |

The standard easing curve is `[0.22, 1, 0.36, 1]`. No component animates
continuously. Reduced-motion mode removes spatial travel and distortion while
preserving immediate state feedback.

## Focus

All interactive components use the same two-layer focus treatment:

1. A 2-pixel background-colored separation ring.
2. A 2-pixel cyan focus ring.

Focus is shown with `:focus-visible`, never removed without a replacement, and
must remain visible on every contextual surface.

## Component states

Every applicable component defines:

- Default, hover, pressed, and focus-visible
- Selected through semantic state such as `aria-pressed` or `data-state`
- Disabled with reduced contrast and a non-interactive cursor
- Loading with an accessible busy state and persistent label
- Error with an icon or explicit message in addition to color

## Responsive behavior

- Below 640 pixels: single-column composition, 16-pixel page gutters, full-width
  primary controls, a five-destination game dock, and bottom-anchored sheets.
- 640–767 pixels: single-column story composition with roomier gutters and
  bottom-anchored sheets.
- 768–1023 pixels: the story remains primary while sheets become right-side
  drawers for tablet reach and context retention.
- At 1024 pixels and above: player and objective context moves into persistent
  side rails; the mobile command dock is removed.
- Above 1440 pixels: content width remains bounded; spacing grows before type.

Controls maintain a minimum 44-pixel touch target and never require hover.
Focusing the custom-action field moves the mobile command dock out of the
software-keyboard area without changing the story or action order.

## Accessibility principles

- Meet WCAG AA contrast for text and interactive states.
- Use semantic HTML and explicit accessible names.
- Preserve keyboard order and focus when dialogs or sheets open and close.
- Announce errors and loading state with semantic attributes.
- Respect `prefers-reduced-motion`.
- Keep content understandable without motion, sound, hover, or color.
- Never place essential text in decorative imagery.

## Assistive feedback and audio

- A global skip link targets the single `main` landmark on every route.
- Character-creation step changes move focus to the new step heading.
- Game live regions announce health, energy, narration, item, and RuleShift
  changes without duplicating visible content in the accessibility tree.
- Victory and defeat are announced on the result route.
- Optional action, damage, item, RuleShift, victory, and defeat cues are
  synthesized with the Web Audio API; no copyrighted audio files are loaded.
- Audio context creation occurs only after an in-game user action. Mute and
  volume preferences persist locally, while every cue remains non-essential.
- Reduced-motion mode removes page, narration, dialog, drawer, stat, and item
  movement while preserving immediate high-contrast state changes.

## Production presentation guarantees

- Loading, database-unavailable, provider-fallback, victory, and defeat states
  retain the same branded console language and never expose infrastructure
  details.
- Responsive acceptance widths are 375, 640, 768, 1024, and 1440 pixels with
  no horizontal overflow or reliance on hover.
- Result imagery contains only UI-safe persisted summary data and never includes
  ownership tokens, provider diagnostics, or secrets.
- Operational health endpoints return data rather than presentation and are not
  linked as player-facing dashboard surfaces.
