---
name: improve-codebase-architecture
description: Identify structural coupling and plan minimal, high-leverage architectural improvements without rewriting working systems.
---

# Improve Codebase Architecture

Refactor only where coupling causes real bugs or maintenance friction:
1. Separate pure domain logic from UI rendering, side effects, and async workers.
2. Keep interfaces narrow and preserve existing public contracts.
3. Verify behavior with automated checks before and after refactoring.

