import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import KbArticle from '@/components/knowledge-base/KbArticle';
import { dashboardSections, widgetDrawers } from '@/components/knowledge-base/kbContent';
import { LayoutDashboard, MousePointerClick } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, data: dashboardSections },
  { id: 'widget', label: 'Widget', icon: MousePointerClick, data: widgetDrawers },
];

export default function KnowledgeBase() {
  const [active, setActive] = useState('dashboard');
  const current = tabs.find((t) => t.id === active);

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Knowledge Base"
        description="Understand what each part of your dashboard and widget does — and why it matters for compliance."
      />

      <div className="flex items-center gap-2 mb-6">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {current.data.map((section) => (
          <KbArticle key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}