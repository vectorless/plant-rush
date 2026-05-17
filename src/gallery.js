const KEY = 'plant_rush:gallery:v1';

let photos = []; // [{ id, dataUrl, speciesId, speciesName, growth, takenAt }]

export function loadGallery() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { photos = []; return; }
    const data = JSON.parse(raw);
    photos = Array.isArray(data) ? data.filter(isValid) : [];
  } catch {
    photos = [];
  }
}

function isValid(p) {
  return p && typeof p === 'object'
    && typeof p.id === 'string'
    && typeof p.dataUrl === 'string' && p.dataUrl.startsWith('data:image')
    && typeof p.speciesId === 'string';
}

export function saveGallery() {
  try {
    localStorage.setItem(KEY, JSON.stringify(photos));
    return true;
  } catch (e) {
    return false; // probably quota
  }
}

export function addPhoto(meta) {
  const photo = {
    id: 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    takenAt: Date.now(),
    ...meta,
  };
  photos.unshift(photo); // newest first
  const ok = saveGallery();
  if (!ok) {
    // Roll back if storage failed.
    photos.shift();
    return null;
  }
  return photo;
}

export function getPhotos() {
  return photos.slice();
}

export function deletePhoto(id) {
  const i = photos.findIndex(p => p.id === id);
  if (i < 0) return false;
  photos.splice(i, 1);
  saveGallery();
  return true;
}
