import { statusBadgeClass, formatStatus } from '@/lib/tenantUtils';

export default function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusBadgeClass(status)} ${className}`}
    >
      {formatStatus(status)}
    </span>
  );
}