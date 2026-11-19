# ChargeTrack Maintenance Module — Implementation Notes

## Scope

This implementation adds nine Maintenance pages to the existing ChargeTrack Dashboard:

1. Maintenance Overview
2. Work Order / Maintenance Ticket
3. Preventive Maintenance
4. Corrective Maintenance
5. Inspection & Checklist
6. Charger Maintenance History
7. Sparepart Management
8. Maintenance Schedule
9. Maintenance Reports

The existing navigation IDs remain unchanged:
- `dashboard`
- `update`
- `calendar`
- `settings`

Maintenance navigation IDs use the `maintenance-` prefix.

## Firestore paths

All new collections use the existing namespace:

`artifacts/caztrack-v1/public/data/{collectionName}`

New collections:
- `chargers`
- `technicians` (adapted from `MASTER_TEKNISI`)
- `maintenanceTickets`
- `pmSchedules`
- `inspections`
- `spareparts`
- `stockMovements`
- `maintenanceAuditLogs`
- `maintenanceCounters` (ticket number sequence)

Existing `users` and `locations` collections are not modified by this module.

## Charger master import

The Maintenance module does not silently create charger records from `locations.chargers`, because that existing field represents charger type/brand/quantity and may not contain an individual Charger ID.

Use the CSV importer in Maintenance Overview to import individual records from the `MASTER_CHARGER` worksheet. Download the blank CSV template from the importer and populate it with verified current data. Existing Charger IDs are merged/updated; no existing charger record is deleted.

Expected CSV columns:

`Charger ID, Site, Alamat, Kota, Tipe Charger, Power (kW), Connector, Serial Number, Vendor, Tanggal Instalasi, Status, IP/Hostname, OCPP Status, Keterangan`

The workbook provided as a reference contains 35 non-empty charger rows and two active technician rows, but it also contains test transactions and historic operational values. Review the currentness of the source rows before importing them.

## Legacy maintenance fields carried forward

The ticket form retains the prior system's core data points: Jenis Maintenance, Prioritas, Keluhan, Temuan, Root Cause, Tindakan, Sparepart, Qty, Teknisi, Start Time, Finish Time, Downtime, Status, Foto/Link, Catatan, Kondisi Charger, and charger master snapshot fields (Alamat, Kota, Tipe Charger, Power, Connector, Serial Number, Vendor, OCPP Status). Sparepart usage also stores Part Number, Harga Satuan, and Supplier snapshots. Documentation supports Foto Sebelum, Foto Sesudah, Foto Tambahan, and a manual URL.

The technician master is stored separately in `technicians`, based on the old `MASTER_TEKNISI` sheet. Technicians with status `Aktif` are offered in the form; free-text entry remains available.

The legacy status `Waiting Sparepart` is supported. `Pending` is retained as an additional compatibility status.

## Work order numbering and sparepart usage

Ticket IDs are generated using a Firestore transaction and the `maintenanceCounters/tickets` counter document. The counter and ticket creation are atomic.

If a ticket consumes a sparepart, the stock decrement and stock movement are written in the same transaction as ticket creation. A stock shortage prevents the ticket transaction from being committed.

## PM logic

- `OK`: next PM date is more than 7 days away.
- `Due Soon`: next PM date is today through 7 days away.
- `Overdue`: next PM date is before today.
- `Belum Ada Jadwal`: next PM date is empty.

Completing a Preventive ticket updates the matching charger schedule using its configured interval.

## Attachments

Work Order documentation is link-only. Users paste a Google Drive folder/file URL (or another HTTPS documentation URL) into `attachmentUrl`. ChargeTrack stores the URL in Firestore and displays it as a clickable link in Work Order details.

No Google OAuth, Drive API, or in-app file upload is required. Users manage files and folders directly in the company Google Drive. Existing legacy photo URL fields (`photoBeforeUrl`, `photoAfterUrl`, `photoAdditionalUrl`) remain readable and clickable for previously saved records.

## PM email reminders

The old Apps Script project contains a `cekReminderPM()` email routine. This React/Firebase module currently shows Due Soon and Overdue counts and schedule items in the application; it does not send scheduled email reminders. Reliable scheduled email requires a trusted scheduled backend (for example, Cloud Functions / Cloud Scheduler) and an approved recipient list. No emails are sent automatically by this module.

## Access control and production warning

The current ChargeTrack source authenticates to Firebase anonymously, while the app's visible user login and role are maintained in Firestore/local browser state. This is not a secure authorization boundary.

The module hides write controls from the `Viewer` role in the UI, but this is only a user-interface guard. It does not replace Firestore/Storage Security Rules. Before production use, migrate app login to Firebase Authentication and enforce Admin/Editor/Viewer authorization server-side (for example, custom claims or a trusted role document that cannot be modified by the client).

Do not deploy permissive `allow read, write: if request.auth != null` rules as a production solution. The current anonymous sign-in would satisfy that condition.

## Important metric definitions

- Downtime is calculated from ticket start and finish timestamps in minutes.
- MTTR in the initial report is the average recorded start-to-finish duration for completed Corrective/Emergency tickets.
- MTBF is intentionally not shown until failure event definitions and timestamps are consistently recorded.
- PM Completed is a count of completed Preventive tickets. It is not presented as PM compliance percentage because due occurrences are not yet stored as individual schedule events.

## Validation

The source was syntax-checked with TypeScript's JSX parser. A production Vite build could not be completed in the working environment because npm dependency installation did not finish. Run `npm ci` and `npm run build` locally before deployment.


## Date filters and exports (v1.6)

The Maintenance Overview, Preventive Maintenance, Corrective Maintenance, Inspection Register, Charger History, Sparepart Stock Movement History, Maintenance Schedule, and Maintenance Reports provide independent start/end date filters. The selected date range filters the relevant records shown in each module and is applied to that module's CSV and Excel exports.

- Work Orders / Corrective Maintenance / Charger History / Overview / Reports: filter by Work Order creation date (`createdAt`).
- Preventive Maintenance: filter by next scheduled maintenance date (`nextMaintenanceDate`).
- Inspection Register: filter by inspection date (`inspectionDate`).
- Maintenance Schedule: filter PM items by next maintenance date and Work Orders by start time.
- Sparepart Management: filter stock movement history by transaction creation date. Master inventory remains a current stock snapshot and is not period-based.

Each module has its own date range; resetting one module does not reset the others. Excel exports are generated as `.xlsx` workbooks in the browser, with a bold header row, frozen header, and Excel column filters; no additional export service or npm package is required.


## Sidebar and master-data navigation (v1.7)

- Master Charger is now a dedicated page under Master.
- Technician is now a dedicated page under Master.
- Charger History is grouped under Master.
- Sparepart Management is a standalone sidebar item.
- The Asset & Inventory navigation group has been removed.
- Master Charger and Master Technician tables have been removed from Maintenance Overview.
- Charger filters remain available on the dedicated Master Charger page and the Overview retains its KPI filters.
- Existing Firestore collections, document IDs, and relations are unchanged. This release changes navigation and page composition only.


## Collapsible filters and sorting (v1.8)

- Date-range toolbars can be expanded/collapsed independently per module. They are collapsed by default.
- Search/status/site/type filters are also collapsible in modules where those filters exist.
- Collapsing a filter panel does not reset its selected values.
- Each table module has independent sort field and direction settings (Ascending / Descending).
- Sorting is applied to the displayed records and the rows passed to CSV/XLSX export.
- Sorting controls are available in Maintenance Overview, Work Order/Corrective, Preventive Maintenance, Inspection, Charger History, Sparepart movement history, Maintenance Schedule, Maintenance Reports, Master Charger, Master Technician, and Sparepart master.
- Master-data sorting is presentation-only. No Firebase data is rewritten.
