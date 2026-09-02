import { auth } from "@/auth";
import { getPageData } from "@/lib/page-data";
import { DomainsTable } from "@/components/DomainsTable";

export default async function DomainsPage() {
  const [data, session] = await Promise.all([getPageData(), auth()]);
  const isTeam = session?.user?.role === "team";

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold">Domains &amp; profiles</h2>
      <DomainsTable rows={data.domains} isTeam={isTeam} />
    </div>
  );
}
