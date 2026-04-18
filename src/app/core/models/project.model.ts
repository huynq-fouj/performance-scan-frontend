export interface Project {
  id: string;
  name: string;
  url: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  autoScanFrequency: string;
  lastScanAt?: string | Date;
  lastScore?: number;
  lastAccessibilityScore?: number;
  lastBestPracticesScore?: number;
  lastSeoScore?: number;
  lastScreenshot?: string;
  includeSeo?: boolean;
  includeAccessibility?: boolean;
  includeBestPractices?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateProjectRequest {
  name: string;
  url: string;
  description?: string;
  logo?: string;
  includeSeo?: boolean;
  includeAccessibility?: boolean;
  includeBestPractices?: boolean;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  isActive?: boolean;
}
