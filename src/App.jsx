import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import AllTasks from './pages/AllTasks.jsx';
import TodayFocus from './pages/TodayFocus.jsx';
import History from './pages/History.jsx';
import WeekReview from './pages/WeekReview.jsx';
import { useProjects } from './hooks/useProjects.js';
import { useTasks } from './hooks/useTasks.js';
import './App.css';

function App() {
  // 全局状态管理：项目数据
  const { projects, createProject, deleteProject, updateProjectName, toggleProjectDone } = useProjects();
  // 全局状态管理：任务数据
  const { tasks, createTask, deleteTask, toggleTaskDone, updateTask, addSubtask, deleteSubtask, toggleSubtaskDone, updateSubtask } = useTasks();

  // 处理创建项目
  const handleCreateProject = (zoneId, name) => {
    createProject(zoneId, name);
  };

  // 处理创建任务
  const handleCreateTask = (projectId, zoneId, title, deadline, estimatedMin) => {
    createTask(projectId, zoneId, title, deadline, estimatedMin);
  };

  // 处理切换任务完成状态
  const handleToggleTask = (taskId) => {
    toggleTaskDone(taskId);
  };

  // 处理删除任务
  const handleDeleteTask = (taskId) => {
    deleteTask(taskId);
  };

  // 处理更新任务
  const handleUpdateTask = (taskId, updates) => {
    updateTask(taskId, updates);
  };

  // 处理更新项目
  const handleUpdateProject = (projectId, newName) => {
    updateProjectName(projectId, newName);
  };

  // 处理切换项目完成状态
  const handleToggleProjectDone = (projectId) => {
    toggleProjectDone(projectId);
  };

  // 处理添加子任务
  const handleAddSubtask = (taskId, title) => {
    addSubtask(taskId, title);
  };

  // 处理删除子任务
  const handleDeleteSubtask = (taskId, subtaskId) => {
    deleteSubtask(taskId, subtaskId);
  };

  // 处理切换子任务完成状态
  const handleToggleSubtaskDone = (taskId, subtaskId) => {
    toggleSubtaskDone(taskId, subtaskId);
  };

  // 处理更新子任务标题
  const handleUpdateSubtask = (taskId, subtaskId, newTitle) => {
    updateSubtask(taskId, subtaskId, newTitle);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/all-tasks" replace />} />
            <Route
              path="/all-tasks"
              element={
                <AllTasks
                  projects={projects}
                  tasks={tasks}
                  onCreateProject={handleCreateProject}
                  onCreateTask={handleCreateTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateTask={handleUpdateTask}
                  onUpdateProject={handleUpdateProject}
                  onToggleProjectDone={handleToggleProjectDone}
                  onAddSubtask={handleAddSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                  onToggleSubtaskDone={handleToggleSubtaskDone}
                  onUpdateSubtask={handleUpdateSubtask}
                />
              }
            />
            <Route
              path="/today"
              element={
                <TodayFocus
                  projects={projects}
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateTask={handleUpdateTask}
                />
              }
            />
            <Route
              path="/history"
              element={
                <History
                  projects={projects}
                  tasks={tasks}
                />
              }
            />
            <Route
              path="/week-review"
              element={
                <WeekReview
                  projects={projects}
                  tasks={tasks}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
