import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Project, CreateProjectRequest, UpdateProjectRequest } from '../models/project.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/projects';

  private currentProjectSubject = new BehaviorSubject<Project | null>(null);
  currentProject$ = this.currentProjectSubject.asObservable();

  getProjects(): Observable<ApiResponse<Project[]>> {
    return this.http.get<ApiResponse<Project[]>>(this.apiUrl);
  }

  getProject(id: string): Observable<ApiResponse<Project>> {
    return this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`).pipe(
      tap(res => this.currentProjectSubject.next(res.data))
    );
  }

  createProject(payload: CreateProjectRequest): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, payload);
  }

  updateProject(id: string, payload: UpdateProjectRequest): Observable<ApiResponse<Project>> {
    return this.http.patch<ApiResponse<Project>>(`${this.apiUrl}/${id}`, payload).pipe(
      tap(res => this.currentProjectSubject.next(res.data))
    );
  }

  deleteProject(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.currentProjectSubject.next(null))
    );
  }

  setCurrentProject(project: Project | null) {
    this.currentProjectSubject.next(project);
  }
}
