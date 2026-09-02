import { auth } from "@/auth";
import { getPageData } from "@/lib/page-data";
import { ReplacementsTable } from "@/components/ReplacementsTable";
import { ReplacementForm } from "@/components/ReplacementForm";

export default async function ReplacementsPage() {
  const [data, session] = await Promise.all([getPageData(), auth()]);
  const isTeam = session?.user?.role === "team";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-xl font-semibold">Replacement log</h2>
        {isTeam && <ReplacementForm />}
      </div>
      <ReplacementsTable rows={data.replacements} />
    </div>
  );
}
