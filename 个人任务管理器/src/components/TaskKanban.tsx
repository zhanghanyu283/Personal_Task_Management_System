import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Tag, 
  Button, 
  Badge, 
  Dropdown,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Menu
} from 'antd';
import { 
  PlusOutlined, 
  MoreOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  EditOutlined,
  CheckOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useTaskStore from '../store/taskStore';
import type { Task, TaskPriority, TaskStatus, TaskTag } from '../store/taskStore';

const { Option } = Select;
const { TextArea } = Input;

// 看板列配置
const KANBAN_COLUMNS = [
  { status: 'TODO', title: '待处理', color: '#d9d9d9' },
  { status: 'IN_PROGRESS', title: '进行中', color: '#1890ff' },
  { status: 'PAUSED', title: '已暂停', color: '#faad14' },
  { status: 'COMPLETED', title: '已完成', color: '#52c41a' },
  { status: 'OVERDUE', title: '已逾期', color: '#f5222d' },
  { status: 'CANCELLED', title: '已取消', color: '#8c8c8c' }
] as const;

const TaskKanban: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [draggedTask, setDraggedTask] = useState<Task['id'] | null>(null);

  const tasks = useTaskStore(state => state.tasks);
  const tags = useTaskStore(state => state.tags);
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const changeTaskStatus = useTaskStore(state => state.changeTaskStatus);
  const markTaskAsComplete = useTaskStore(state => state.markTaskAsComplete);
  const deleteTask = useTaskStore(state => state.deleteTask);

  // 按状态分组任务
  const tasksByStatus = React.useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      PAUSED: [],
      COMPLETED: [],
      OVERDUE: [],
      CANCELLED: []
    };

    Object.values(tasks).forEach(task => {
      // 检查任务是否已逾期但状态未更新
      if (task.dueDate && 
          task.status !== 'COMPLETED' && 
          dayjs(task.dueDate).isBefore(dayjs()) && 
          task.status !== 'OVERDUE') {
        grouped['OVERDUE'].push(task);
      } else {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (taskId: Task['id']) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: TaskStatus) => {
    if (draggedTask) {
      changeTaskStatus(draggedTask, status);
      setDraggedTask(null);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      tags: task.tags,
      dueDate: task.dueDate ? dayjs(task.dueDate) : null,
      estimatedTime: task.estimatedTime,
      assignee: task.assignee
    });
    setIsModalVisible(true);
  };

  const handleDeleteTask = (taskId: Task['id']) => {
    deleteTask(taskId);
  };

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        const taskData = {
          ...values,
          dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DDTHH:mm') : undefined,
          tags: values.tags || []
        };

        if (editingTask) {
          updateTask(editingTask.id, taskData);
        } else {
          addTask({
            ...taskData,
            status: 'TODO' as TaskStatus,
            priority: 'MEDIUM' as TaskPriority,
            children: [],
            createdAt: dayjs().format('YYYY-MM-DDTHH:mm'),
            updatedAt: dayjs().format('YYYY-MM-DDTHH:mm')
          });
        }
        setIsModalVisible(false);
        form.resetFields();
        setEditingTask(null);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const getPriorityTag = (priority: TaskPriority) => {
    const priorityConfig = {
      HIGH: { text: '高', color: 'red' },
      MEDIUM: { text: '中', color: 'orange' },
      LOW: { text: '低', color: 'blue' }
    };
    
    const config = priorityConfig[priority];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getTaskTags = (taskTags: TaskTag['id'][]) => {
    return taskTags.map(tagId => {
      const tag = tags[tagId];
      return tag ? <Tag key={tagId} color={tag.color}>{tag.name}</Tag> : null;
    }).filter(Boolean);
  };

  const taskMenu = (task: Task) => (
    <Menu>
      <Menu.Item onClick={() => handleEditTask(task)}>
        <EditOutlined /> 编辑
      </Menu.Item>
      <Menu.Item onClick={() => markTaskAsComplete(task.id)} disabled={task.status === 'COMPLETED'}>
        <CheckOutlined /> 标记完成
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item 
        danger 
        onClick={() => handleDeleteTask(task.id)}
      >
        <DeleteOutlined /> 删除
      </Menu.Item>
    </Menu>
  );



  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">看板视图</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingTask(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          新建任务
        </Button>
      </div>
      
      <Row gutter={[16, 16]}>
        {KANBAN_COLUMNS.map(column => {
          const columnTasks = tasksByStatus[column.status];
          return (
            <Col key={column.status} xs={24} sm={12} md={8} lg={6}>
              <Card
                title={
                  <div className="flex items-center justify-between">
                    <span style={{ color: column.color }}>{column.title}</span>
                    <Badge count={columnTasks.length} style={{ backgroundColor: column.color }} />
                  </div>
                }
                className="h-full flex flex-col"
                style={{ borderLeft: `4px solid ${column.color}` }}
                bodyStyle={{ flex: 1, overflowY: 'auto', padding: '12px' }}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.status)}
              >
                {columnTasks.map(task => {
                  const isOverdue = task.dueDate && 
                    task.status !== 'COMPLETED' && 
                    dayjs(task.dueDate).isBefore(dayjs());
                  
                  return (
                    <Card
                      key={task.id}
                      className={`mb-2 cursor-pointer hover:shadow-md transition-shadow ${isOverdue ? 'bg-red-50 border-red-200' : ''}`}
                      bordered={true}
                      onClick={() => handleEditTask(task)}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      extra={
                        <Dropdown overlay={taskMenu(task)} placement="bottomRight">
                          <Button type="text" icon={<MoreOutlined />} className="float-right" />
                        </Dropdown>
                      }
                    >
                      <div className="pb-2">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h4>
                          {getPriorityTag(task.priority)}
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <CalendarOutlined className="text-xs" />
                              {dayjs(task.dueDate).format('MM-DD HH:mm')}
                            </span>
                          )}
                          {task.estimatedTime && (
                            <span className="flex items-center gap-1">
                              <ClockCircleOutlined className="text-xs" />
                              {task.estimatedTime}分钟
                            </span>
                          )}
                          {task.assignee && (
                            <span className="flex items-center gap-1">
                              <UserOutlined className="text-xs" />
                              {task.assignee}
                            </span>
                          )}
                        </div>
                        
                        {getTaskTags(task.tags).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {getTaskTags(task.tags)}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* 任务编辑模态框 */}
      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingTask(null);
        }}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'TODO',
            priority: 'MEDIUM',
            tags: []
          }}
        >
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="任务描述"
          >
            <TextArea rows={4} placeholder="请输入任务描述" />
          </Form.Item>

          <Form.Item
            name="status"
            label="任务状态"
          >
            <Select placeholder="请选择任务状态">
              {KANBAN_COLUMNS.map(column => (
                <Option key={column.status} value={column.status}>
                  {column.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
          >
            <Select placeholder="请选择优先级">
              <Option value="HIGH">高</Option>
              <Option value="MEDIUM">中</Option>
              <Option value="LOW">低</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="截止日期"
          >
            <DatePicker 
              showTime 
              placeholder="请选择截止日期"
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            name="estimatedTime"
            label="预估耗时（分钟）"
          >
            <InputNumber min={1} placeholder="请输入预估耗时" />
          </Form.Item>

          <Form.Item
            name="assignee"
            label="负责人"
          >
            <Input placeholder="请输入负责人" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select mode="multiple" placeholder="请选择或输入标签">
              {Object.values(tags).map(tag => (
                <Option key={tag.id} value={tag.id}>{tag.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskKanban;