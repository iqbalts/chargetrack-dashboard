# Google Drive photo upload setup

ChargeTrack uploads work-order photos directly to a company Google Drive folder using the signed-in Google Workspace user's OAuth permission. No service-account key or client secret is stored in the frontend.

## Required configuration
1. In Google Cloud Console, select the project used for the web app (or a dedicated project).
2. Enable **Google Drive API**.
3. Configure the OAuth consent screen. For a company Google Workspace, prefer **Internal** user type if the Workspace administrator allows it. Add the Drive scope `https://www.googleapis.com/auth/drive`. This is a broad Drive scope; restrict the OAuth app to company users and follow Workspace security policy.
4. Create an OAuth Client ID of type **Web application**. Add the exact local origin `http://localhost:5173` to Authorized JavaScript origins. Add the production domain later before deployment.
5. Create a root folder in the company's Google Drive, e.g. `CAZGO Maintenance Documentation`. Share that folder with the Google Workspace account that will authorize uploads (Editor permission). Copy the folder ID from its Drive URL.
6. Copy `.env.example` to `.env` if needed and set:
   - `VITE_GOOGLE_OAUTH_CLIENT_ID=...`
   - `VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID=...`
7. Restart Vite after editing `.env` (`Ctrl+C`, then `npm.cmd run dev`).
8. In the Work Order form, click **Hubungkan Google Drive** and sign in using the company account with access to the root folder.

## Folder and filename convention
The app creates a month folder inside the configured root folder, e.g. `2026-11`. Photos are uploaded using names such as `TKC_20261116_1430_sebelum.jpg`, `TKC_20261116_1430_sesudah.jpg`, and `TKC_20261116_1430_tambahan.jpg`. Location text is normalized to uppercase letters/numbers/underscores.

The resulting Drive `webViewLink`, file ID, file name, and month folder name are saved in the corresponding Work Order document in Firestore. Files are owned by / uploaded as the authorizing company Google account and placed in the configured shared folder. Ensure the account remains active and the folder is not deleted.

## Security and operational notes
- The OAuth access token is held in page memory only and is not written to Firestore or local storage. Reconnect after refresh or token expiry.
- The OAuth client ID and folder ID are public configuration values; do not place a client secret or service-account private key in `VITE_` variables.
- The `drive` OAuth scope grants broad access to the authorizing user's Drive. Have the Google Workspace administrator review the consent configuration and access policy before production.
- Google Drive upload requires browser access to Google Identity Services and Google Drive API. Pop-up permissions and company Workspace restrictions can block authorization.
- Uploads are performed before the Work Order is saved. If an upload succeeds but the Firestore save subsequently fails, the uploaded file can remain in Drive without a linked Work Order; reconcile such orphaned files periodically.
