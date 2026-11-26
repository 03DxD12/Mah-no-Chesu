---
name: make-interfaces-feel-better
description: Apply during CSS/styling passes for concentric radii, optical alignment, hit-target sizing, and typography rules.
---

# Make Interfaces Feel Better

Run a targeted CSS polish pass:
1. Enforce concentric border radii (`outer = inner + padding`) and optical icon centering.
2. Use `font-variant-numeric: tabular-nums` on dynamic numbers/timers and `text-wrap: balance` on headings.
3. Ensure at least 40x40px interactive hit areas and zero instances of `transition: all`.

