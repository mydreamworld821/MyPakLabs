import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestItem {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
}

interface TestSelectorProps {
  tests: TestItem[];
  selectedTests: string[];
  onSelectionChange: (testIds: string[]) => void;
}

const TestSelector = ({ tests, selectedTests, onSelectionChange }: TestSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) return tests;
    const query = searchQuery.toLowerCase();
    return tests.filter((test) => test.name.toLowerCase().includes(query));
  }, [tests, searchQuery]);

  const toggleTest = (testId: string) => {
    if (selectedTests.includes(testId)) {
      onSelectionChange(selectedTests.filter((id) => id !== testId));
    } else {
      onSelectionChange([...selectedTests, testId]);
    }
  };

  const selectedTestItems = tests.filter((t) => selectedTests.includes(t.id));
  const totalOriginal = selectedTestItems.reduce((sum, t) => sum + t.originalPrice, 0);
  const totalDiscounted = selectedTestItems.reduce((sum, t) => sum + t.discountedPrice, 0);
  const totalSavings = totalOriginal - totalDiscounted;

  return (
    <div className="space-y-4">
      {/* Search - Always visible at top */}
      <div className="relative sticky top-0 z-10 bg-background pb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tests by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 text-sm"
        />
      </div>

      {/* Selection Summary - Compact */}
      {selectedTests.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShoppingCart className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-sm truncate">
                  {selectedTests.length} test(s)
                </span>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-muted-foreground line-through">
                  Rs. {totalOriginal.toLocaleString()}
                </div>
                <div className="text-base font-bold text-primary">
                  Rs. {totalDiscounted.toLocaleString()}
                </div>
              </div>
            </div>
            <Badge variant="success" className="mt-2 w-full justify-center text-xs py-1">
              Save Rs. {totalSavings.toLocaleString()}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Scrollable Test List - Simple flat list */}
      <ScrollArea className="h-[350px] sm:h-[400px] rounded-lg border border-border">
        <div className="divide-y divide-border">
          {filteredTests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No tests found matching "{searchQuery}"</p>
            </div>
          ) : (
            filteredTests.map((test) => {
              const isSelected = selectedTests.includes(test.id);
              return (
                <div
                  key={test.id}
                  className={cn(
                    "p-3 transition-colors cursor-pointer",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                  )}
                  onClick={() => toggleTest(test.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTest(test.id)}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight">
                          {test.name}
                        </h4>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] sm:text-xs text-muted-foreground line-through">
                            Rs. {test.originalPrice.toLocaleString()}
                          </div>
                          <div className="font-bold text-sm text-primary">
                            Rs. {test.discountedPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Total tests info */}
      <p className="text-xs text-muted-foreground text-center">
        Showing {filteredTests.length} of {tests.length} tests
      </p>
    </div>
  );
};

export default TestSelector;
