import React, { useEffect, useState } from 'react';
import PaginationControls from '../components/PaginationControls';
import usePagination from '../hooks/usePagination';
import { createTask, deleteTask, getTaskPriorities, getTasks, toggleTaskDone } from '../services/taskService';

const PRIORITY_BADGE = { 'Khẩn': 're', 'Bình thường': 'bl', 'Thấp': 'neutral' };
const PRIORITY_ICON  = { 'Khẩn': '🔴', 'Bình thường': '🔵', 'Thấp': '⚪' };

const EMPTY_FORM = { text: '', priority: 'Bình thường' };

// ─── Task Item ────────────────────────────────────────────────────────────────
const TaskItem = ({ task, onToggle, onDelete }) => (
  <div className={`task-item ${task.done ? 'done' : ''} task-pri-${task.priority === 'Khẩn' ? 'urgent' : task.priority === 'Bình thường' ? 'normal' : 'low'}`}>
    <button className="task-check" onClick={() => onToggle(task.id)}>
      {task.done ? '✓' : ''}
    </button>
    <div className="task-body">
      <span className="task-text">{task.text}</span>
      <div className="task-meta">
        <span className={`badge ${PRIORITY_BADGE[task.priority]}`} style={{ fontSize: '0.62rem' }}>
          {PRIORITY_ICON[task.priority]} {task.priority}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.created}</span>
      </div>
    </div>
    <button className="task-delete" onClick={() => onDelete(task.id)} title="Xóa">✕</button>
  </div>
);

// ─── Tasks Page ───────────────────────────────────────────────────────────────
const Tasks = () => {
  const [tasks, setTasks]       = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [filterPri, setFilterPri] = useState('Tất cả');
  const [filterDone, setFilterDone] = useState('Chưa xong');

  useEffect(() => {
    let mounted = true;

    Promise.all([getTasks(), getTaskPriorities()]).then(([taskList, priorityList]) => {
      if (!mounted) return;
      setTasks(taskList);
      setPriorities(priorityList);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const toggle = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updatedTask = await toggleTaskDone(task);
    setTasks(p => p.map(t => t.id === id ? updatedTask : t));
  };

  const remove = async (id) => {
    await deleteTask(id);
    setTasks(p => p.filter(t => t.id !== id));
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) return;
    const createdTask = await createTask(form);
    setTasks(p => [createdTask, ...p]);
    setForm(EMPTY_FORM);
  };

  const filtered = tasks.filter(t => {
    if (filterPri !== 'Tất cả' && t.priority !== filterPri) return false;
    if (filterDone === 'Chưa xong' && t.done) return false;
    if (filterDone === 'Đã xong'   && !t.done) return false;
    return true;
  });
  const taskPagination = usePagination(filtered, {
    initialPageSize: 10,
    resetDeps: [filterPri, filterDone],
  });

  const doneCount    = tasks.filter(t => t.done).length;
  const urgentCount  = tasks.filter(t => !t.done && t.priority === 'Khẩn').length;
  const pendingCount = tasks.filter(t => !t.done).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-title-block">
          <h1 className="page-title">Nhắc việc nội bộ</h1>
          <span className="page-subtitle">
            {urgentCount > 0 && <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{urgentCount} việc khẩn • </span>}
            {pendingCount} việc chưa xong / {tasks.length} tổng cộng
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge re" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>{urgentCount} Khẩn</span>
          <span className="badge gr" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>{doneCount} Xong</span>
        </div>
      </div>

      {/* Form thêm việc */}
      <div className="table-card" style={{ marginBottom: '20px' }}>
        <div className="settings-section-header">
          <span className="settings-section-title">➕ Thêm việc mới</span>
        </div>
        <form onSubmit={addTask} className="settings-form-inline">
          <input
            className="settings-input"
            placeholder="Mô tả công việc cần làm..."
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            style={{ flex: 3 }}
          />
          <select className="settings-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ minWidth: '130px' }}>
            {priorities.map(p => <option key={p} value={p}>{PRIORITY_ICON[p]} {p}</option>)}
          </select>
          <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Thêm việc</button>
        </form>
      </div>

      {/* Bộ lọc */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div className="fees-tabs">
          {['Tất cả', ...priorities].map(p => (
            <button key={p} className={`fees-tab-btn ${filterPri === p ? 'active' : ''}`} onClick={() => setFilterPri(p)}>
              {p} <span className="fees-tab-count">{p === 'Tất cả' ? tasks.length : tasks.filter(t => t.priority === p).length}</span>
            </button>
          ))}
        </div>
        <div className="fees-tabs">
          {['Tất cả', 'Chưa xong', 'Đã xong'].map(d => (
            <button key={d} className={`fees-tab-btn ${filterDone === d ? 'active' : ''}`} onClick={() => setFilterDone(d)}>{d}</button>
          ))}
        </div>
      </div>

      {/* Danh sách */}
      <div className="table-card">
        {filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Không có việc nào phù hợp.</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {taskPagination.pageItems.map(t => (
                <TaskItem key={t.id} task={t} onToggle={toggle} onDelete={remove} />
              ))}
              <PaginationControls
                page={taskPagination.page}
                totalPages={taskPagination.totalPages}
                totalItems={taskPagination.totalItems}
                pageSize={taskPagination.pageSize}
                startItem={taskPagination.startItem}
                endItem={taskPagination.endItem}
                onPageChange={taskPagination.setPage}
                onPageSizeChange={taskPagination.setPageSize}
                itemLabel="công việc"
                className="card"
              />
            </div>
        }
      </div>
    </div>
  );
};

export default Tasks;
