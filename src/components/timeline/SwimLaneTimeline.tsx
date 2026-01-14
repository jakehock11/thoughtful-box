import { useMemo, useState } from "react";
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
}

type TimeRangeKey = "1M" | "3M" | "6M" | "1Y" | "3Y" | "all";

// Mock data
const MOCK_TIMELINE_DATA: TimelineItem[] = [
  // Problems
  { id: "p1", type: "problem", title: "User onboarding drop-off at step 3", status: "solved", createdAt: "2025-07-15" },
  { id: "p2", type: "problem", title: "Checkout friction causing cart abandonment", status: "active", createdAt: "2025-10-20" },
  { id: "p3", type: "problem", title: "Mobile performance issues on older devices", status: "exploring", createdAt: "2025-12-05" },
  
  // Hypotheses
  { id: "h1", type: "hypothesis", title: "Simpler signup increases conversion by 15%", status: "validated", createdAt: "2025-08-10" },
  { id: "h2", type: "hypothesis", title: "Social proof builds trust with new users", status: "invalidated", createdAt: "2025-09-25" },
  { id: "h3", type: "hypothesis", title: "One-click checkout reduces friction", status: "draft", createdAt: "2025-11-30" },
  
  // Experiments
  { id: "e1", type: "experiment", title: "A/B test new signup flow", status: "complete", createdAt: "2025-09-01" },
  { id: "e2", type: "experiment", title: "Test social badges on product pages", status: "complete", createdAt: "2025-10-15" },
  { id: "e3", type: "experiment", title: "Express checkout pilot program", status: "running", createdAt: "2025-12-20" },
  
  // Decisions
  { id: "d1", type: "decision", title: "Launch new simplified signup flow", status: "active", createdAt: "2025-10-01" },
  { id: "d2", type: "decision", title: "Prioritize mobile web performance", status: "active", createdAt: "2025-12-10" },
  
  // Features
  { id: "f1", type: "feature", title: "Social login (Google, GitHub)", status: "shipped", createdAt: "2025-08-20" },
  { id: "f2", type: "feature", title: "Express checkout flow", status: "building", createdAt: "2025-11-15" },
  { id: "f3", type: "feature", title: "PWA support for mobile", status: "shipped", createdAt: "2026-01-05" },
  
  // Feedback
  { id: "fb1", type: "feedback", title: "Love the new design! Much cleaner.", status: "new", createdAt: "2025-12-28" },
  { id: "fb2", type: "feedback", title: "Bug: Submit button unresponsive on Safari", status: "actioned", createdAt: "2025-09-18" },
  
  // Feature Requests
  { id: "fr1", type: "feature_request", title: "Dark mode support", status: "considering", createdAt: "2025-10-05" },
  { id: "fr2", type: "feature_request", title: "Export reports to PDF", status: "shipped", createdAt: "2025-11-22" },
];

// Mock filter options
const MOCK_PERSONAS = ["Power User", "New User", "Admin", "Developer"];
const MOCK_FEATURE_AREAS = ["Onboarding", "Checkout", "Dashboard", "Settings"];

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

// Helpers
const getTimeRangeStart = (range: TimeRangeKey): Date => {
  const now = new Date();
  switch (range) {
    case "1M": return subMonths(now, 1);
    case "3M": return subMonths(now, 3);
    case "6M": return subMonths(now, 6);
    case "1Y": return subYears(now, 1);
    case "3Y": return subYears(now, 3);
    case "all": return new Date(Math.min(...MOCK_TIMELINE_DATA.map(d => new Date(d.createdAt).getTime())));
  }
};

const isCompleted = (status: string): boolean => {
  return COMPLETED_STATUSES.includes(status.toLowerCase());
};

// Multi-select dropdown component
const MultiSelectDropdown: React.FC<{
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}> = ({ options, selected, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs justify-between min-w-[120px]"
        >
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
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
                  key={option}
                  onSelect={() => toggleOption(option)}
                  className="cursor-pointer"
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selected.includes(option) ? "bg-primary text-primary-foreground" : "opacity-50"
                  )}>
                    {selected.includes(option) && <Check className="h-3 w-3" />}
                  </div>
                  {option}
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
export const SwimLaneTimeline: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>("6M");
  const [visibleTypes, setVisibleTypes] = useState<TimelineEntityType[]>([...SWIMLANE_ORDER]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [selectedFeatureAreas, setSelectedFeatureAreas] = useState<string[]>([]);

  const today = new Date();
  const timeRangeStart = useMemo(() => getTimeRangeStart(timeRange), [timeRange]);
  const totalDays = useMemo(() => Math.max(1, differenceInDays(today, timeRangeStart)), [timeRangeStart]);

  // Filter items by visible types and date range
  const filteredItems = useMemo(() => {
    return MOCK_TIMELINE_DATA.filter(item => {
      const itemDate = new Date(item.createdAt);
      const inDateRange = itemDate >= timeRangeStart && itemDate <= today;
      const typeVisible = visibleTypes.includes(item.type);
      return inDateRange && typeVisible;
    });
  }, [visibleTypes, timeRangeStart]);

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
      // Weekly grid lines
      return eachWeekOfInterval(interval).map(date => ({
        date,
        label: format(date, "MMM d"),
      }));
    } else if (timeRange === "6M" || timeRange === "1Y") {
      // Monthly grid lines
      return eachMonthOfInterval(interval).map(date => ({
        date: startOfMonth(date),
        label: format(date, "MMM"),
      }));
    } else {
      // Quarterly grid lines
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
    console.log("Clicked item ID:", item.id, item);
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
              options={MOCK_PERSONAS}
              selected={selectedPersonas}
              onChange={setSelectedPersonas}
              placeholder="All Personas"
            />
            <MultiSelectDropdown
              options={MOCK_FEATURE_AREAS}
              selected={selectedFeatureAreas}
              onChange={setSelectedFeatureAreas}
              placeholder="All Features"
            />
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
                                  <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
                                    {item.status}
                                  </Badge>
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
