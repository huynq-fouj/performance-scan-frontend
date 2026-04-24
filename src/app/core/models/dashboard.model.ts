export interface TrendDataPoint {
  date: string;
  score: number;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  projectName: string;
  action: string;
  timeAgo: string;
  date: string | Date;
}

export interface DashboardAlert {
  id: string;
  projectId: string;
  projectName: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  date: string | Date;
}

export interface ProjectHealthItem {
  id: string;
  name: string;
  score: number;
  status: 'Healthy' | 'Warning' | 'Critical';
  lastScanAt: string | Date | null;
  trend: 'up' | 'down' | 'flat';
}

export interface DashboardSummary {
  portfolio: {
    totalProjects: number;
    healthyProjects: number;
    warningProjects: number;
    criticalProjects: number;
    scansThisMonth: number;
  };
  projectHealthList: ProjectHealthItem[];
  alerts: DashboardAlert[];
  recentActivity: ActivityLog[];
  trends: TrendDataPoint[];
}

export interface AggregatedIssue {
  title: string;
  count: number;
  severity: string;
  affectedProjects: string[];
}

export interface ExecutiveReport {
  averageScore: number;
  healthDistribution: {
    good: { count: number; percent: number };
    average: { count: number; percent: number };
    poor: { count: number; percent: number };
  };
  commonIssues: AggregatedIssue[];
  topPerformers: { id: string; projectId: string; projectName: string; performanceScore: number }[];
  needsAttention: { id: string; projectId: string; projectName: string; performanceScore: number }[];
  totalScansAnalyzed: number;
}
