import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Button, Badge } from 'antd';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useTaskStore from '../store/taskStore';
import type { TaskStatus, TaskPriority } from '../store/taskStore';

const Dashboard: React.FC = () => {
  const stats = useTaskStore(state => state.getStats());
  const tasks = useTaskStore(state => state.tasks);
  const tags = useTaskStore(state => state.tags);
  const setCurrentView = useTaskStore(state => state.setCurrentView);

  // 准备图表数据
  const statusData = Object.entries(stats.tasksByStatus).map(([status, count]) => ({
    name: getStatusText(status as TaskStatus),
    value: count,
    color: getStatusColor(status as TaskStatus)
  }));

  const priorityData = Object.entries(stats.tasksByPriority).map(([priority, count]) => ({
    name: getPriorityText(priority as TaskPriority),
    value: count,
    color: getPriorityColor(priority as TaskPriority)
  }));

  const tagData = Object.entries(stats.tasksByTag).map(([tagId, count]) => {
    const tag = tags[tagId];
    return {
      name: tag?.name || '未命名标签',
      value: count,
      color: tag?.color || '#d9d9d9'
    };
  }).filter(tag => tag.value > 0);

  // 生成最近7天的任务完成趋势数据
  const trendData = Array.from({ length: 7 }).map((_, index) => {
    const date = dayjs().subtract(6 - index, 'day');
    const dateStr = date.format('MM-DD');
    
    // 计算当天创建的任务数
    const createdCount = Object.values(tasks).filter(task => 
      dayjs(task.createdAt).isSame(date, 'day')
    ).length;
    
    // 计算当天完成的任务数
    const completedCount = Object.values(tasks).filter(task => 
      task.completedAt && dayjs(task.completedAt).isSame(date, 'day')
    ).length;
    
    return {
      date: dateStr,
      created: createdCount,
      completed: completedCount
    };
  });

  // 计算任务完成率
  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  // 计算逾期率
  const overdueRate = stats.totalTasks > 0 
    ? Math.round((stats.overdueTasks / stats.totalTasks) * 100) 
    : 0;

  // 工具函数
  function getStatusText(status: TaskStatus): string {
    const statusMap: Record<TaskStatus, string> = {
      TODO: '待处理',
      IN_PROGRESS: '进行中',
      PAUSED: '已暂停',
      COMPLETED: '已完成',
      OVERDUE: '已逾期',
      CANCELLED: '已取消'
    };
    return statusMap[status];
  }

  function getStatusColor(status: TaskStatus): string {
    const colorMap: Record<TaskStatus, string> = {
      TODO: '#d9d9d9',
      IN_PROGRESS: '#1890ff',
      PAUSED: '#faad14',
      COMPLETED: '#52c41a',
      OVERDUE: '#f5222d',
      CANCELLED: '#8c8c8c'
    };
    return colorMap[status];
  }

  function getPriorityText(priority: TaskPriority): string {
    const priorityMap: Record<TaskPriority, string> = {
      HIGH: '高优先级',
      MEDIUM: '中优先级',
      LOW: '低优先级'
    };
    return priorityMap[priority];
  }

  function getPriorityColor(priority: TaskPriority): string {
    const colorMap: Record<TaskPriority, string> = {
      HIGH: '#f5222d',
      MEDIUM: '#faad14',
      LOW: '#1890ff'
    };
    return colorMap[priority];
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">任务概览</h1>
        <Button onClick={() => setCurrentView('LIST')}>查看所有任务</Button>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="总任务数" 
              value={stats.totalTasks} 
              suffix={
                stats.totalTasks > 0 ? 
                <Tag color="blue">
                  {stats.highPriorityTasks}个高优先级
                </Tag> : null
              }
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="已完成任务" 
              value={stats.completedTasks} 
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="已逾期任务" 
              value={stats.overdueTasks} 
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="今日专注时间" 
              value={stats.focusTimeToday}
              suffix="分钟"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 进度条 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="任务完成率">
            <Progress percent={completionRate} status="active" />
            <p className="text-sm text-gray-500 mt-2">已完成 {stats.completedTasks} / {stats.totalTasks} 个任务</p>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="任务逾期率">
            <Progress percent={overdueRate} status={overdueRate > 20 ? "exception" : "active"} />
            <p className="text-sm text-gray-500 mt-2">{stats.overdueTasks} 个任务已逾期</p>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="任务状态分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="任务优先级分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 趋势图和标签分布图 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近7天任务趋势">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" name="创建任务数" stroke="#1890ff" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="completed" name="完成任务数" stroke="#52c41a" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="标签任务分布">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tagData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" name="任务数">
                  {tagData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 效率洞察 */}
      <Card title="效率洞察">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">高优先级任务</h4>
            <p className="text-sm text-gray-600">
              您有 <Badge count={stats.highPriorityTasks} color="error" /> 个高优先级任务需要优先处理。
            </p>
          </div>
          {stats.overdueTasks > 0 && (
            <div>
              <h4 className="font-medium mb-2">逾期提醒</h4>
              <p className="text-sm text-red-600">
                您有 <Badge count={stats.overdueTasks} color="error" /> 个任务已经逾期，请尽快处理！
              </p>
            </div>
          )}
          {stats.averageCompletionTime !== null && (
            <div>
              <h4 className="font-medium mb-2">完成效率</h4>
              <p className="text-sm text-gray-600">
                您完成一个任务的平均时间是 {Math.round(stats.averageCompletionTime / 60)} 小时 {Math.round(stats.averageCompletionTime % 60)} 分钟。
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;