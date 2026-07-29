# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

RuleShift AI serves casual gamers, interactive-fiction players, streamers,
content creators, and people curious about generative AI. A typical player wants
a surprising adventure that is understandable immediately and completes in
approximately five to fifteen minutes.

## Product Purpose

RuleShift AI is a browser-based, card-driven adventure in which an AI Dungeon
Master generates worlds, narrative events, characters, and temporary gameplay
rule proposals. The product succeeds when a first-time player can complete a
coherent, funny, replayable session while the underlying game remains fair and
reliable.

## Positioning

The distinctive mechanism is a deterministic game engine that safely applies
predefined RuleShift behaviors proposed by an AI. The world can feel unstable
without allowing generated content to corrupt authoritative game state.

## Operating Context

Players create a character, enter a generated world, choose predefined or custom
actions, manage health, energy, objectives, and inventory, respond to temporary
rule changes, and reach a victory or defeat result. The primary demonstration is
a reliable two-minute scenario featuring Devesh, the Placement Warrior.

## Capabilities and Constraints

- Next.js App Router, strict TypeScript, Tailwind CSS, and accessible shadcn/ui
  primitives form the application foundation.
- Health, energy, damage, score, inventory, rule duration, and victory remain
  deterministic and server-authoritative.
- AI responses are structured, validated with Zod, and never executed as code.
- The game remains playable through predefined fallback events when AI services
  are unavailable.
- The MVP is single-player and card-based; multiplayer, real-time physics, and
  other advanced features remain out of scope.

## Brand Commitments

The product name is RuleShift AI. Its voice is playful, mysterious, concise, and
slightly chaotic. The approved visual concept is a magical game console
corrupted by unstable AI, combining dark fantasy, neon arcade, glitch, and
cinematic adventure influences without becoming visually crowded.

## Evidence on Hand

The combined functional, technical, and UI/UX specifications provide the
authoritative requirements. No production logos, illustrations, customer
claims, testimonials, or performance benchmarks currently exist and must not be
fabricated.

## Product Principles

- Make the current story and available action immediately understandable.
- Keep creative AI output inside deterministic safety boundaries.
- Make each session surprising without making it impossible.
- Preserve playability during service failures.
- Prioritize a complete, responsive MVP before advanced features.

## Accessibility & Inclusion

The experience must support semantic HTML, keyboard navigation, visible focus,
sufficient contrast, screen-reader status announcements, non-color indicators,
reduced motion, and full playability without audio or hover interaction.
