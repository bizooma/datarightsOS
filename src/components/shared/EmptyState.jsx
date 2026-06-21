import { FileText } from 'lucide-react';

export default function EmptyState({ icon: Icon = FileText, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
    </div>
  );
}