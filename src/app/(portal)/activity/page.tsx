import { getPageData } from "@/lib/page-data";
import { ActivityTable } from "@/components/ActivityTable";

export default async function ActivityPage() {
  const data = await getPageData();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold">Activity</h2>
      <ActivityTable rows={data.notes} />
    </div>
  );
}
