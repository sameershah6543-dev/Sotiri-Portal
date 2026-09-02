import { getPageData } from "@/lib/page-data";
import { CampaignsTable } from "@/components/CampaignsTable";

export default async function CampaignsPage() {
  const data = await getPageData();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold">Campaigns</h2>
      <CampaignsTable rows={data.campaigns} />
    </div>
  );
}
