import NotionClone from "@/components/notion/notion-clone";
import { getWorkspaceData } from "@/lib/actions/pages";

export default async function Home() {
  const initialData = await getWorkspaceData();

  return <NotionClone initialData={initialData} />;
}
