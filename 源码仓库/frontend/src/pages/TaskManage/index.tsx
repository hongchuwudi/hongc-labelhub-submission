/**
 * TaskManage/index.tsx — 任务管理路由入口
 * Author: hongchuwudi
 * Description: 任务列表与导出的路由分发
 */
import { Routes, Route, useParams } from 'react-router-dom'
import TaskList from './components/TaskList'
import ExportPage from './ExportPage'

function ExportPageWrapper() {
  const { taskId } = useParams<{ taskId: string }>()
  return <ExportPage taskId={Number(taskId)} />
}

/** 任务管理页面路由入口 */
export default function TaskManage() {
  return (
    <Routes>
      <Route index element={<TaskList />} />
      <Route path=":taskId/export" element={<ExportPageWrapper />} />
    </Routes>
  )
}
