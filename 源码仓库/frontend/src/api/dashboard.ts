/**
 * dashboard.ts — 数据看板 API
 * Author: hongchuwudi
 * Description: 提供看板统计数据、任务进度及数据集统计接口
 */

import apiClient from './client'

/** 看板统计数据 */
export interface DashboardStats {
  total_tasks: number; total_items: number
  labeled: number; pending: number; label_rate: number
  approved: number; rejected: number; pass_rate: number
  ai_total: number; ai_done: number
}

/** 任务进度数据 */
export interface TaskProgress {
  id: number; title: string; status: string
  total_items: number; labeled: number; progress: number
  warehouse: number; rejected: number
  ai_done: number; ai_total: number
}

/** 数据集统计数据 */
export interface DatasetsStats {
  total_datasets: number; total_items: number; used_datasets: number
}

/** 获取看板统计数据 */
export function getDashboardStatsApi() { return apiClient.get<DashboardStats>('/dashboard/stats') }
/** 获取任务进度列表 */
export function getTasksProgressApi() { return apiClient.get<TaskProgress[]>('/dashboard/tasks-progress') }
/** 获取数据集统计——全局 */
export function getDatasetsStatsApi() { return apiClient.get<DatasetsStats>('/dashboard/datasets-stats') }
/** 获取我的数据集统计——仅当前用户 */
export function getMyDatasetsStatsApi() { return apiClient.get<DatasetsStats>('/dashboard/my-datasets-stats') }
