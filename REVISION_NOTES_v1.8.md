# CAZGO ChargeTrack v1.8 — Collapsible Filters & Sorting

## Implemented
- Added independent expand/collapse controls for date filter/export toolbars.
- Added expand/collapse controls for the non-date filters in Maintenance Overview, Work Order, Preventive Maintenance, Charger History, Master Charger, Master Technician, Sparepart Master, and Maintenance Reports.
- Filter panels start collapsed; hiding a panel does not clear the values inside.
- Added Ascending and Descending sorting controls to all maintenance data menus and master data tables.
- Sorting controls support relevant fields such as date, Charger ID, location, status, priority, technician, sparepart name, quantity, and stock.
- Sorting is applied to visible table rows and exported CSV/XLSX rows.
- Kept existing date-range filtering, CSV/XLSX export, v1.7 navigation, and link-only documentation flow.

## Data safety
- Sorting is client-side and does not write to Firebase.
- No Firestore collection names, document IDs, or document schemas were changed.
- No Firebase migration is required.
- Preserve the current local `.env` when replacing project files.

## Validation
- Updated JSX passed Babel parser validation.
- Full Vite build could not run in this environment: uploaded Windows `node_modules` binaries are not executable in the Linux build container (`vite: Permission denied`). Run `npm.cmd ci` and `npm.cmd run build` on the Windows workstation.
