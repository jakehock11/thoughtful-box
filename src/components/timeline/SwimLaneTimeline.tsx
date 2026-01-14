import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  differenceInDays,
  subMonths,
  subYears,
  format,
  startOfMonth,
  eachMonthOfInterval,
  eachWeekOfInterval,
  startOfQuarter,
  eachQuarterOfInterval,
} from "date-fns";
import {
  AlertCircle,
  Lightbulb,
  FlaskConical,
  CheckCircle,
  Package,
  MessageSquare,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Entity, EntityType } from "@/lib/types";

// Types
type TimelineEntityType =
  | "problem"
  | "hypothesis"
  | "experiment"
  | "decision"
  | "feature"
  | "feedback"
  | "feature_request";

interface TimelineItem {
  id: string;
  type: TimelineEntityType;
  title: string;
  status: string;
  createdAt: string;
  personaIds: string[];
  featureIds: string[];
  dimensionValueIds: string[];
}

type TimeRangeKey = "1M" | "3M" | "6M" | "1Y" | "3Y" | "all";

interface SwimLaneTimelineProps {
  productId: string;
  entities: Entity[];
  taxonomy: {
    personas: { id: string; name: string }[];
    features: { id: string; name: string }[];
    dimensions: { id: string; name: string; values: { id: string; name: string }[] }[];
  };
}

// Config
const SWIMLANE_CONFIG: Record<TimelineEntityType, {
  icon: React.ElementType;
  label: string;
  fillColor: string;
  strokeColor: string;
}> = {
  problem: { icon: AlertCircle, label: "Problems", fillColor: "fill-red-500", strokeColor: "stroke-red-500" },
  hypothesis: { icon: Lightbulb, label: "Hypotheses", fillColor: "fill-yellow-500", strokeColor: "stroke-yellow-500" },
  experiment: { icon: FlaskConical, label: "Experiments", fillColor: "fill-blue-500", strokeColor: "stroke-blue-500" },
  decision: { icon: CheckCircle, label: "Decisions", fillColor: "fill-green-500", strokeColor: "stroke-green-500" },
  feature: { icon: Package, label: "Features", fillColor: "fill-indigo-500", strokeColor: "stroke-indigo-500" },
  feedback: { icon: MessageSquare, label: "Feedback", fillColor: "fill-sky-400", strokeColor: "stroke-sky-400" },
  feature_request: { icon: Sparkles, label: "Requests", fillColor: "fill-purple-400", strokeColor: "stroke-purple-400" },
};

const COMPLETED_STATUSES = [
  "solved", "validated", "invalidated", "complete", "shipped",
  "stable", "archived", "actioned", "declined", "deprecated"
];

const TIME_RANGES: TimeRangeKey[] = ["1M", "3M", "6M", "1Y", "3Y", "all"];

const SWIMLANE_ORDER: TimelineEntityType[] = [
  "problem", "hypothesis", "experiment", "decision", "feature", "feedback", "feature_request"
];

// Entity type to route path mapping
const TYPE_TO_PATH: Record<TimelineEntityType, string> = {
  problem: "problems",
  hypothesis: "hypotheses",
  experiment: "experiments",
  decision: "decisions",
  feature: "features",
  feedback: "feedback",
  feature_request: "feature-requests",
};

// Helpers
const isCompleted = (status: string): boolean => {
  return COMPLETED_STATUSES.includes(status.toLowerCase());
};

// Multi-select dropdown component
const MultiSelectDropdown: React.FC<{
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  dimensionName: string;
}> = ({ options, selected, onChange, dimensionName }) => {
  const [open, setOpen] = useState(false);

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const getTriggerText = () => {
    if (selected.length === 0) return `All ${dimensionName}`;
    const selectedNames = selected
      .map(id => options.find(o => o.id === id)?.name)
      .filter(Boolean) as string[];
    if (selectedNames.length === 1) return selectedNames[0];
    if (selectedNames.length <= 3) return selectedNames.join(", ");
    return `${selectedNames[0]}, ${selectedNames[1]} +${selectedNames.length - 2} more`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs justify-between min-w-[120px]"
        >
          {getTriggerText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search...`} className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => toggleOption(option.id)}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selected.includes(option.id) ? "bg-primary text-primary-foreground" : "opacity-50"
                  )}>
                    {selected.includes(option.id) && <Check className="h-3 w-3" />}
                  </div>
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Main component
export const SwimLaneTimeline: React.FC<SwimLaneTimelineProps> = ({
  productId,
  entities,
  taxonomy,
}) => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("6M");
  const [visibleTypes, setVisibleTypes] = useState<TimelineEntityType[]>([...SWIMLANE_ORDER]);
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const updateFilter = (key: string, selected: string[]) => {
    setFilters(prev => ({ ...prev, [key]: selected }));
  };

  const today = new Date();

  // Convert entities to timeline items (filter out captures and artifacts)
  const timelineData: TimelineItem[] = useMemo(() => {
    return entities
      .filter((e): e is Entity & { type: TimelineEntityType } =>
        SWIMLANE_ORDER.includes(e.type as TimelineEntityType)
      )
      .map((e) => ({
        id: e.id,
        type: e.type as TimelineEntityType,
        title: e.title,
        status: e.status || "",
        createdAt: e.createdAt,
        personaIds: e.personaIds || [],
        featureIds: e.featureIds || [],
        dimensionValueIds: e.dimensionValueIds || [],
      }));
  }, [entities]);

  // Calculate time range start based on data
  const getTimeRangeStart = (range: TimeRangeKey): Date => {
    const now = new Date();
    switch (range) {
      case "1M": return subMonths(now, 1);
      case "3M": return subMonths(now, 3);
      case "6M": return subMonths(now, 6);
      case "1Y": return subYears(now, 1);
      case "3Y": return subYears(now, 3);
      case "all": {
        if (timelineData.length === 0) return subMonths(now, 6);
        return new Date(Math.min(...timelineData.map(d => new Date(d.createdAt).getTime())));
      }
    }
  };

  const timeRangeStart = useMemo(() => getTimeRangeStart(timeRange), [timeRange, timelineData]);
  const totalDays = useMemo(() => Math.max(1, differenceInDays(today, timeRangeStart)), [timeRangeStart]);

  // Filter items by visible types, date range, and taxonomy filters
  const filteredItems = useMemo(() => {
    return timelineData.filter(item => {
      const itemDate = new Date(item.createdAt);
      const inDateRange = itemDate >= timeRangeStart && itemDate <= today;
      const typeVisible = visibleTypes.includes(item.type);

      // Persona filter
      const personaFilter = filters['personas'] || [];
      const personaMatch = personaFilter.length === 0 ||
        personaFilter.some(pid => item.personaIds.includes(pid));

      // Feature filter
      const featureFilter = filters['features'] || [];
      const featureMatch = featureFilter.length === 0 ||
        featureFilter.some(fid => item.featureIds.includes(fid));

      // Custom dimension filters
      const dimensionMatch = taxonomy.dimensions.every(dim => {
        const dimFilter = filters[dim.id] || [];
        if (dimFilter.length === 0) return true;
        return dimFilter.some(vid => item.dimensionValueIds.includes(vid));
      });

      return inDateRange && typeVisible && personaMatch && featureMatch && dimensionMatch;
    });
  }, [timelineData, visibleTypes, timeRangeStart, filters, taxonomy.dimensions]);

  // Group items by type
  const swimlanes = useMemo(() => {
    const groups: Record<TimelineEntityType, TimelineItem[]> = {
      problem: [], hypothesis: [], experiment: [], decision: [],
      feature: [], feedback: [], feature_request: [],
    };
    filteredItems.forEach(item => {
      groups[item.type].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Calculate grid lines based on time range
  const gridLines = useMemo(() => {
    const interval = { start: timeRangeStart, end: today };

    if (timeRange === "1M" || timeRange === "3M") {
      return eachWeekOfInterval(interval).map(date => ({
        date,
        label: format(date, "MMM d"),
      }));
    } else if (timeRange === "6M" || timeRange === "1Y") {
      return eachMonthOfInterval(interval).map(date => ({
        date: startOfMonth(date),
        label: format(date, "MMM"),
      }));
    } else {
      return eachQuarterOfInterval(interval).map(date => ({
        date: startOfQuarter(date),
        label: format(date, "QQQ yyyy"),
      }));
    }
  }, [timeRange, timeRangeStart]);

  const getXPercent = (date: Date): number => {
    const days = differenceInDays(date, timeRangeStart);
    return Math.max(0, Math.min(100, (days / totalDays) * 100));
  };

  const toggleType = (type: TimelineEntityType) => {
    if (visibleTypes.includes(type)) {
      setVisibleTypes(visibleTypes.filter(t => t !== type));
    } else {
      setVisibleTypes([...visibleTypes, type]);
    }
  };

  const handleNodeClick = (item: TimelineItem) => {
    const path = TYPE_TO_PATH[item.type];
    navigate(`/product/${productId}/${path}/${item.id}`);
  };

  const visibleSwimlanes = SWIMLANE_ORDER.filter(type => visibleTypes.includes(type));

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col h-full bg-background rounded-lg border border-border">
        {/* Header with filters and time range */}
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <MultiSelectDropdown
              options={taxonomy.personas}
              selected={filters['personas'] || []}
              onChange={(sel) => updateFilter('personas', sel)}
              dimensionName="Personas"
            />
            <MultiSelectDropdown
              options={taxonomy.features}
              selected={filters['features'] || []}
              onChange={(sel) => updateFilter('features', sel)}
              dimensionName="Feature Areas"
            />
            {taxonomy.dimensions.map(dim => (
              <MultiSelectDropdown
                key={dim.id}
                options={dim.values}
                selected={filters[dim.id] || []}
                onChange={(sel) => updateFilter(dim.id, sel)}
                dimensionName={dim.name}
              />
            ))}
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-1.5 flex-wrap">
              {SWIMLANE_ORDER.map(type => {
                const config = SWIMLANE_CONFIG[type];
                const Icon = config.icon;
                const isActive = visibleTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Checkbox
                      checked={isActive}
                      className="h-3.5 w-3.5 pointer-events-none"
                    />
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time range controls */}
          <div className="flex items-center gap-1 shrink-0">
            {TIME_RANGES.map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setTimeRange(range)}
              >
                {range === "all" ? "All" : range}
              </Button>
            ))}
          </div>
        </div>

        {/* Timeline area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="min-w-[600px] h-full flex flex-col">
            {/* Swimlanes */}
            <div className="flex-1 relative">
              {/* Grid lines */}
              {gridLines.map((line, i) => {
                const xPercent = getXPercent(line.date);
                return (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-border/30"
                    style={{ left: `calc(100px + ${xPercent}% * (100% - 100px) / 100)` }}
                  />
                );
              })}

              {/* Today marker */}
              <div
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-primary/50 z-10"
                style={{ left: `calc(100px + ${getXPercent(today)}% * (100% - 100px) / 100)` }}
              >
                <span className="absolute -top-0 left-1 text-[10px] font-medium text-primary bg-background px-1">
                  Today
                </span>
              </div>

              {/* Swimlane rows */}
              {visibleSwimlanes.map((type, rowIndex) => {
                const config = SWIMLANE_CONFIG[type];
                const Icon = config.icon;
                const items = swimlanes[type];

                return (
                  <div
                    key={type}
                    className={cn(
                      "flex items-center h-12 relative",
                      rowIndex !== visibleSwimlanes.length - 1 && "border-b border-border/50"
                    )}
                  >
                    {/* Row label */}
                    <div className="w-[100px] shrink-0 flex items-center gap-2 px-3 sticky left-0 bg-background z-20">
                      <Icon className={cn("h-4 w-4", config.strokeColor.replace("stroke-", "text-"))} />
                      <span className="text-xs font-medium text-muted-foreground truncate">
                        {config.label}
                      </span>
                    </div>

                    {/* Items area */}
                    <div className="flex-1 relative h-full">
                      {items.map((item) => {
                        const xPercent = getXPercent(new Date(item.createdAt));
                        const filled = isCompleted(item.status);

                        return (
                          <Tooltip key={item.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleNodeClick(item)}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
                                style={{ left: `${xPercent}%` }}
                              >
                                <svg width="14" height="14" viewBox="0 0 14 14">
                                  <circle
                                    cx="7"
                                    cy="7"
                                    r="5"
                                    className={cn(
                                      "transition-colors",
                                      filled
                                        ? config.fillColor
                                        : "fill-transparent",
                                      config.strokeColor,
                                      "stroke-2"
                                    )}
                                  />
                                </svg>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium text-sm leading-tight">{item.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{format(new Date(item.createdAt), "MMM d, yyyy")}</span>
                                  {item.status && (
                                    <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
                                      {item.status}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time axis */}
            <div className="h-8 border-t border-border flex items-center relative shrink-0">
              <div className="w-[100px] shrink-0" />
              <div className="flex-1 relative">
                {gridLines.map((line, i) => {
                  const xPercent = getXPercent(line.date);
                  return (
                    <span
                      key={i}
                      className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                      style={{ left: `${xPercent}%` }}
                    >
                      {line.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 py-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="4" className="fill-transparent stroke-muted-foreground stroke-2" />
            </svg>
            <span>Active / In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="4" className="fill-muted-foreground stroke-muted-foreground stroke-2" />
            </svg>
            <span>Complete / Resolved</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SwimLaneTimeline;
