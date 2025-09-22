import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import dayjs from 'dayjs';
import { mockTags, generateMockTasks } from './mockData';

// 任务状态类型
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

// 任务优先级类型
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

// 重复任务类型
export type RepeatType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

// 任务标签类型
export interface TaskTag {
  id: string;
  name: string;
  color: string;
}

// 任务类型
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: TaskTag['id'][];
  dueDate?: string;
  estimatedTime?: number; // 预估耗时（分钟）
  assignee?: string;
  parentId?: string;
  children: Task['id'][];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  repeatType?: RepeatType;
  repeatConfig?: Record<string, any>;
  reminderConfig?: { 
    time: string;
    type: 'BEFORE' | 'ON_TIME' | 'OVERDUE';
    minutes?: number;
  }[];
  focusSessions?: {
    startTime: string;
    endTime: string;
  }[];
}

// 智能文件夹类型
export interface SmartFolder {
  id: string;
  name: string;
  filter: Record<string, any>;
}

// 状态管理接口
interface TaskStore {
  // 数据
  tasks: Record<string, Task>;
  tags: Record<string, TaskTag>;
  smartFolders: Record<string, SmartFolder>;
  currentView: 'LIST' | 'KANBAN' | 'CALENDAR' | 'MIND_MAP';
  selectedTaskId?: string;
  theme: 'LIGHT' | 'DARK' | 'CUSTOM';
  customTheme?: Record<string, string>;

  // 任务操作
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'children'>) => Task['id'];
  updateTask: (id: Task['id'], updates: Partial<Task>) => void;
  deleteTask: (id: Task['id']) => void;
  addSubTask: (parentId: Task['id'], task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'children' | 'parentId'>) => Task['id'];
  markTaskAsComplete: (id: Task['id']) => void;
  changeTaskStatus: (id: Task['id'], status: TaskStatus) => void;
  updateTaskPriority: (id: Task['id'], priority: TaskPriority) => void;
  addTaskFocusSession: (id: Task['id'], startTime: string, endTime: string) => void;

  // 标签操作
  addTag: (tag: Omit<TaskTag, 'id'>) => TaskTag['id'];
  updateTag: (id: TaskTag['id'], updates: Partial<TaskTag>) => void;
  deleteTag: (id: TaskTag['id']) => void;

  // 智能文件夹操作
  addSmartFolder: (folder: Omit<SmartFolder, 'id'>) => SmartFolder['id'];
  updateSmartFolder: (id: SmartFolder['id'], updates: Partial<SmartFolder>) => void;
  deleteSmartFolder: (id: SmartFolder['id']) => void;

  // 视图和设置
  setCurrentView: (view: 'LIST' | 'KANBAN' | 'CALENDAR' | 'MIND_MAP') => void;
  selectTask: (id?: Task['id']) => void;
  setTheme: (theme: 'LIGHT' | 'DARK' | 'CUSTOM', customTheme?: Record<string, string>) => void;

  // 筛选和统计
  getFilteredTasks: (filters?: Record<string, any>) => Task[];
  getTaskTree: (id: Task['id']) => Task | null;
  getTaskChildren: (id: Task['id']) => Task[];
  getTaskParent: (id: Task['id']) => Task | null;
  getStats: () => {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
    averageCompletionTime: number | null;
    focusTimeToday: number;
    tasksByStatus: Record<TaskStatus, number>;
    tasksByPriority: Record<TaskPriority, number>;
    tasksByTag: Record<TaskTag['id'], number>;
  };
}

// 生成唯一ID
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 创建任务存储
const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // 初始数据
      tasks: generateMockTasks(),
      tags: mockTags,
      smartFolders: {},
      currentView: 'LIST',
      selectedTaskId: undefined,
      theme: 'LIGHT',

      // 任务操作
      addTask: (task) => {
        const id = generateId();
        set((state) => ({
          tasks: {
            ...state.tasks,
            [id]: {
              ...task,
              id,
              children: [],
              createdAt: dayjs().format('YYYY-MM-DDTHH:mm'),
              updatedAt: dayjs().format('YYYY-MM-DDTHH:mm')
            }
          }
        }));
        return id;
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [id]: {
              ...state.tasks[id],
              ...updates,
              updatedAt: dayjs().format('YYYY-MM-DDTHH:mm')
            }
          }
        }));
      },
      
      deleteTask: (id) => {
        set((state) => {
          // 递归删除子任务
          const deleteRecursive = (taskId: Task['id']) => {
            const task = state.tasks[taskId];
            if (task) {
              task.children.forEach(deleteRecursive);
              delete newTasks[taskId];
              
              // 从父任务中移除引用
              if (task.parentId) {
                const parent = newTasks[task.parentId];
                if (parent) {
                  parent.children = parent.children.filter(childId => childId !== taskId);
                }
              }
            }
          };
          
          const newTasks = { ...state.tasks };
          deleteRecursive(id);
          
          return { tasks: newTasks };
        });
      },
      
      addSubTask: (parentId, task) => {
        const id = generateId();
        set((state) => ({
          tasks: {
            ...state.tasks,
            [parentId]: {
              ...state.tasks[parentId],
              children: [...state.tasks[parentId].children, id],
              updatedAt: dayjs().format('YYYY-MM-DDTHH:mm')
            },
            [id]: {
              ...task,
              id,
              parentId,
              children: [],
              createdAt: dayjs().format('YYYY-MM-DDTHH:mm'),
              updatedAt: dayjs().format('YYYY-MM-DDTHH:mm')
            }
          }
        }));
        return id;
      },
      
      markTaskAsComplete: (id) => {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [id]: {
              ...state.tasks[id],
              status: 'COMPLETED',
              completedAt: dayjs().format('YYYY-MM-DDTHH:mm'),
              updatedAt: dayjs().format('YYYY-MM-DDTHH:mm')
            }
          }
        }));
      },
      
      changeTaskStatus: (id, status) => {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [id]: {
              ...state.tasks[id],
              status,
              updatedAt: dayjs().format('YYYY-MM-DDTHH:mm'),
              ...(status === 'COMPLETED' && { completedAt: dayjs().format('YYYY-MM-DDTHH:mm') })
            }
          }
        }));
      },
      
      updateTaskPriority: (id, priority) => {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [id]: {
              ...state.tasks[id],
              priority,
              updatedAt: dayjs().format('YYYY-MM-DDTHH:mm')
            }
          }
        }));
      },
      
      addTaskFocusSession: (id, startTime, endTime) => {
        set((state) => ({
          tasks: {
            ...state.tasks,
            [id]: {
              ...state.tasks[id],
              focusSessions: [
                ...(state.tasks[id].focusSessions || []),
                { startTime, endTime }
              ],
              updatedAt: dayjs().format('YYYY-MM-DDTHH:mm')
            }
          }
        }));
      },

      // 标签操作
      addTag: (tag) => {
        const id = generateId();
        set((state) => ({
          tags: {
            ...state.tags,
            [id]: { ...tag, id }
          }
        }));
        return id;
      },
      
      updateTag: (id, updates) => {
        set((state) => ({
          tags: {
            ...state.tags,
            [id]: { ...state.tags[id], ...updates }
          }
        }));
      },
      
      deleteTag: (id) => {
        set((state) => {
          const newTags = { ...state.tags };
          delete newTags[id];
          
          // 从所有任务中移除该标签
          const newTasks = { ...state.tasks };
          Object.keys(newTasks).forEach(taskId => {
            newTasks[taskId].tags = newTasks[taskId].tags.filter(tagId => tagId !== id);
          });
          
          return { tags: newTags, tasks: newTasks };
        });
      },

      // 智能文件夹操作
      addSmartFolder: (folder) => {
        const id = generateId();
        set((state) => ({
          smartFolders: {
            ...state.smartFolders,
            [id]: { ...folder, id }
          }
        }));
        return id;
      },
      
      updateSmartFolder: (id, updates) => {
        set((state) => ({
          smartFolders: {
            ...state.smartFolders,
            [id]: { ...state.smartFolders[id], ...updates }
          }
        }));
      },
      
      deleteSmartFolder: (id) => {
        set((state) => {
          const newSmartFolders = { ...state.smartFolders };
          delete newSmartFolders[id];
          return { smartFolders: newSmartFolders };
        });
      },

      // 视图和设置
      setCurrentView: (view) => set({ currentView: view }),
      selectTask: (id) => set({ selectedTaskId: id }),
      setTheme: (theme, customTheme) => set({ theme, customTheme }),

      // 筛选和统计
      getFilteredTasks: (filters) => {
        const { tasks } = get();
        if (!filters) return Object.values(tasks);
        
        return Object.values(tasks).filter(task => {
          // 实现筛选逻辑
          for (const [key, value] of Object.entries(filters)) {
            if (key === 'status' && task.status !== value) return false;
            if (key === 'priority' && task.priority !== value) return false;
            if (key === 'tag' && !task.tags.includes(value)) return false;
            if (key === 'dueDateBefore' && (!task.dueDate || dayjs(task.dueDate).isAfter(dayjs(value)))) return false;
            if (key === 'dueDateAfter' && (!task.dueDate || dayjs(task.dueDate).isBefore(dayjs(value)))) return false;
            // 可以添加更多筛选条件
          }
          return true;
        });
      },
      
      getTaskTree: (id) => {
        const { tasks } = get();
        const task = tasks[id];
        if (!task) return null;
        
        // 创建任务树的副本，不修改原始任务数据
        const buildTree = (taskId: Task['id']) => {
          const originalTask = tasks[taskId];
          if (!originalTask) return null;
          
          // 创建任务副本
          const taskCopy = { ...originalTask };
          
          // 创建子任务数组副本（不修改原始数据）
          return taskCopy;
        };
        
        return buildTree(id);
      },
      
      getTaskChildren: (id) => {
        const { tasks } = get();
        const task = tasks[id];
        if (!task) return [];
        
        return task.children.map(childId => tasks[childId]).filter(Boolean);
      },
      
      getTaskParent: (id) => {
        const { tasks } = get();
        const task = tasks[id];
        if (!task || !task.parentId) return null;
        
        return tasks[task.parentId];
      },
      
      getStats: () => {
        const { tasks } = get();
        const taskList = Object.values(tasks);
        const now = dayjs();
        
        // 计算今天的专注时间
        const focusTimeToday = taskList.reduce((total, task) => {
          if (!task.focusSessions) return total;
          
          return total + task.focusSessions.reduce((taskTotal, session) => {
            const sessionStart = dayjs(session.startTime);
            const sessionEnd = dayjs(session.endTime);
            
            // 只计算今天的专注时间
            if (sessionStart.isSame(now, 'day') || sessionEnd.isSame(now, 'day')) {
              return taskTotal + sessionEnd.diff(sessionStart, 'minute');
            }
            return taskTotal;
          }, 0);
        }, 0);
        
        // 计算平均完成时间
        let totalCompletionTime = 0;
        let completedCount = 0;
        
        taskList.forEach(task => {
          if (task.status === 'COMPLETED' && task.completedAt) {
            const completionTime = dayjs(task.completedAt).diff(dayjs(task.createdAt), 'minute');
            totalCompletionTime += completionTime;
            completedCount++;
          }
        });
        
        const averageCompletionTime = completedCount > 0 ? totalCompletionTime / completedCount : null;
        
        return {
          totalTasks: taskList.length,
          completedTasks: taskList.filter(task => task.status === 'COMPLETED').length,
          overdueTasks: taskList.filter(task => 
            task.dueDate && 
            task.status !== 'COMPLETED' && 
            dayjs(task.dueDate).isBefore(now)
          ).length,
          highPriorityTasks: taskList.filter(task => task.priority === 'HIGH').length,
          averageCompletionTime,
          focusTimeToday,
          tasksByStatus: {
            'TODO': taskList.filter(task => task.status === 'TODO').length,
            'IN_PROGRESS': taskList.filter(task => task.status === 'IN_PROGRESS').length,
            'PAUSED': taskList.filter(task => task.status === 'PAUSED').length,
            'COMPLETED': taskList.filter(task => task.status === 'COMPLETED').length,
            'OVERDUE': taskList.filter(task => task.status === 'OVERDUE').length,
            'CANCELLED': taskList.filter(task => task.status === 'CANCELLED').length
          },
          tasksByPriority: {
            'HIGH': taskList.filter(task => task.priority === 'HIGH').length,
            'MEDIUM': taskList.filter(task => task.priority === 'MEDIUM').length,
            'LOW': taskList.filter(task => task.priority === 'LOW').length
          },
          tasksByTag: taskList.reduce((acc, task) => {
            task.tags.forEach(tagId => {
              acc[tagId] = (acc[tagId] || 0) + 1;
            });
            return acc;
          }, {} as Record<TaskTag['id'], number>)
        };
      }
    }),
    {
      name: 'task-manager-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export default useTaskStore;