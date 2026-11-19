# CAZGO ChargeTrack v1.8.1 — Compact Filter Trigger

## UI refinement
- Replaced large collapsed filter headers with a compact, icon-only filter button.
- Clicking the filter icon opens a full-width expandable panel.
- Expanded panel displays its title, optional subtitle, all filter/sort controls, and a close icon.
- Applied to shared date-range/sorting toolbars and the other collapsible filter panels.
- Existing filter values and sort settings remain preserved when panels are collapsed.
- No Firestore schema, data, or migration changes.

## Validation
- MaintenanceModule.jsx passed Babel JSX syntax parsing.
- Full Vite build still requires installing platform-appropriate dependencies on the Windows workstation.
