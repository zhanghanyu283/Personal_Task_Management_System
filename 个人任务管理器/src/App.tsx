import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskKanban from './components/TaskKanban';
import TaskCalendar from './components/TaskCalendar';
import './App.css';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/tasks/todo" element={<TaskList filter={{ status: 'TODO' }} />} />
        <Route path="/tasks/in-progress" element={<TaskList filter={{ status: 'IN_PROGRESS' }} />} />
        <Route path="/tasks/overdue" element={<TaskList filter={{ status: 'OVERDUE' }} />} />
        <Route path="/kanban" element={<TaskKanban />} />
        <Route path="/calendar" element={<TaskCalendar />} />
      </Routes>
    </Layout>
  );
}

export default App
