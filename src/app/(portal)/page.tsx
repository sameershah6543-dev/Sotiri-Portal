import { getPageData } from "@/lib/page-data";
import { buildAttentionList, buildGaugeCounts } from "@/lib/derive";
import { GaugeStrip } from "@/components/GaugeStrip";
import { AttentionRail } from "@/components/AttentionRail";

export default async function OverviewPage() {
  const data = await getPageData();
  const counts = buildGaugeCounts(data.campaigns, data.domains, data.unusedProfiles.length);
  const attention = buildAttentionList(data.campaigns, data.domains);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <GaugeStrip counts={counts} />
        {data.lastRefreshed && (
          <p className="text-xs text-muted mt-2">
            Platform data last refreshed {new Date(data.lastRefreshed).toLocaleString()}
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <AttentionRail items={attention} />

        <div className="flex-1 rounded-lg border border-line bg-surface p-5">
          <h2 className="font-display text-lg font-semibold mb-3">Account</h2>
          {data.accountInfo ? (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-muted text-xs">Billing period</dt>
                <dd className="font-mono">
                  {data.accountInfo.billingPeriodStart} – {data.accountInfo.billingPeriodEnd}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Package size</dt>
                <dd className="font-mono">{data.accountInfo.packageSize.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Sent this cycle</dt>
                <dd className="font-mono">{data.accountInfo.sentThisCycle.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Total IPs</dt>
                <dd className="font-mono">{data.accountInfo.totalIps}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Complaints</dt>
                <dd className="font-mono">{data.accountInfo.complaints}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">No account info yet — waiting on the first refresh.</p>
          )}
        </div>
      </div>
    </div>
  );
}
