import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { labs, tests, labTests } from "@/data/mockData";
import {
  BarChart3,
  ArrowUpDown,
  TrendingDown,
  CheckCircle,
  Building2,
  FlaskConical,
} from "lucide-react";

const Compare = () => {
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"price" | "discount">("price");

  const toggleLab = (labId: string) => {
    if (selectedLabs.includes(labId)) {
      setSelectedLabs(selectedLabs.filter((id) => id !== labId));
    } else if (selectedLabs.length < 10) {
      setSelectedLabs([...selectedLabs, labId]);
    }
  };

  const toggleTest = (testId: string) => {
    if (selectedTests.includes(testId)) {
      setSelectedTests(selectedTests.filter((id) => id !== testId));
    } else {
      setSelectedTests([...selectedTests, testId]);
    }
  };

  const comparisonData = useMemo(() => {
    if (selectedLabs.length === 0 || selectedTests.length === 0) return [];

    return selectedLabs.map((labId) => {
      const lab = labs.find((l) => l.id === labId)!;
      const testsData = selectedTests.map((testId) => {
        const labTest = labTests.find(
          (lt) => lt.labId === labId && lt.testId === testId
        );
        const test = tests.find((t) => t.id === testId)!;
        if (!labTest) return { test, originalPrice: null, discountedPrice: null };
        const discountedPrice = Math.round(
          labTest.originalPrice * (1 - lab.discount / 100)
        );
        return {
          test,
          originalPrice: labTest.originalPrice,
          discountedPrice,
        };
      });

      const totalOriginal = testsData.reduce(
        (sum, t) => sum + (t.originalPrice || 0),
        0
      );
      const totalDiscounted = testsData.reduce(
        (sum, t) => sum + (t.discountedPrice || 0),
        0
      );

      return {
        lab,
        tests: testsData,
        totalOriginal,
        totalDiscounted,
        savings: totalOriginal - totalDiscounted,
      };
    });
  }, [selectedLabs, selectedTests]);

  const sortedData = useMemo(() => {
    return [...comparisonData].sort((a, b) => {
      if (sortBy === "price") {
        return a.totalDiscounted - b.totalDiscounted;
      }
      return b.lab.discount - a.lab.discount;
    });
  }, [comparisonData, sortBy]);

  const bestValue =
    sortedData.length > 0 ? sortedData[0].lab.id : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="pt-24 pb-8 md:pt-28 md:pb-12 gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <div className="max-w-2xl">
            <Badge className="bg-primary-foreground/10 text-primary-foreground border-0 mb-4">
              <BarChart3 className="w-3 h-3 mr-1" />
              Price Comparison Tool
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
              Compare Lab Prices
            </h1>
            <p className="text-primary-foreground/80">
              Select up to 10 labs and any number of tests to compare prices and find the best deals
            </p>
          </div>
        </div>
      </section>

      {/* Selection */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Select Labs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Select Labs (up to 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {labs.map((lab) => (
                    <div
                      key={lab.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedLabs.includes(lab.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleLab(lab.id)}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={selectedLabs.includes(lab.id)}
                          onCheckedChange={() => toggleLab(lab.id)}
                          disabled={
                            !selectedLabs.includes(lab.id) &&
                            selectedLabs.length >= 10
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {lab.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="discount" className="text-xs">
                              {lab.discount}% off
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {lab.city}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Select Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-primary" />
                  Select Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                  {tests.map((test) => (
                    <div
                      key={test.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTests.includes(test.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleTest(test.id)}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={selectedTests.includes(test.id)}
                          onCheckedChange={() => toggleTest(test.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{test.name}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {test.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Results */}
          {selectedLabs.length > 0 && selectedTests.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle>Price Comparison</CardTitle>
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as "price" | "discount")}
                  >
                    <SelectTrigger className="w-48">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Sort by Price</SelectItem>
                      <SelectItem value="discount">Sort by Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Lab</TableHead>
                        {selectedTests.map((testId) => {
                          const test = tests.find((t) => t.id === testId);
                          return (
                            <TableHead key={testId} className="text-center">
                              <div className="text-xs">{test?.name}</div>
                            </TableHead>
                          );
                        })}
                        <TableHead className="text-right">Original</TableHead>
                        <TableHead className="text-right">Discounted</TableHead>
                        <TableHead className="text-right">Savings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedData.map((data, index) => (
                        <TableRow
                          key={data.lab.id}
                          className={
                            data.lab.id === bestValue ? "bg-primary/5" : ""
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {data.lab.id === bestValue && (
                                <Badge variant="success" className="shrink-0">
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                  Best
                                </Badge>
                              )}
                              <div>
                                <p className="font-medium">{data.lab.name}</p>
                                <Badge variant="discount" className="text-xs">
                                  {data.lab.discount}% off
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          {data.tests.map((testData, i) => (
                            <TableCell key={i} className="text-center">
                              {testData.discountedPrice ? (
                                <div>
                                  <div className="text-xs text-muted-foreground line-through">
                                    Rs. {testData.originalPrice?.toLocaleString()}
                                  </div>
                                  <div className="font-medium">
                                    Rs. {testData.discountedPrice.toLocaleString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  N/A
                                </span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-right text-muted-foreground line-through">
                            Rs. {data.totalOriginal.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            Rs. {data.totalDiscounted.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="success">
                              Rs. {data.savings.toLocaleString()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Select Labs and Tests to Compare
                </h3>
                <p className="text-muted-foreground">
                  Choose at least one lab and one test from above to see the
                  price comparison
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Compare;
