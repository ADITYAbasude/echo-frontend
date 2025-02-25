import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { gql, useQuery } from "@apollo/client";
import useAuthToken from "../../hooks/useAuthToken";
import Cookies from "js-cookie";

const GET_BROADCAST_ANALYTICS = gql`
  query GetBroadcastAnalytics {
    getAnalyticsOfBroadcast {
      broadcastEngagement {
        views
        date
      }
      location {
        country
        views
      }
      deviceAnalytics {
        date
        desktop
        mobile
      }
      message
      status
    }
  }
`;

const AnalyticsStudio = () => {
  const token = useAuthToken();

  const { data = { getAnalyticsOfBroadcast: { 
    broadcastEngagement: [], 
    location: [], 
    deviceAnalytics: [] 
  } } } = useQuery(GET_BROADCAST_ANALYTICS, {
    context: {
      headers: {
        authorization: `Bearer ${token}`,
        token: `Bearer ${Cookies.get("broadcastToken")}`,
      },
    },
    onCompleted: (data) => {
      console.log(data);
    },
    skip: !token,
    fetchPolicy: "network-only",
  });

  const chartDataForMultiLine = (data?.getAnalyticsOfBroadcast?.deviceAnalytics || []).map(item => ({
    month: new Date(item?.date || Date.now()).toLocaleDateString('en-US', { month: 'long' }),
    desktop: item?.desktop || 0,
    mobile: item?.mobile || 0
  }));

  const chartConfig = {
    views: {
      label: "Page Views",
    },
    desktop: {
      label: "Desktop",
      color: "#2eb88a",
    },
    mobile: {
      label: "Mobile",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="max-w-full mx-auto">
        <div className="relative">
          {/* Under Construction Overlay */}
          {/* <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/50 flex flex-col items-center justify-center rounded-lg overflow-hidden p-4">
            <div className="bg-[var(--card-background)] p-4 sm:p-8 rounded-lg border border-white/5 text-center w-full max-w-md mx-auto">
              <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20 absolute top-0 left-0"></div>
              <Construction className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white/90 mb-2">
                Analytics Coming Soon
              </h2>
              <p className="text-white/60">
                We're building powerful analytics tools to help you understand
                your audience better.
              </p>
            </div>
          </div> */}

          {/* Existing Analytics Content */}
          <div className="space-y-4">
            <Card className="bg-[var(--card-background)] shadow-none border border-white/5">
              <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
              <CardHeader>
                <CardTitle>Broadcast engagement</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 md:p-6 overflow-x-auto">
                <div className="min-w-[600px] sm:min-w-0">
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                  >
                    <LineChart
                      accessibilityLayer
                      data={data?.getAnalyticsOfBroadcast?.broadcastEngagement || []}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={32}
                        className="text-white"
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          });
                        }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="w-[150px]"
                            nameKey="views"
                            labelFormatter={(value) => {
                              return new Date(value).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              );
                            }}
                          />
                        }
                      />
                      <Line
                        dataKey="views"
                        type="monotone"
                        stroke="var(--color-desktop)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="bg-[var(--card-background)] shadow-none border border-white/5">
                <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
                <CardContent>
                  <ChartContainer
                    config={{
                      desktop: {
                        label: "Desktop",
                        color: "hsl(var(--chart-1))",
                      },
                      mobile: {
                        label: "Mobile",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                  >
                    <AreaChart
                      accessibilityLayer
                      data={chartDataForMultiLine}
                      margin={{
                        left: 12,
                        right: 12,
                      }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.slice(0, 3)}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <defs>
                        <linearGradient
                          id="fillDesktop"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-desktop)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-desktop)"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="fillMobile"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-mobile)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-mobile)"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        dataKey="mobile"
                        type="natural"
                        fill="url(#fillMobile)"
                        fillOpacity={0.4}
                        stroke="var(--color-mobile)"
                        stackId="a"
                      />
                      <Area
                        dataKey="desktop"
                        type="natural"
                        fill="url(#fillDesktop)"
                        fillOpacity={0.4}
                        stroke="var(--color-desktop)"
                        stackId="a"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="bg-[var(--card-background)] shadow-none border border-white/5">
                <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
                <CardHeader className="items-center pb-0">
                  <CardTitle>Top 10 Countries by Views</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                  <ChartContainer
                    config={{
                      views: {
                        label: "Views",
                      }
                    }}
                    className="mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            className="w-[150px]"
                            nameKey="country"
                            valueKey="views"
                          />
                        }
                      />
                      <Pie
                        data={(data?.getAnalyticsOfBroadcast?.location || []).map((loc, index) => ({
                          country: loc?.country || 'Unknown',
                          views: loc?.views || 0,
                          fill: `hsl(${index * 36}, 70%, 50%)`
                        }))}
                        dataKey="views"
                        nameKey="country"
                        label={({ country, views }) => `${country} (${views})`}
                      />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsStudio;
