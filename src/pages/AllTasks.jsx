import { ZONES } from '../constants/zones.js';
import ZonePanel from '../components/ZonePanel.jsx';
import './AllTasks.css';

/**
 * 全部任务页面
 * 桌面端三列布局显示三个区，移动端三个折叠面板
 */
function AllTasks({ projects, tasks, onCreateProject, onCreateTask, onToggleTask, onDeleteTask, onUpdateTask, onUpdateProject, onToggleProjectDone, onTogglePin, onUpdateProjectCategory, onAddSubtask, onDeleteSubtask, onToggleSubtaskDone, onUpdateSubtask, onAddTimeRecord, onDeleteTimeRecord, onUpdateTimeRecord }) {
  return (
    <div className="all-tasks-page">
      <h1 className="page-title">全部任务</h1>
      <div className="zones-container">
        {ZONES.map(zone => (
          <ZonePanel
            key={zone.id}
            zone={zone}
            projects={projects}
            tasks={tasks}
            onCreateProject={onCreateProject}
            onCreateTask={onCreateTask}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            onUpdateTask={onUpdateTask}
            onUpdateProject={onUpdateProject}
            onToggleProjectDone={onToggleProjectDone}
            onTogglePin={onTogglePin}
            onUpdateProjectCategory={onUpdateProjectCategory}
            onAddSubtask={onAddSubtask}
            onDeleteSubtask={onDeleteSubtask}
            onToggleSubtaskDone={onToggleSubtaskDone}
            onUpdateSubtask={onUpdateSubtask}
            onAddTimeRecord={onAddTimeRecord}
            onDeleteTimeRecord={onDeleteTimeRecord}
            onUpdateTimeRecord={onUpdateTimeRecord}
          />
        ))}
      </div>
    </div>
  );
}

export default AllTasks;
