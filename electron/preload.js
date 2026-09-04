const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel) => (payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld('api', {
  org: {
    get: invoke('org:get'),
    update: invoke('org:update'),
  },
  schools: {
    list: invoke('schools:list'),
    create: invoke('schools:create'),
    update: invoke('schools:update'),
    archive: invoke('schools:archive'),
  },
  academicYears: {
    list: invoke('academicYears:list'),
    create: invoke('academicYears:create'),
  },
  feeStructures: {
    list: invoke('feeStructures:list'),
    create: invoke('feeStructures:create'),
    update: invoke('feeStructures:update'),
    delete: invoke('feeStructures:delete'),
  },
  students: {
    list: invoke('students:list'),
    get: invoke('students:get'),
    create: invoke('students:create'),
    update: invoke('students:update'),
    delete: invoke('students:delete'),
  },
  payments: {
    create: invoke('payments:create'),
    listByStudent: invoke('payments:listByStudent'),
    listAll: invoke('payments:listAll'),
    recent: invoke('payments:recent'),
  },
  dashboard: {
    stats: invoke('dashboard:stats'),
  },
  receipts: {
    print: invoke('receipts:print'),
    savePdf: invoke('receipts:savePdf'),
  },
  backup: {
    exportJson: invoke('backup:exportJson'),
    exportDbFile: invoke('backup:exportDbFile'),
    importJson: invoke('backup:importJson'),
    getDataDir: invoke('backup:getDataDir'),
  },
});
