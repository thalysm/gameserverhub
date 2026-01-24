import { LayoutProvider } from "@/components/layout-context";
import { CategoriesContent } from "@/components/categories-content";
import { getGamesGroupedByCategory } from "@/actions/game-actions";

export default async function CategoriasPage() {
  const categories = await getGamesGroupedByCategory();

  return (
    <LayoutProvider>
      <CategoriesContent categories={categories} />
    </LayoutProvider>
  );
}
