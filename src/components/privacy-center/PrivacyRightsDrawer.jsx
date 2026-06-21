import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { addDays } from 'date-fns';

const REQUEST_TYPES = [
  { key: 'access', label: 'Access My Data', icon: '📋', description: 'Request a copy of all personal data we hold about you.' },
  { key: 'delete', label: 'Delete My Data', icon: '🗑️', description: 'Request deletion of your personal data from our systems.' },
  { key: 'correct', label: 'Correct My Data', icon: '✏️', description: 'Request corrections to inaccurate personal data.' },
  { key: 'opt_out', label: 'Opt Out of Sale', icon: '🚫', description: 'Opt out of the sale or sharing of your personal data.' },
];

const US_STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];

export default function PrivacyRightsDrawer({ site, primaryColor }) {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', state: '', is_agent: false, agent_details: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
    return e;
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const now = new Date();
    const deadline = addDays(now, 45);

    const request = await base44.entities.DataRightsRequest.create({
      organization: site.organization,
      site: site.id,
      request_type: selected,
      requester_name: form.name.trim(),
      requester_email: form.email.trim(),
      requester_state: form.state || undefined,
      is_authorized_agent: form.is_agent,
      agent_details: form.is_agent ? form.agent_details : undefined,
      verification_status: 'unverified',
      request_status: 'new',
      received_date: now.toISOString(),
      statutory_deadline: deadline.toISOString(),
    });

    await base44.entities.AuditEvent.create({
      organization: site.organization,
      related_request: request.id,
      event_type: 'request_received',
      actor: 'system',
      description: `${selected} request submitted by ${form.name.trim()} (${form.email.trim()}) via the Privacy Center widget.`,
    });

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex items-start gap-3 py-2">
        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-900">Request submitted</p>
          <p className="text-xs text-gray-500 mt-1">
            We've received your {selected} request and will respond within 45 days as required by law.
          </p>
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {REQUEST_TYPES.map(rt => (
          <button
            key={rt.key}
            onClick={() => setSelected(rt.key)}
            className="text-left p-4 rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-sm transition-all group"
          >
            <span className="text-2xl block mb-2">{rt.icon}</span>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">{rt.label}</p>
            <p className="text-xs text-gray-500 mt-1">{rt.description}</p>
          </button>
        ))}
      </div>
    );
  }

  const rt = REQUEST_TYPES.find(r => r.key === selected);

  return (
    <div>
      <button
        onClick={() => { setSelected(null); setErrors({}); }}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{rt.icon}</span>
        <p className="text-sm font-semibold text-gray-900">{rt.label}</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Full Name *" error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': primaryColor }}
          />
        </Field>
        <Field label="Email Address *" error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          />
        </Field>
        <Field label="State (optional)">
          <select
            value={form.state}
            onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
          >
            <option value="">Select state…</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_agent}
            onChange={e => setForm(p => ({ ...p, is_agent: e.target.checked }))}
            className="mt-0.5"
          />
          <span className="text-sm text-gray-700">I am filing as an authorized agent on behalf of a consumer</span>
        </label>
        {form.is_agent && (
          <Field label="Agent Details">
            <textarea
              value={form.agent_details}
              onChange={e => setForm(p => ({ ...p, agent_details: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
              placeholder="Name of your organization and authorization basis…"
            />
          </Field>
        )}
        <button
          type="submit"
          style={{ backgroundColor: primaryColor }}
          className="w-full py-2.5 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit Request
        </button>
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}