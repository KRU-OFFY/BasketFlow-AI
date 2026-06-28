import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, Card } from '@/components/ui/card';
import {
  getProgressPercent,
  getWeeklyProgressSummary,
  reportingWeekStartDate,
  weeklyProgressRecords,
  type WeeklyProgressRecord,
  type WeeklyProgressStatus,
} from '@/lib/mock-data';

const statusTone: Record<WeeklyProgressStatus, 'green' | 'orange' | 'red'> = {
  on_track: 'green',
  at_risk: 'orange',
  blocked: 'red',
};

const statusLabel: Record<WeeklyProgressStatus, string> = {
  on_track: 'On track',
  at_risk: 'At risk',
  blocked: 'Blocked',
};

function TrendBars({ record }: { record: WeeklyProgressRecord }) {
  const maxValue = Math.max(...record.trend, record.targetValue, 1);

  return (
    <div className="flex h-16 items-end gap-1" aria-label={`${record.project} trend`}>
      {record.trend.map((value, index) => (
        <div
          className="w-full rounded-t bg-orange/70"
          key={`${record.id}-${value}-${index}`}
          title={`${value} ${record.metricName}`}
          style={{ height: `${Math.max((value / maxValue) * 100, 8)}%` }}
        />
      ))}
    </div>
  );
}

export default function Analytics() {
  const summary = getWeeklyProgressSummary();
  const stats = [
    ['Total progress', `${summary.totalCurrentValue}/${summary.totalTargetValue}`],
    ['Target attainment', `${summary.targetProgressPercent}%`],
    ['On-track projects', `${summary.onTrackCount}/${weeklyProgressRecords.length}`],
    ['Open blockers', String(summary.blockerCount)],
  ];

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-orange">Weekly progress report</p>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="mt-2 text-slate-500">
            Consolidated Slack and spreadsheet updates for the week of {reportingWeekStartDate}.
          </p>
        </div>
        <Badge tone="purple">
          {summary.slackRecordCount} Slack · {summary.spreadsheetRecordCount} Sheet
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {weeklyProgressRecords.map((record) => {
          const percent = getProgressPercent(record.currentValue, record.targetValue);

          return (
            <Card key={record.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{record.team}</p>
                  <h2 className="mt-1 text-lg font-bold">{record.project}</h2>
                </div>
                <Badge tone={statusTone[record.status]}>{statusLabel[record.status]}</Badge>
              </div>

              <div>
                <div className="flex items-end justify-between gap-3">
                  <p className="text-sm text-slate-500">{record.metricName}</p>
                  <p className="font-bold">
                    {record.currentValue}/{record.targetValue}
                  </p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-orange" style={{ width: `${percent}%` }} />
                </div>
              </div>

              <TrendBars record={record} />

              <p className="text-sm leading-6 text-slate-600">{record.updateText}</p>

              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-slate-700">Next action</p>
                <p className="mt-1 text-slate-600">{record.nextActions[0]}</p>
              </div>

              {record.blockers.length > 0 && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-semibold">Blockers</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {record.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-500">Owner: {record.owner}</span>
                <Link className="font-bold text-orange" href={record.sourceHref}>
                  {record.sourceLabel}
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
