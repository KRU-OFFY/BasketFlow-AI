import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import {
  getProgressPercent,
  getWeeklyProgressSummary,
  reportingWeekStartDate,
  weeklyProgressRecords,
  type WeeklyProgressStatus,
} from '@/lib/weekly-progress';

type Tone = 'slate' | 'green' | 'orange' | 'red' | 'purple';

const statusTone: Record<WeeklyProgressStatus, Tone> = {
  on_track: 'green',
  at_risk: 'orange',
  blocked: 'red',
};

const statusLabel: Record<WeeklyProgressStatus, string> = {
  on_track: 'On track',
  at_risk: 'At risk',
  blocked: 'Blocked',
};

export default function Dashboard() {
  const summary = getWeeklyProgressSummary();
  const blockerEntries = weeklyProgressRecords.flatMap((record) =>
    record.blockers.map((blocker) => ({
      id: `${record.id}-${blocker}`,
      project: record.project,
      owner: record.owner,
      blocker,
      sourceHref: record.sourceHref,
    })),
  );

  const stats = [
    ['Week starting', reportingWeekStartDate],
    ['Projects tracked', String(weeklyProgressRecords.length)],
    ['Target progress', `${summary.targetProgressPercent}%`],
    ['Slack updates', String(summary.slackRecordCount)],
    ['Sheet rows', String(summary.spreadsheetRecordCount)],
    ['Open blockers', String(summary.blockerCount)],
  ];

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-orange">Weekly progress dashboard</p>
          <h1 className="text-3xl font-bold">Slack + spreadsheet progress view</h1>
          <p className="mt-2 max-w-3xl text-slate-500">
            A source-linked internal dashboard that keeps deterministic spreadsheet metrics separate from AI-assisted Slack cleanup, blockers, risks, and next actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="btn btn-secondary" href="/posting-queue">Review blockers</Link>
          <Link className="btn" href="/analytics">Open analytics</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_.8fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Project scorecard</h2>
              <p className="mt-1 text-sm text-slate-500">
                Normalized weekly records with source, owner, metric, target, status, blockers, and AI-ready summary fields.
              </p>
            </div>
            <Badge tone="purple">Normalized model</Badge>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.4fr_.8fr_.8fr_.7fr] bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 max-lg:hidden">
              <span>Project</span>
              <span>Metric</span>
              <span>Source</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-slate-200">
              {weeklyProgressRecords.map((record) => {
                const percent = getProgressPercent(record.currentValue, record.targetValue);
                return (
                  <section key={record.id} className="bg-white p-4">
                    <div className="grid gap-4 lg:grid-cols-[1.4fr_.8fr_.8fr_.7fr] lg:items-start">
                      <div>
                        <p className="font-bold">{record.project}</p>
                        <p className="mt-1 text-sm text-slate-500">{record.team} · Owner: {record.owner}</p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{record.updateText}</p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-700">{record.currentValue} / {record.targetValue}</p>
                        <p className="text-xs text-slate-500">{record.metricName}</p>
                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-orange to-purple" style={{ width: `${percent}%` }} />
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{percent}% complete</p>
                      </div>

                      <div>
                        <Badge tone={record.source === 'slack' ? 'purple' : 'orange'}>{record.source}</Badge>
                        <Link className="mt-2 block text-sm font-bold text-orange" href={record.sourceHref}>{record.sourceLabel}</Link>
                      </div>

                      <div>
                        <Badge tone={statusTone[record.status]}>{statusLabel[record.status]}</Badge>
                        <div className="mt-3 flex h-16 items-end gap-1 rounded-xl bg-slate-50 p-2" aria-label={`${record.project} weekly trend`}>
                          {record.trend.map((point, index) => (
                            <div
                              className="flex-1 rounded-t bg-purple/80"
                              key={`${record.id}-${point}-${index}`}
                              style={{ height: `${Math.max(14, (point / record.targetValue) * 54)}px` }}
                              title={`${point} ${record.metricName}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                        <p className="font-bold">Highlights</p>
                        <ul className="mt-2 list-disc space-y-1 pl-4">
                          {record.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900">
                        <p className="font-bold">Risks</p>
                        <ul className="mt-2 list-disc space-y-1 pl-4">
                          {record.risks.map((risk) => <li key={risk}>{risk}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-xl bg-purple/5 p-3 text-sm text-slate-700">
                        <p className="font-bold text-slate-900">Next actions</p>
                        <ul className="mt-2 list-disc space-y-1 pl-4">
                          {record.nextActions.map((action) => <li key={action}>{action}</li>)}
                        </ul>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-center justify-between gap-3">
              <Badge tone="red">Blockers</Badge>
              <span className="text-sm font-bold text-red-700">{summary.blockerCount} open</span>
            </div>
            <div className="mt-4 space-y-3">
              {blockerEntries.map((entry) => (
                <div key={entry.id} className="rounded-xl bg-white p-3 text-sm text-slate-700">
                  <p className="font-bold text-slate-900">{entry.project}</p>
                  <p className="mt-1">{entry.blocker}</p>
                  <Link className="mt-2 inline-block font-bold text-orange" href={entry.sourceHref}>Follow up with {entry.owner}</Link>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Badge tone="orange">Source-linked activity</Badge>
            <div className="mt-4 space-y-3">
              {weeklyProgressRecords.map((record) => (
                <div key={`${record.source}-${record.id}`} className="border-l-4 border-orange pl-3 text-sm">
                  <p className="font-bold">{record.sourceLabel} · {record.project}</p>
                  <p className="mt-1 text-slate-600">{record.updateText}</p>
                  <Link className="mt-1 inline-block font-bold text-orange" href={record.sourceHref}>Open source</Link>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-purple/30 bg-purple/5">
            <Badge tone="purple">Implementation plan</Badge>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
              <li>Schedule Slack and spreadsheet ingestion for reporting channels and weekly metric tabs.</li>
              <li>Normalize every row or message into the reusable weekly model shown in this dashboard.</li>
              <li>Run AI cleanup only on qualitative Slack updates; keep chart values sourced from spreadsheet records.</li>
              <li>Use the blocker list and source links to drive follow-up tasks from Slack or the posting queue.</li>
            </ol>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
