import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown, Badge } from 'antd';
import { 
  PieChartOutlined, 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  PlusOutlined, 
  SettingOutlined, 
  UserOutlined, 
  ToolOutlined, 
  CalendarOutlined, 
  FileTextOutlined, 
  InboxOutlined,
  WarningOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useTaskStore from '../store/taskStore';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const TaskManagerLayout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const stats = useTaskStore(state => state.getStats());
  const setCurrentView = useTaskStore(state => state.setCurrentView);
  const addTask = useTaskStore(state => state.addTask);
  const selectTask = useTaskStore(state => state.selectTask);

  const toggle = () => {
    setCollapsed(!collapsed);
  };

  const handleAddTask = () => {
    // 创建一个新任务并打开编辑窗口
    const taskId = addTask({
      title: '新任务',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      tags: []
    });
    selectTask(taskId);
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile">
        <UserOutlined /> 个人资料
      </Menu.Item>
      <Menu.Item key="settings">
        <SettingOutlined /> 设置
      </Menu.Item>
    </Menu>
  );

  return (
    <AntLayout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        theme="light"
        className="bg-white border-r border-gray-200"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <ToolOutlined className="text-blue-600" />
            {!collapsed && <span>任务管理器</span>}
          </div>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggle}
            className="text-gray-500"
          />
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          className="py-4"
          style={{ borderRight: 0 }}
        >
          <Menu.Item
            key="dashboard"
            icon={<PieChartOutlined />}
            onClick={() => setCurrentView('LIST')}
          >
            <Link to="/" className="w-full">仪表盘</Link>
          </Menu.Item>
          <Menu.Item
            key="all-tasks"
            icon={<InboxOutlined />}
            onClick={() => setCurrentView('LIST')}
          >
            <Link to="/tasks" className="w-full">
              <span className="flex items-center justify-between w-full">
                所有任务
                <Badge count={stats.totalTasks} className="ml-2" />
              </span>
            </Link>
          </Menu.Item>
          <Menu.Item
            key="todo"
            icon={<FileTextOutlined />}
            onClick={() => setCurrentView('LIST')}
          >
            <Link to="/tasks/todo" className="w-full">
              <span className="flex items-center justify-between w-full">
                待处理
                <Badge count={stats.tasksByStatus.TODO} className="ml-2" />
              </span>
            </Link>
          </Menu.Item>
          <Menu.Item
            key="in-progress"
            icon={<FileTextOutlined />}
            onClick={() => setCurrentView('LIST')}
          >
            <Link to="/tasks/in-progress" className="w-full">
              <span className="flex items-center justify-between w-full">
                进行中
                <Badge count={stats.tasksByStatus.IN_PROGRESS} className="ml-2" />
              </span>
            </Link>
          </Menu.Item>
          <Menu.Item
            key="overdue"
            icon={<WarningOutlined />}
            onClick={() => setCurrentView('LIST')}
          >
            <Link to="/tasks/overdue" className="w-full">
              <span className="flex items-center justify-between w-full">
                已逾期
                <Badge count={stats.overdueTasks} className="ml-2" />
              </span>
            </Link>
          </Menu.Item>
          <Menu.Item
            key="kanban"
            icon={<AppstoreOutlined />}
            onClick={() => setCurrentView('KANBAN')}
          >
            <Link to="/kanban" className="w-full">看板视图</Link>
          </Menu.Item>
          <Menu.Item
            key="calendar"
            icon={<CalendarOutlined />}
            onClick={() => setCurrentView('CALENDAR')}
          >
            <Link to="/calendar" className="w-full">日历视图</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <AntLayout className="bg-gray-50">
        <Header className="bg-white p-0 border-b border-gray-200 flex items-center justify-between">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggle}
            className="ml-4 text-gray-500"
          />
          <div className="flex items-center gap-4 mr-4">
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddTask}
              className="!bg-blue-600"
            >
              新建任务
            </Button>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Avatar className="cursor-pointer bg-blue-600">
                <UserOutlined />
              </Avatar>
            </Dropdown>
          </div>
        </Header>
        <Content className="p-6">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default TaskManagerLayout;