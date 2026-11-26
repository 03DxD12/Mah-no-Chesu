---
name: emil-design-eng
description: Apply whenever adding or modifying transitions, modals, drawers, tooltips, or interactive feedback.
---

# Emil Design Engineering

Tune motion for responsiveness and clarity:
1. Keep UI transitions under 300ms and prefer GPU-composited properties (`transform`, `opacity`).
2. Avoid `ease-in` on entrances, never scale from `0`, and never animate high-frequency actions.
3. Respect `prefers-reduced-motion: reduce`.

