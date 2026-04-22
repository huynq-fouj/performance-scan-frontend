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
