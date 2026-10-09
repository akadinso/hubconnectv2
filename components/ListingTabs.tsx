import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarouselComponent } from "./CarouselComponent";
import type { Listing } from "@/types/listing";

type ListingTabsProps = {
  tabs: { value: string; label: string; listings: Listing[] }[];
};

export function ListingTabs({ tabs }: ListingTabsProps) {
  return (
    <Tabs
      defaultValue={tabs[0]?.value}
      orientation="horizontal"
      className="flex w-full min-w-0 flex-col gap-4"
    >
      <TabsList className="h-auto w-fit gap-6 rounded-none bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2 shadow-none data-active:border-foreground data-active:bg-transparent data-active:shadow-none"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="w-full min-w-0"
        >
          <CarouselComponent listings={tab.listings} variant="large" />
        </TabsContent>
      ))}
    </Tabs>
  );
}
