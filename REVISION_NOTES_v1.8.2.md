# CAZGO ChargeTrack v1.8.2 — Unified Filter & Table Sorting

## Changes
- Removed duplicate filter triggers on Maintenance Overview by combining charger filters and date/export filters into one icon-triggered panel.
- Combined the module-specific filters with the date/export panel in Work Order/Corrective, Preventive Maintenance, Charger History, and Maintenance Reports.
- Removed sort dropdown controls from filter panels.
- Sorting is now triggered directly from table column headers. Click a column heading to sort ascending; click it again to reverse to descending. The active column shows an arrow.
- Applied header sorting to Work Order/Corrective, Overview recent work orders, Preventive Maintenance, Inspection, Charger History, Master Charger, Master Technician, Sparepart master, Stock Movement History, and Technician Performance.
- Table row sorting remains client-side and updates the displayed row order. Existing exports that use the same sorted row data follow the selected sort for their relevant tables.
- Schedule view remains a calendar/list view rather than a tabular grid; date filters remain available there.

## Data safety
- No Firebase config, Firestore collection, document ID, or document schema changes.
- No Firebase migration is required.
- Preserve the current local `.env` when replacing the source project.

## Validation
- MaintenanceModule.jsx passed Babel JSX syntax parsing.
- Run `npm.cmd ci` and `npm.cmd run build` on Windows to validate the production build.
