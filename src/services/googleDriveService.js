const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

export const isGoogleDriveConfigured = () => Boolean(
  import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID && import.meta.env.VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID
);

export function requestGoogleDriveAccessToken() {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) return reject(new Error('VITE_GOOGLE_OAUTH_CLIENT_ID belum diatur pada .env.'));
    if (!window.google?.accounts?.oauth2) return reject(new Error('Google Identity Services belum dimuat. Periksa koneksi internet dan script GIS pada index.html.'));
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response?.error) reject(new Error(response.error_description || response.error));
        else if (response?.access_token) resolve(response.access_token);
        else reject(new Error('Google tidak mengembalikan access token.'));
      },
      error_callback: (error) => reject(new Error(error?.message || 'Popup autentikasi Google gagal dibuka.')),
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

function safeSegment(value) {
  return String(value || 'LOKASI').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase().slice(0, 60) || 'LOKASI';
}

function localDateParts(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error('Tanggal work order tidak valid.');
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return { monthFolder: `${yyyy}-${mm}`, stamp: `${yyyy}${mm}${dd}_${hh}${min}` };
}

async function driveRequest(url, token, options = {}) {
  const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Google Drive API error (${response.status}).`);
  return body;
}

async function findOrCreateFolder(token, name, parentId) {
  const escapedName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const query = `'${parentId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const params = new URLSearchParams({ q: query, fields: 'files(id,name)', pageSize: '100', supportsAllDrives: 'true', includeItemsFromAllDrives: 'true' });
  const listed = await driveRequest(`${DRIVE_API}/files?${params}`, token);
  if (listed.files?.length) return listed.files[0].id;
  const created = await driveRequest(`${DRIVE_API}/files?fields=id,name`, token, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }),
  });
  return created.id;
}

export async function uploadMaintenancePhotoToDrive({ accessToken, file, siteName, dateTime, label }) {
  const rootFolderId = import.meta.env.VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) throw new Error('VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID belum diatur pada .env.');
  if (!accessToken) throw new Error('Hubungkan Google Drive sebelum mengunggah foto.');
  if (!file) throw new Error('File foto tidak ditemukan.');
  if (!file.type?.startsWith('image/')) throw new Error('File dokumentasi harus berupa gambar.');
  const { monthFolder, stamp } = localDateParts(dateTime);
  const folderId = await findOrCreateFolder(accessToken, monthFolder, rootFolderId);
  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const name = `${safeSegment(siteName)}_${stamp}_${safeSegment(label).toLowerCase()}.${extension}`;
  const metadata = { name, parents: [folderId], description: `CAZGO ChargeTrack maintenance photo: ${label}` };
  const boundary = `cazgo_drive_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const multipartBody = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ]);
  const params = new URLSearchParams({ uploadType: 'multipart', supportsAllDrives: 'true', fields: 'id,name,webViewLink,mimeType' });
  const uploaded = await driveRequest(`${DRIVE_UPLOAD_API}/files?${params}`, accessToken, {
    method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipartBody,
  });
  return { ...uploaded, name, folderName: monthFolder };
}
