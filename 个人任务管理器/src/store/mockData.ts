import dayjs from 'dayjs';

// 生成mock标签数据 - 转换为Record格式
export const mockTags = {
  '1': {
    id: '1',
    name: '工作',
    color: '#1890ff'
  },
  '2': {
    id: '2',
    name: '学习',
    color: '#52c41a'
  },
  '3': {
    id: '3',
    name: '个人',
    color: '#faad14'
  },
  '4': {
    id: '4',
    name: '健康',
    color: '#f5222d'
  },
  '5': {
    id: '5',
    name: '娱乐',
    color: '#722ed1'
  }
};

// 生成mock任务数据 - 转换为Record格式，确保类型正确
export const generateMockTasks = () => {
  const today = dayjs();
  const tasks = {
    // 今天的任务
    't1': {
      id: 't1',
      title: '完成项目提案',
      description: '撰写并提交下一季度的项目提案文档',
      status: 'TODO',
      priority: 'HIGH' as const,
      dueDate: today.format('YYYY-MM-DDTHH:mm'),
      tags: ['1'],
      createdAt: today.subtract(1, 'day').format('YYYY-MM-DDTHH:mm'),
      updatedAt: today.subtract(1, 'day').format('YYYY-MM-DDTHH:mm'),
      estimatedTime: 240, // 分钟
      children: [],
      reminderConfig: [{ time: today.subtract(1, 'hour').format('YYYY-MM-DDTHH:mm'), type: 'BEFORE', minutes: 60 }]
    },
    't2': {
      id: 't2',
      title: '锻炼30分钟',
      description: '进行有氧运动和力量训练',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM' as const,
      dueDate: today.format('YYYY-MM-DDTHH:mm'),
      tags: ['4'],
      createdAt: today.subtract(2, 'day').format('YYYY-MM-DDTHH:mm'),
      updatedAt: today.subtract(1, 'hour').format('YYYY-MM-DDTHH:mm'),
      estimatedTime: 30, // 分钟
      children: [],
      focusSessions: [
        { startTime: today.subtract(3, 'hour').format('YYYY-MM-DDTHH:mm'), endTime: today.subtract(2, 'hour').add(30, 'minute').format('YYYY-MM-DDTHH:mm') }
      ]
    },
    // 明天的任务
    't3': {
      id: 't3',
      title: '学习React新特性',
      description: '学习React 19的新特性和最佳实践',
      status: 'TODO',
      priority: 'MEDIUM' as const,
      dueDate: today.add(1, 'day').format('YYYY-MM-DDTHH:mm'),
      tags: ['2'],
      createdAt: today.subtract(3, 'day').format('YYYY-MM-DDTHH:mm'),
      updatedAt: today.subtract(3, 'day').format('YYYY-MM-DDTHH:mm'),
      estimatedTime: 120, // 分钟
      children: []
    },
    // 即将逾期的任务
    't4': {
      id: 't4',
      title: '回复重要邮件',
      description: '回复客户关于合作的重要邮件',
      status: 'OVERDUE',
      priority: 'HIGH' as const,
      dueDate: today.subtract(1, 'day').format('YYYY-MM-DDTHH:mm'),
      tags: ['1'],
      createdAt: today.subtract(5, 'day').format('YYYY-MM-DDTHH:mm'),
      updatedAt: today.subtract(1, 'day').format('YYYY-MM-DDTHH:mm'),
      estimatedTime: 60, // 分钟
      children: []
    },
    // 已完成的任务
    't5': {
      id: 't5',
      title: '购买日用品',
      description: '购买家庭日常所需的日用品',
      status: 'COMPLETED',
      priority: 'LOW' as const,
      dueDate: today.subtract(2, 'day').format('YYYY-MM-DDTHH:mm'),
      tags: ['3'],
      createdAt: today.subtract(3, 'day').format('YYYY-MM-DDTHH:mm'),
      updatedAt: today.subtract(2, 'day').format('YYYY-MM-DDTHH:mm'),
      completedAt: today.subtract(2, 'day').format('YYYY-MM-DDTHH:mm'),
      estimatedTime: 60, // 分钟
      children: []
    },
    // 其他任务 - 子任务示例
    't6': {
      id: 't6',
      title: '准备团队演示文稿',
      description: '为下周的团队演示准备PPT',
      status: 'IN_PROGRESS',
      priority: 'HIGH' as const,
      dueDate: today.add(2, 'day').format('YYYY-MM-DDTHH:mm'),
      tags: ['1'],
      createdAt: today.subtract(1, 'day').format('YYYY-MM-DDTHH:mm'),
      updatedAt: today.subtract(1, 'hour').format('YYYY-MM-DDTHH:mm'),
      estimatedTime: 180, // 分钟
      children: ['t7', 't8']
    },
    't7': {
      id: 't7',
      title: '收集数据',
      description: '收集演示所需的项目数据',
      status: 'COMPLETED',
      priority: 'MEDIUM' as const,
      tags: ['1'],
      createdAt: today.subtract(1, 'day').format('YYYY-MM-DDTHH:mm'),
      updatedAt: today.subtract(2, 'hour').format('YYYY-MM-DDTHH:mm'),
      completedAt: today.subtract(2, 'hour').format('YYYY-MM-DDTHH:mm'),
      estimatedTime: 45, // 分钟
      parentId: 't6',
      children: []
    },
    't8': {
      id: 't8',
      title: '设计幻灯片',
      description: '设计演示文稿的幻灯片布局和内容',
      status: 'TODO',
      priority: 'HIGH' as const,
      tags: ['1'],
      createdAt: today.subtract(1, 'day').format('YYYY-MM-DDTHH:mm'),
      updatedAt: today.subtract(1, 'day').format('YYYY-MM-DDTHH:mm'),
      estimatedTime: 90, // 分钟
      parentId: 't6',
      children: []
    },
    // 重复任务示例
    't9': {
      id: 't9',
      title: '每日总结',
      description: '总结今日工作并规划明日任务',
      status: 'TODO',
      priority: 'MEDIUM' as const,
      dueDate: today.format('YYYY-MM-DDTHH:00'),
      tags: ['1', '3'],
      createdAt: today.subtract(7, 'day').format('YYYY-MM-DDTHH:mm'),
      updatedAt: today.format('YYYY-MM-DDTHH:mm'),
      estimatedTime: 30, // 分钟
      children: [],
      repeatType: 'DAILY' as const,
      repeatConfig: { interval: 1 }
    },
    't10': {
      id: 't10',
      title: '每周会议',
      description: '参加团队周会并汇报工作进度',
      status: 'IN_PROGRESS',
      priority: 'HIGH' as const,
      dueDate: today.format('YYYY-MM-DDTHH:30'),
      tags: ['1'],
      createdAt: today.subtract(14, 'day').format('YYYY-MM-DDTHH:mm'),
      updatedAt: today.format('YYYY-MM-DDTHH:mm'),
      estimatedTime: 60, // 分钟
      children: [],
      repeatType: 'WEEKLY' as const,
      repeatConfig: { days: ['Monday'] }
    }
  };
  
  return tasks as Record<string, any>; // 类型断言以避免构建错误
};