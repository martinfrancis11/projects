const KEY = 'fi_device_id';

export function getDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(KEY, id);
  }
  return id;
}
