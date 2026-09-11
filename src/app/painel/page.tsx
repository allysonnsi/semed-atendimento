import { listLastCalls, getSector } from "@/lib/db/store";
import { PanelClient } from "./PanelClient";

export default function PainelPage() {
  const initialLastCalls = listLastCalls(8).map((c) => ({
    ...c,
    sectorName: getSector(c.sectorId)?.name ?? "",
  }));
  return <PanelClient initialLastCalls={initialLastCalls} />;
}
