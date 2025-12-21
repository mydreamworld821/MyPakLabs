import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Minus, ShoppingCart } from "lucide-react";

interface TestItem {
  id: string;
  name: string;
  category: string;
  description: string;
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

  const filteredTests = tests.filter(
    (test) =>
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const categories = [...new Set(tests.map((t) => t.category))];

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search tests by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {/* Selection Summary */}
      {selectedTests.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <span className="font-semibold">{selectedTests.length} test(s) selected</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground line-through">
                  Rs. {totalOriginal.toLocaleString()}
                </div>
                <div className="text-xl font-bold text-primary">
                  Rs. {totalDiscounted.toLocaleString()}
                </div>
                <Badge variant="success" className="mt-1">
                  Save Rs. {totalSavings.toLocaleString()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tests by Category */}
      <div className="space-y-4">
        {categories.map((category) => {
          const categoryTests = filteredTests.filter((t) => t.category === category);
          if (categoryTests.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge variant="lab">{category}</Badge>
                  <span className="text-muted-foreground text-sm font-normal">
                    ({categoryTests.length} tests)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categoryTests.map((test) => {
                  const isSelected = selectedTests.includes(test.id);
                  return (
                    <div
                      key={test.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                      onClick={() => toggleTest(test.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleTest(test.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-sm">{test.name}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {test.description}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs text-muted-foreground line-through">
                                Rs. {test.originalPrice.toLocaleString()}
                              </div>
                              <div className="font-bold text-primary">
                                Rs. {test.discountedPrice.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tests found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};

export default TestSelector;
