# Scenario Tagging Report
**Generated:** 2026-03-08  
**Tool:** Manual psych tagging pass v1  
**Source:** `src/lib/game-scenarios.ts` → `scenarios_tagged_all.json`

---

## Summary

| Metric | Value |
|--------|-------|
| Total scenarios tagged | 30 |
| Values outside −2 to +2 | **0** |
| Scenarios with identical left/right | **0** |
| Scenarios where all deltas = 0 | **0** |
| Axes that always oppose (≥2 axes) | ✅ All 30 |

All 30 scenarios pass validation. Each left/right pair pushes in opposite directions on at least 2–3 axes.

---

## Archetype Signal Distribution

Each scenario's left and right choice was scored against the 6 archetypes using the 3-axis matching rule (see `scoreArchetypeSignal()` in `psychProfile.ts`).

| Archetype | Left Signals | Right Signals | Total | % of 60 |
|-----------|-------------|--------------|-------|---------|
| The Hairdryer | 2 | 5 | **7** | 11.7% |
| The Father Figure | 5 | 4 | **9** | 15.0% |
| The Tactician | 2 | 7 | **9** | 15.0% |
| The Showman | 8 | 2 | **10** | 16.7% |
| The Politician | 7 | 8 | **15** | 25.0% |
| The Maverick | 6 | 4 | **10** | 16.7% |

**Note:** The Politician is over-represented (25%) and The Hairdryer is under-represented (11.7%) in this initial 30-scenario batch. This is an artefact of the scenario content naturally skewing toward "board compliance vs board defiance" dilemmas. Target distribution is roughly 16.7% per archetype. This will self-correct as the scenario database scales to 5,000–10,000 entries.

---

## Validation Details

### Values outside −2 to +2
*None found.* All psych delta values are integers in the range [−2, +2].

### Scenarios with identical left/right psych objects
*None found.* Every scenario's left and right psych objects differ on at least 2 axes.

### Scenarios where all deltas are 0
*None found.* Every scenario has at least one non-zero delta on each side.

---

## Ambiguous Scenarios Flagged for Human Review

The following scenarios have nuanced left/right mappings that could reasonably be tagged differently:

| ID | Scenario | Flag |
|----|----------|------|
| `sc_015` | Flood damaged training pitch | Left="rent facility" tagged Politician but could be Tactician (practical, data-driven). Review MM delta. |
| `sc_019` | Dressing room leak | Both choices are damaging (board:+1 vs board:0, both have negative squad). Right="confirm rumors" pushes Maverick but real-world managers rarely do this voluntarily. Consider swapping TT values. |
| `sc_021` | Swap deal for winger | Left="accept trade" tagged Showman (flexibility, player welfare) but could be pure Tactician depending on context. |
| `sc_030` | Team bus stuck in traffic | Low-stakes scenario. Left="demand postponement" Politician tag is weak — consider neutral/Pragmatist. |

---

## Batch Files

Only one batch was needed for 30 scenarios (< 100 threshold):

```
scenarios_tagged_001-030.json  →  same as scenarios_tagged_all.json
scenarios_tagged_all.json      ✅ created
```

For future batches at scale:
- Batch 001–100: `scenarios_tagged_001-100.json`
- Batch 101–200: `scenarios_tagged_101-200.json`
- Merge: `scenarios_tagged_all.json`

---

## Axis Coverage Map

Quick sanity check — axes that move in each scenario:

| ID | TF | D | MP | MM | TT |
|----|----|---|----|----|----|
| sc_001 | · | ✅ | ✅ | ✅ | ✅ |
| sc_002 | · | ✅ | ✅ | ✅ | ✅ |
| sc_003 | ✅ | ✅ | ✅ | ✅ | ✅ |
| sc_004 | ✅ | ✅ | · | ✅ | ✅ |
| sc_005 | ✅ | ✅ | ✅ | ✅ | ✅ |
| sc_006 | · | ✅ | ✅ | ✅ | ✅ |
| sc_007 | ✅ | ✅ | ✅ | ✅ | ✅ |
| sc_008 | · | ✅ | ✅ | ✅ | ✅ |
| sc_009 | ✅ | ✅ | ✅ | ✅ | ✅ |
| sc_010 | · | ✅ | ✅ | ✅ | ✅ |
| sc_011 | · | ✅ | · | ✅ | ✅ |
| sc_012 | ✅ | ✅ | ✅ | · | ✅ |
| sc_013 | ✅ | ✅ | ✅ | ✅ | ✅ |
| sc_014 | · | ✅ | ✅ | ✅ | ✅ |
| sc_015 | ✅ | ✅ | ✅ | ✅ | ✅ |
| sc_016 | ✅ | ✅ | ✅ | ✅ | ✅ |
| sc_017 | · | ✅ | ✅ | · | ✅ |
| sc_018 | ✅ | ✅ | ✅ | ✅ | ✅ |
| sc_019 | ✅ | ✅ | ✅ | ✅ | ✅ |
| sc_020 | · | ✅ | ✅ | ✅ | ✅ |
| sc_021 | ✅ | ✅ | · | ✅ | · |
| sc_022 | ✅ | ✅ | ✅ | ✅ | ✅ |
| sc_023 | ✅ | ✅ | · | · | ✅ |
| sc_024 | · | ✅ | · | ✅ | ✅ |
| sc_025 | ✅ | ✅ | · | ✅ | ✅ |
| sc_026 | ✅ | ✅ | ✅ | ✅ | ✅ |
| sc_027 | ✅ | ✅ | ✅ | · | ✅ |
| sc_028 | ✅ | ✅ | ✅ | · | ✅ |
| sc_029 | ✅ | · | ✅ | ✅ | ✅ |
| sc_030 | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Next Steps

1. **Scale to 5,000+ scenarios** (flagged for ~March 2026 sprint)
2. **Re-run distribution check** — target ≤ 20% per archetype (±5% tolerance)
3. **Re-tag flagged ambiguous scenarios** after playtesting feedback
4. **Consider adding a `psych_confidence`** field (0–1) to flag borderline tags
5. **Archetype balancing pass**: Add 15+ Hairdryer scenarios to bring distribution to ~16.7%

