# CAZGO ChargeTrack v1.7 — Master Navigation

## Implemented
1. Moved the Master Charger table and its existing actions to **Master → Charger**.
2. Moved the Master Technician table and its existing actions to **Master → Technician**.
3. Moved **Charger History** under the **Master** group.
4. Removed the **Asset & Inventory** sidebar group.
5. Made **Sparepart Management** a standalone sidebar menu.
6. Removed the Charger and Technician master tables from Maintenance Overview.
7. Retained the Master Charger filters on its dedicated page; Maintenance Overview retains its own KPI filters.
8. Preserved the existing master data actions, charger profile details, history page, sparepart workflows, and other maintenance modules.

## Data safety
- No Firestore collection names or document structures were changed.
- No migration or deletion of Firebase records is required.
- Existing Firebase configuration is not included in this source ZIP. Keep the current local `.env` file when replacing project files.

## Validation
- Parsed both modified JSX modules with Babel parser successfully.
- A full Vite production build could not be executed in this Linux build environment because the uploaded `node_modules` contains Windows-specific optional native binaries. Please run the build on the Windows development machine with `npm.cmd run build`.
