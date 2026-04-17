import { getUserScopedKey, readStorage, writeStorage } from './storageService.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

const DEFAULT_LICENSES = [
  { id: 1, type: 'A1', name: 'Xe máy dưới 175cc', fee: 850_000, duration: '3 tháng' },
  { id: 2, type: 'A2', name: 'Xe máy trên 175cc', fee: 2_500_000, duration: '4 tháng' },
  { id: 3, type: 'B1', name: 'Ô tô số tự động', fee: 14_500_000, duration: '6 tháng' },
  { id: 4, type: 'B2', name: 'Ô tô số sàn', fee: 15_000_000, duration: '6 tháng' },
  { id: 5, type: 'C', name: 'Xe tải dưới 3.5 tấn', fee: 18_000_000, duration: '8 tháng' },
];

const DEFAULT_REGIONS = [
  { id: 1, name: 'Quận 1' }, { id: 2, name: 'Quận 3' }, { id: 3, name: 'Quận 5' },
  { id: 4, name: 'Quận 7' }, { id: 5, name: 'Quận 12' }, { id: 6, name: 'Quận Gò Vấp' },
  { id: 7, name: 'Quận Tân Bình' }, { id: 8, name: 'Quận Bình Thạnh' },
  { id: 9, name: 'Quận Thủ Đức' }, { id: 10, name: 'Huyện Củ Chi' }, { id: 11, name: 'Tỉnh lân cận' },
];

const DEFAULT_STATUSES = [
  { id: 1, label: 'Mới đăng ký', color: 'blue' },
  { id: 2, label: 'Chờ khám sức khỏe', color: 'orange' },
  { id: 3, label: 'Đã khám sức khỏe', color: 'green' },
  { id: 4, label: 'Chờ nộp hồ sơ', color: 'orange' },
  { id: 5, label: 'Đã nộp hồ sơ', color: 'green' },
  { id: 6, label: 'Đang học', color: 'purple' },
  { id: 7, label: 'Chờ thi', color: 'neutral' },
  { id: 8, label: 'Đã xếp lịch thi', color: 'blue' },
  { id: 9, label: 'Đã đỗ', color: 'green' },
  { id: 10, label: 'Thi lại', color: 'red' },
  { id: 11, label: 'Tạm dừng', color: 'neutral' },
  { id: 12, label: 'Hủy', color: 'red' },
  { id: 13, label: 'Còn nợ học phí', color: 'orange' },
  { id: 14, label: 'Hoàn tất', color: 'green' },
];

const DEFAULT_TEMPLATES = [
  { id: 1, name: 'Chào mừng đăng ký', trigger: 'Mới đăng ký', content: 'Xin chào {ho_ten}, bạn đã đăng ký học lái xe hạng {hang_bang} tại Trung tâm A.Đức. Chúng tôi sẽ liên hệ sớm nhất.' },
  { id: 2, name: 'Nhắc khám sức khỏe', trigger: 'Chờ khám sức khỏe', content: 'Kính gửi {ho_ten}, bạn cần hoàn thành giấy khám sức khỏe để tiếp tục đăng ký học bằng lái. Liên hệ: 0909xxxxxx.' },
  { id: 3, name: 'Nhắc nộp hồ sơ', trigger: 'Chờ nộp hồ sơ', content: 'Kính gửi {ho_ten}, vui lòng nộp hồ sơ (CCCD + ảnh thẻ + giấy KSK) để hoàn tất thủ tục đăng ký.' },
  { id: 4, name: 'Nhắc đóng học phí', trigger: 'Còn nợ học phí', content: 'Kính gửi {ho_ten}, bạn còn nợ {so_tien_no} học phí. Vui lòng thanh toán trước ngày {han_nop}.' },
  { id: 5, name: 'Thông báo lịch thi', trigger: 'Đã xếp lịch thi', content: 'Kính gửi {ho_ten}, bạn được xếp thi hạng {hang_bang} vào ngày {ngay_thi}, lúc {gio_thi} tại {dia_diem_thi}.' },
  { id: 6, name: 'Chúc mừng đỗ bằng', trigger: 'Đã đỗ', content: 'Xin chúc mừng {ho_ten} đã đỗ bằng lái hạng {hang_bang}! Trung tâm A.Đức rất vui được đồng hành cùng bạn.' },
];

const DEFAULT_SOURCES = [
  { id: 1, name: 'Facebook', description: 'Quảng cáo Facebook Ads' },
  { id: 2, name: 'Website', description: 'Website chính thức trung tâm' },
  { id: 3, name: 'Người giới thiệu', description: 'Cộng tác viên / học viên cũ giới thiệu' },
  { id: 4, name: 'Quảng cáo ngoài trời', description: 'Băng rôn, tờ rơi, pano' },
  { id: 5, name: 'Nhân viên tư vấn', description: 'Nhân viên trực tiếp tư vấn' },
  { id: 6, name: 'Zalo', description: 'Trang Zalo OA của trung tâm' },
];

const SETTINGS_KEYS = {
  licenses: 'settings.licenses.v1',
  regions: 'settings.regions.v1',
  statuses: 'settings.statuses.v1',
  templates: 'settings.templates.v1',
  sources: 'settings.sources.v1',
};

const DEFAULT_DATA = {
  licenses: DEFAULT_LICENSES,
  regions: DEFAULT_REGIONS,
  statuses: DEFAULT_STATUSES,
  templates: DEFAULT_TEMPLATES,
  sources: DEFAULT_SOURCES,
};

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const createId = () => Date.now() + Math.floor(Math.random() * 1000);

const readStore = (storeName) => readStorage(
  getUserScopedKey(SETTINGS_KEYS[storeName]),
  clone(DEFAULT_DATA[storeName]),
);

const writeStore = (storeName, items) => writeStorage(
  getUserScopedKey(SETTINGS_KEYS[storeName]),
  items,
);

const sanitizeLicense = (item) => ({
  id: Number(item.id) || createId(),
  type: String(item.type || '').trim(),
  name: String(item.name || '').trim(),
  fee: Number.isFinite(Number(item.fee)) ? Number(item.fee) : 0,
  duration: String(item.duration || '').trim(),
});

const sanitizeRegion = (item) => ({
  id: Number(item.id) || createId(),
  name: String(item.name || '').trim(),
});

const sanitizeSource = (item) => ({
  id: Number(item.id) || createId(),
  name: String(item.name || '').trim(),
  description: String(item.description || '').trim(),
});

const sanitizeStatus = (item) => ({
  id: Number(item.id) || createId(),
  label: String(item.label || '').trim(),
  color: String(item.color || 'neutral').trim() || 'neutral',
});

const sanitizeTemplate = (item) => ({
  id: Number(item.id) || createId(),
  name: String(item.name || '').trim(),
  trigger: String(item.trigger || '').trim(),
  content: String(item.content || '').trim(),
});

const appendIfMissing = (items, nextItem, comparator) => {
  if (!nextItem.name) return items;
  if (items.some((item) => comparator(item, nextItem))) return items;
  return [...items, nextItem];
};

const normalizeStores = () => {
  let licenses = clone(readStore('licenses'));
  let regions = clone(readStore('regions'));
  let sources = clone(readStore('sources'));
  const statuses = clone(readStore('statuses')).map(sanitizeStatus);
  const templates = clone(readStore('templates')).map(sanitizeTemplate);

  let changed = false;
  const validLicenses = [];

  for (const rawItem of licenses) {
    const looksLikeLicense = rawItem && String(rawItem.type || '').trim();

    if (looksLikeLicense) {
      validLicenses.push(sanitizeLicense(rawItem));
      continue;
    }

    changed = true;

    if (rawItem && hasOwn(rawItem, 'description')) {
      const sourceItem = sanitizeSource(rawItem);
      sources = appendIfMissing(
        sources.map(sanitizeSource),
        sourceItem,
        (item, next) => item.id === next.id || (
          item.name.toLowerCase() === next.name.toLowerCase()
          && item.description.toLowerCase() === next.description.toLowerCase()
        ),
      );
      continue;
    }

    if (rawItem?.name) {
      const regionItem = sanitizeRegion(rawItem);
      regions = appendIfMissing(
        regions.map(sanitizeRegion),
        regionItem,
        (item, next) => item.id === next.id || item.name.toLowerCase() === next.name.toLowerCase(),
      );
    }
  }

  const normalizedRegions = regions.map(sanitizeRegion);
  const normalizedSources = sources.map(sanitizeSource);

  if (
    changed
    || JSON.stringify(licenses) !== JSON.stringify(validLicenses)
    || JSON.stringify(regions) !== JSON.stringify(normalizedRegions)
    || JSON.stringify(sources) !== JSON.stringify(normalizedSources)
    || JSON.stringify(readStore('statuses')) !== JSON.stringify(statuses)
    || JSON.stringify(readStore('templates')) !== JSON.stringify(templates)
  ) {
    writeStore('licenses', validLicenses);
    writeStore('regions', normalizedRegions);
    writeStore('sources', normalizedSources);
    writeStore('statuses', statuses);
    writeStore('templates', templates);
  }

  return {
    licenses: validLicenses,
    regions: normalizedRegions,
    statuses,
    templates,
    sources: normalizedSources,
  };
};

const withStore = (storeName, sanitizeItem) => ({
  get: () => clone(normalizeStores()[storeName]),
  create: async (payload) => {
    const stores = normalizeStores();
    const items = stores[storeName];
    const newItem = sanitizeItem({ id: createId(), ...payload });
    const nextItems = [...items, newItem];
    writeStore(storeName, nextItems);
    return clone(newItem);
  },
  update: async (id, payload) => {
    const stores = normalizeStores();
    const items = stores[storeName];
    const itemId = Number(id);
    const index = items.findIndex((item) => item.id === itemId);

    if (index === -1) {
      const createdItem = sanitizeItem({ id: itemId || createId(), ...payload });
      writeStore(storeName, [...items, createdItem]);
      return clone(createdItem);
    }

    const updatedItem = sanitizeItem({
      ...items[index],
      ...payload,
      id: itemId,
      updatedAt: new Date().toISOString(),
    });

    const nextItems = [...items];
    nextItems[index] = updatedItem;
    writeStore(storeName, nextItems);
    return clone(updatedItem);
  },
  delete: async (id) => {
    const stores = normalizeStores();
    const itemId = Number(id);
    const nextItems = stores[storeName].filter((item) => item.id !== itemId);
    writeStore(storeName, nextItems);
    return { id: itemId, deleted: true, deletedAt: new Date().toISOString() };
  },
});

const licenseStore = withStore('licenses', sanitizeLicense);
const regionStore = withStore('regions', sanitizeRegion);
const statusStore = withStore('statuses', sanitizeStatus);
const templateStore = withStore('templates', sanitizeTemplate);
const sourceStore = withStore('sources', sanitizeSource);

const resolveStoreByType = (type) => {
  const map = {
    license: licenseStore,
    region: regionStore,
    status: statusStore,
    template: templateStore,
    source: sourceStore,
  };
  return map[type];
};

const inferStoreFromPayload = (payload = {}) => {
  if (hasOwn(payload, 'type') || hasOwn(payload, 'fee') || hasOwn(payload, 'duration')) return licenseStore;
  if (hasOwn(payload, 'content') || hasOwn(payload, 'trigger')) return templateStore;
  if (hasOwn(payload, 'description')) return sourceStore;
  return regionStore;
};

export const getLicenseSettings = async () => licenseStore.get();
export const getRegionSettings = async () => regionStore.get();
export const getStatusSettings = async () => statusStore.get();
export const getTemplateSettings = async () => templateStore.get();
export const getSourceSettings = async () => sourceStore.get();

export const createLicenseItem = (payload) => licenseStore.create(payload);
export const updateLicenseItem = (id, payload) => licenseStore.update(id, payload);
export const deleteLicenseItem = (id) => licenseStore.delete(id);

export const createRegionItem = (payload) => regionStore.create(payload);
export const deleteRegionItem = (id) => regionStore.delete(id);

export const createSourceItem = (payload) => sourceStore.create(payload);
export const deleteSourceItem = (id) => sourceStore.delete(id);

export const updateTemplateItem = (id, payload) => templateStore.update(id, payload);

export const createSettingItem = (type, payload) => {
  if (typeof type === 'string' && payload !== undefined) {
    return (resolveStoreByType(type) || licenseStore).create(payload);
  }

  return inferStoreFromPayload(type).create(type);
};

export const updateSettingItem = (typeOrId, idOrPayload, payload) => {
  if (typeof typeOrId === 'string' && typeof idOrPayload === 'number') {
    return (resolveStoreByType(typeOrId) || templateStore).update(idOrPayload, payload);
  }

  return inferStoreFromPayload(idOrPayload).update(typeOrId, idOrPayload);
};

export const deleteSettingItem = (typeOrId, id) => {
  if (typeof typeOrId === 'string' && id !== undefined) {
    return (resolveStoreByType(typeOrId) || licenseStore).delete(id);
  }

  const itemId = Number(typeOrId);
  const stores = [
    ['licenses', licenseStore],
    ['regions', regionStore],
    ['statuses', statusStore],
    ['templates', templateStore],
    ['sources', sourceStore],
  ];

  const normalized = normalizeStores();
  const foundStore = stores.find(([storeName]) => normalized[storeName].some((item) => item.id === itemId));

  return foundStore ? foundStore[1].delete(itemId) : Promise.resolve({ id: itemId, deleted: true });
};
