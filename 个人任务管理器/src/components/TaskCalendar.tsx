import React, { useState } from 'react';
import { Calendar, Card, Modal, Form, Input, Select, DatePicker, Button, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useTaskStore from '../store/taskStore';
import type { Task, TaskPriority, TaskStatus } from '../store/taskStore';

const { Option } = Select;
const { TextArea } = Input;

const TaskCalendar: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [_selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [form] = Form.useForm();

  const tasks = useTaskStore(state => state.tasks);
  const tags = useTaskStore(state => state.tags);
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);

  // 按日期分组任务
  const tasksByDate = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    
    Object.values(tasks).forEach(task => {
      if (task.dueDate) {
        const dateKey = dayjs(task.dueDate).format('YYYY-MM-DD');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    
    return grouped;
  }, [tasks]);

  // 日历单元格渲染
  const dateCellRender = (value: dayjs.Dayjs) => {
    const dateKey = value.format('YYYY-MM-DD');
    const dayTasks = tasksByDate[dateKey] || [];
    
    if (dayTasks.length === 0) return null;
    
    return (
      <div className="space-y-1">
        {dayTasks.slice(0, 3).map(task => {
          const isOverdue = task.dueDate && 
            task.status !== 'COMPLETED' && 
            dayjs(task.dueDate).isBefore(dayjs());
          
          return (
            <div 
              key={task.id} 
              className={`text-xs p-1 rounded cursor-pointer transition-colors hover:bg-gray-100 ${isOverdue ? 'text-red-600' : task.status === 'COMPLETED' ? 'text-green-600 line-through' : 'text-gray-800'}`}
              onClick={() => handleEditTask(task)}
            >
              {task.title}
            </div>
          );
        })}
        {dayTasks.length > 3 && (
          <div className="text-xs text-gray-500 text-center">
            +{dayTasks.length - 3} 个任务
          </div>
        )}
      </div>
    );
  };

  // 日历单元格悬停信息
  const getCalendarCellProp = (value: dayjs.Dayjs) => {
    const dateKey = value.format('YYYY-MM-DD');
    const dayTasks = tasksByDate[dateKey] || [];
    
    // 计算有多少高优先级和逾期任务
    const highPriorityCount = dayTasks.filter(task => task.priority === 'HIGH').length;
    const overdueCount = dayTasks.filter(task => {
      return task.dueDate && 
        task.status !== 'COMPLETED' && 
        dayjs(task.dueDate).isBefore(dayjs());
    }).length;
    
    // 设置背景颜色标记
    let className = '';
    if (overdueCount > 0) {
      className = 'bg-red-50';
    } else if (highPriorityCount > 0) {
      className = 'bg-orange-50';
    } else if (dayTasks.length > 0) {
      className = 'bg-blue-50';
    }
    
    return {
      className,
      title: dayTasks.length > 0 ? `${dayTasks.length} 个任务` : ''
    };
  };

  const handleDateSelect = (value: dayjs.Dayjs) => {
    setSelectedDate(value);
    setEditingTask(null);
    form.resetFields();
    // 设置表单的默认截止日期为选中的日期
    form.setFieldsValue({
      dueDate: value
    });
    setIsModalVisible(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedDate(task.dueDate ? dayjs(task.dueDate) : null);
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



  return (
    <Card className="bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">日历视图</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingTask(null);
            setSelectedDate(dayjs());
            form.resetFields();
            form.setFieldsValue({
              dueDate: dayjs()
            });
            setIsModalVisible(true);
          }}
        >
          新建任务
        </Button>
      </div>
      
      <Calendar 
        fullscreen={false}
        cellRender={dateCellRender}
        onSelect={handleDateSelect}
        dateCellRender={(value) => <div className={getCalendarCellProp(value).className}>{value.date()}</div>}
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
            rules={[{ required: true, message: '请选择截止日期' }]}
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
    </Card>
  );
};

export default TaskCalendar;