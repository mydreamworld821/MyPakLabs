import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { format, subDays, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";

interface TrendData {
  period: string;
  surgeryInquiries: number;
  emergencyRequests: number;
  nurseBookings: number;
}

const chartConfig = {
  surgeryInquiries: {
    label: "Surgery Inquiries",
    color: "hsl(var(--medical-orange))",
  },
  emergencyRequests: {
    label: "Emergency Requests",
    color: "hsl(var(--destructive))",
  },
  nurseBookings: {
    label: "Nurse Bookings",
    color: "hsl(var(--medical-green))",
  },
};

type TimeRange = "weekly" | "monthly";

const InquiryTrendsChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, [timeRange]);

  const fetchTrendData = async () => {
    setIsLoading(true);
    try {
      let dateRanges: { start: Date; end: Date; label: string }[] = [];
      
      if (timeRange === "weekly") {
        // Last 8 weeks
        const intervals = eachWeekOfInterval({
          start: subWeeks(new Date(), 7),
          end: new Date(),
        });
        
        dateRanges = intervals.map((weekStart) => ({
          start: startOfWeek(weekStart, { weekStartsOn: 1 }),
          end: endOfWeek(weekStart, { weekStartsOn: 1 }),
          label: format(weekStart, "MMM d"),
        }));
      } else {
        // Last 6 months
        const intervals = eachMonthOfInterval({
          start: subMonths(new Date(), 5),
          end: new Date(),
        });
        
        dateRanges = intervals.map((monthStart) => ({
          start: startOfMonth(monthStart),
          end: endOfMonth(monthStart),
          label: format(monthStart, "MMM yyyy"),
        }));
      }

      // Fetch all data in parallel
      const [surgeryData, emergencyData, nurseData] = await Promise.all([
        supabase
          .from("surgery_inquiries")
          .select("created_at")
          .gte("created_at", dateRanges[0].start.toISOString())
          .lte("created_at", new Date().toISOString()),
        supabase
          .from("emergency_nursing_requests")
          .select("created_at")
          .gte("created_at", dateRanges[0].start.toISOString())
          .lte("created_at", new Date().toISOString()),
        supabase
          .from("nurse_bookings")
          .select("created_at")
          .gte("created_at", dateRanges[0].start.toISOString())
          .lte("created_at", new Date().toISOString()),
      ]);

      // Group data by period
      const data: TrendData[] = dateRanges.map(({ start, end, label }) => {
        const surgeryCount = surgeryData.data?.filter((item) => {
          const date = new Date(item.created_at);
          return date >= start && date <= end;
        }).length || 0;

        const emergencyCount = emergencyData.data?.filter((item) => {
          const date = new Date(item.created_at);
          return date >= start && date <= end;
        }).length || 0;

        const nurseCount = nurseData.data?.filter((item) => {
          const date = new Date(item.created_at);
          return date >= start && date <= end;
        }).length || 0;

        return {
          period: label,
          surgeryInquiries: surgeryCount,
          emergencyRequests: emergencyCount,
          nurseBookings: nurseCount,
        };
      });

      setTrendData(data);
    } catch (error) {
      console.error("Error fetching trend data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inquiry Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Inquiry Trends</CardTitle>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <TabsList className="h-8">
            <TabsTrigger value="weekly" className="text-xs px-3">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs px-3">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="surgeryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--medical-orange))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--medical-orange))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="emergencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="nurseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--medical-green))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--medical-green))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="surgeryInquiries"
              stroke="hsl(var(--medical-orange))"
              strokeWidth={2}
              fill="url(#surgeryGradient)"
            />
            <Area
              type="monotone"
              dataKey="emergencyRequests"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              fill="url(#emergencyGradient)"
            />
            <Area
              type="monotone"
              dataKey="nurseBookings"
              stroke="hsl(var(--medical-green))"
              strokeWidth={2}
              fill="url(#nurseGradient)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default InquiryTrendsChart;
