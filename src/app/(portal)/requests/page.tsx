import { auth } from "@/auth";
import { getPageData } from "@/lib/page-data";
import { RequestsTable } from "@/components/RequestsTable";
import { RequestForm } from "@/components/RequestForm";

export default async function RequestsPage() {
  const [data, session] = await Promise.all([getPageData(), auth()]);
  const isTeam = session?.user?.role === "team";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Requests</h2>
          <p className="text-sm text-muted">
            Need a domain added, removed, or anything else? File it here — the team gets notified right away.
          </p>
        </div>
        <RequestForm />
      </div>
      <RequestsTable rows={data.requests} isTeam={isTeam} />
    </div>
  );
}
