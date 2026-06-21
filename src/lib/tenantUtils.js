// Utility to filter entity queries by organization for multi-tenant isolation
export function orgFilter(orgId, additionalFilters = {}) {
  if (!orgId) return additionalFilters;
  return { organization: orgId, ...additionalFilters };
}

// Generate a unique key
export function generateKey(prefix = 'sk') {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix + '_';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a consent receipt ID
export function generateReceiptId() {
  return 'cr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
}

// Calculate days remaining until deadline
export function daysUntilDeadline(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const dl = new Date(deadline);
  const diff = dl - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Get deadline urgency color class
export function deadlineColor(days) {
  if (days === null) return 'text-muted-foreground';
  if (days < 0) return 'text-destructive';
  if (days <= 3) return 'text-destructive';
  if (days <= 14) return 'text-amber-600';
  return 'text-emerald-600';
}

export function deadlineBgColor(days) {
  if (days === null) return 'bg-muted';
  if (days < 0) return 'bg-red-50 text-destructive';
  if (days <= 3) return 'bg-red-50 text-destructive';
  if (days <= 14) return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
}

// Status badge styling
export function statusBadgeClass(status) {
  const map = {
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    in_progress: 'bg-primary/10 text-primary border-primary/20',
    awaiting_info: 'bg-amber-50 text-amber-700 border-amber-200',
    fulfilled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    denied: 'bg-red-50 text-red-700 border-red-200',
    unverified: 'bg-gray-50 text-gray-600 border-gray-200',
    verifying: 'bg-blue-50 text-blue-700 border-blue-200',
    verified: 'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[status] || 'bg-muted text-muted-foreground border-border';
}

// Format status for display
export function formatStatus(status) {
  if (!status) return '';
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Format request type
export function formatRequestType(type) {
  const map = {
    access: 'Access',
    delete: 'Deletion',
    correct: 'Correction',
    opt_out: 'Opt-Out',
  };
  return map[type] || type;
}

// Export data as CSV
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}