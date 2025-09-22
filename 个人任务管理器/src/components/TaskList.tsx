import React, { useState } from 'react';
import { 
  List, 
  Tag, 
  Button, 
  Checkbox, 
  Dropdown, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber,
  Badge,
  Menu
} from 'antd';
import { 
  MoreOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useTaskStore from '../store/taskStore';
import type { Task, TaskPriority, TaskStatus, TaskTag } from '../store/taskStore';

const { Option } = Select;
const { TextArea } = Input;

interface TaskListProps {
  filter?: Record<string, any>;
  showCompleted?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ filter, showCompleted = true }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const [sortField, setSortField] = useState<keyof Task>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const tasks = useTaskStore(state => state.getFilteredTasks(filter));
  const tags = useTaskStore(state => state.tags);
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const markTaskAsComplete = useTaskStore(state => state.markTaskAsComplete);
  const changeTaskStatus = useTaskStore(state => state.changeTaskStatus);
  const addSubTask = useTaskStore(state => state.addSubTask);

  // 处理筛选和排序后的任务列表
  const processedTasks = React.useMemo(() => {
    let result = [...tasks];
    
    // 筛选已完成任务
    if (!showCompleted) {
      result = result.filter(task => task.status !== 'COMPLETED');
    }
    
    // 排序
    result.sort((a, b) => {
      if (sortField === 'dueDate') {
        const dateA = a.dueDate ? dayjs(a.dueDate).valueOf() : Infinity;
        const dateB = b.dueDate ? dayjs(b.dueDate).valueOf() : Infinity;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortField === 'priority') {
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return sortOrder === 'asc' 
          ? priorityOrder[a.priority] - priorityOrder[b.priority] 
          : priorityOrder[b.priority] - priorityOrder[a.priority];
      } else if (sortField === 'createdAt' || sortField === 'updatedAt') {
        const dateA = dayjs(a[sortField]).valueOf();
        const dateB = dayjs(b[sortField]).valueOf();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
    
    return result;
  }, [tasks, showCompleted, sortField, sortOrder]);

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

  const handleAddSubTask = (parentId: Task['id']) => {
    addSubTask(parentId, {
      title: '新子任务',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      tags: []
    });
    // 可以在这里立即编辑新创建的子任务
  };

  const getStatusBadge = (status: TaskStatus) => {
    const statusConfig = {
      TODO: { text: '待处理', color: 'default' },
      IN_PROGRESS: { text: '进行中', color: 'processing' },
      PAUSED: { text: '已暂停', color: 'warning' },
      COMPLETED: { text: '已完成', color: 'success' },
      OVERDUE: { text: '已逾期', color: 'error' },
      CANCELLED: { text: '已取消', color: 'default' }
    };
    
    const config = statusConfig[status];
    // 使用Badge的color和text属性，而不是status属性来避免类型错误
    return <Badge color={config.color === 'default' ? undefined : config.color} text={config.text} />;
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
      <Menu.Item onClick={() => handleAddSubTask(task.id)}>
        <PlusOutlined /> 添加子任务
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
        <h2 className="text-lg font-semibold">任务列表</h2>
        <div className="flex items-center gap-2">
          <Select 
            value={sortField} 
            style={{ width: 120 }} 
            onChange={setSortField}
          >
            <Option value="dueDate">截止日期</Option>
            <Option value="priority">优先级</Option>
            <Option value="createdAt">创建时间</Option>
            <Option value="updatedAt">更新时间</Option>
          </Select>
          <Button 
            type="text" 
            icon={sortOrder === 'asc' ? <UpOutlined /> : <DownOutlined />}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          />
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
      </div>
      
      <List
        itemLayout="horizontal"
        dataSource={processedTasks}
        renderItem={(task) => {
          const isOverdue = task.dueDate && 
            task.status !== 'COMPLETED' && 
            dayjs(task.dueDate).isBefore(dayjs());
          
          return (
            <List.Item
              key={task.id}
              className={`py-3 border-b last:border-b-0 ${isOverdue ? 'bg-red-50' : ''}`}
              extra={
                <Dropdown overlay={taskMenu(task)} placement="bottomRight">
                  <Button type="text" icon={<MoreOutlined />} />
                </Dropdown>
              }
            >
              <List.Item.Meta
                avatar={
                  <Checkbox 
                    checked={task.status === 'COMPLETED'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        markTaskAsComplete(task.id);
                      } else {
                        changeTaskStatus(task.id, 'TODO');
                      }
                    }}
                  />
                }
                title={
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </span>
                      {getStatusBadge(task.status)}
                      {getPriorityTag(task.priority)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <CalendarOutlined className="text-xs" />
                          {dayjs(task.dueDate).format('YYYY-MM-DD HH:mm')}
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
                    {task.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                    )}
                    {getTaskTags(task.tags).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getTaskTags(task.tags)}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />

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
              <Option value="TODO">待处理</Option>
              <Option value="IN_PROGRESS">进行中</Option>
              <Option value="PAUSED">已暂停</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="OVERDUE">已逾期</Option>
              <Option value="CANCELLED">已取消</Option>
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

export default TaskList;