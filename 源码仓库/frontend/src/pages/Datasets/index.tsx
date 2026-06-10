/** index.tsx — 数据集路由入口
 * Author: hongchuwudi
 * Description: 嵌套路由分发：列表 / 详情 / 导入
 */
import { Routes, Route } from 'react-router-dom'
import DatasetList from './DatasetList'
import DatasetDetail from './DatasetDetail'
import DataImport from './DataImport'

/** 数据集页面路由容器 */
export default function Datasets() {
  return (
    <Routes>
      <Route index element={<DatasetList />} />
      <Route path=":id" element={<DatasetDetail />} />
      <Route path=":id/import" element={<DataImport />} />
    </Routes>
  )
}
