import { useState, useEffect, FormEvent, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminApi, authApi } from '../api';
import { useDebounce } from '../hooks/useDebounce';
import { TableRowSkeleton } from '../components/Skeleton';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ThemeToggle from '../components/ThemeToggle';

interface AuthPair {
  id: number;
  hospital_name: string;
  product_batch: string;
  created_at: number;
}

const AdminPairsPage = () => {
  const [pairs, setPairs] = useState<AuthPair[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const { isError, errorMessage, clearError, handleAsyncError } = useErrorHandler();

  // 使用防抖优化搜索
  const debouncedKeyword = useDebounce(keyword, 300);

  // 使用useMemo优化搜索结果
  const filteredPairs = useMemo(() => {
    if (!debouncedKeyword) {
      return pairs;
    }
    return pairs.filter(
      pair =>
        pair.hospital_name.toLowerCase().includes(debouncedKeyword.toLowerCase()) ||
        pair.product_batch.toLowerCase().includes(debouncedKeyword.toLowerCase())
    );
  }, [pairs, debouncedKeyword]);

  // 新增/编辑表单状态
  const [editingId, setEditingId] = useState<number | null>(null);
  const [hospitalName, setHospitalName] = useState('');
  const [productBatch, setProductBatch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchPairs();
  }, [debouncedKeyword, currentPage]);

  // 监听防抖后的关键词变化
  useEffect(() => {
    if (debouncedKeyword !== keyword) {
      setCurrentPage(1);
    }
  }, [debouncedKeyword, keyword]);

  const fetchPairs = useCallback(async () => {
    console.log('fetchPairs调用，参数:', { debouncedKeyword, currentPage });
    setIsLoading(true);
    clearError();
    
    await handleAsyncError(async () => {
         const response = await adminApi.getPairs(debouncedKeyword, currentPage, PAGE_SIZE);
         console.log('fetchPairs响应:', response);
         setPairs(response.data);
         setTotalPages(Math.ceil(response.total / PAGE_SIZE));
         console.log('更新本地状态，数据条数:', response.data.length);
         return response.data;
       });
    
    setIsLoading(false);
  }, [debouncedKeyword, currentPage, handleAsyncError, clearError]);

  const handleSearch = useCallback(
    (e: FormEvent) => {
      // 安全的preventDefault调用
      if (e.cancelable) {
        e.preventDefault();
      }
      setCurrentPage(1);
      fetchPairs();
    },
    [fetchPairs]
  );

  const handleAddOrUpdate = useCallback(
    async (e: FormEvent) => {
      // 安全的preventDefault调用
      if (e.cancelable) {
        e.preventDefault();
      }

      if (!hospitalName.trim() || !productBatch.trim()) {
        toast.error('医院名称和产品批号不能为空');
        return;
      }

      // 验证产品批号格式
      const batchRegex = /^[A-Za-z0-9-]{6,32}$/;
      if (!batchRegex.test(productBatch)) {
        toast.error('产品批号格式不正确，应为6-32位字母、数字或连字符');
        return;
      }

      setIsLoading(true);

      await handleAsyncError(async () => {
        if (editingId) {
          // 检查记录是否仍然存在
          const existingRecord = pairs.find(pair => pair.id === editingId);
          if (!existingRecord) {
            toast.error('要编辑的记录已不存在，请刷新页面后重试');
            resetForm();
            fetchPairs();
            return;
          }

          console.log('准备更新记录:', {
            editingId,
            hospital_name: hospitalName,
            product_batch: productBatch,
            existingRecord
          });

          // 更新
          const result = await adminApi.updatePair(editingId, {
            hospital_name: hospitalName,
            product_batch: productBatch
          });
          console.log('更新结果:', result);
          toast.success('更新成功');
        } else {
          // 新增
          const result = await adminApi.createPair(hospitalName, productBatch);
          console.log('添加结果:', result);
          toast.success('添加成功');
        }

        // 重置表单
        setHospitalName('');
        setProductBatch('');
        setEditingId(null);

        // 刷新列表
        fetchPairs();
        return true;
      });

      setIsLoading(false);
    },
    [hospitalName, productBatch, editingId, pairs, fetchPairs, navigate, handleAsyncError]
  );

  const handleEdit = useCallback((pair: AuthPair) => {
    setEditingId(pair.id);
    setHospitalName(pair.hospital_name);
    setProductBatch(pair.product_batch);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      console.log('删除按钮被点击，ID:', id);

      if (!window.confirm('确定要删除这条记录吗？')) {
        console.log('用户取消了删除操作');
        return;
      }

      console.log('用户确认删除，开始执行删除操作');
      setIsLoading(true);

      await handleAsyncError(async () => {
        console.log('正在调用删除API...');
        const result = await adminApi.deletePair(id);
        console.log('删除API调用成功，结果:', result);
        toast.success('删除成功');

        // 如果删除的是正在编辑的记录，重置编辑状态
        if (editingId === id) {
          console.log('重置编辑状态');
          resetForm();
        }

        console.log('刷新数据列表');
        fetchPairs();
        return result;
      });

      setIsLoading(false);
    },
    [editingId, fetchPairs, navigate, handleAsyncError]
  );

  const handleImportCSV = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      setIsLoading(true);

      try {
        const result = await adminApi.importCSV(formData);
        console.log('导入结果:', result);
        toast.success('导入成功');
        fetchPairs();
        // 重置文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error: any) {
        console.error('导入错误:', error);
        console.error('错误响应:', error.response);

        if (error.response?.status === 400) {
          toast.error(error.response.data?.error || 'CSV格式错误，请检查文件格式');
        } else if (error.response?.status === 401) {
          toast.error('权限不足，请重新登录');
          navigate('/admin/login');
        } else {
          toast.error(
            `导入失败: ${error.response?.data?.error || error.message || '请检查CSV格式'}`
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [fetchPairs, navigate]
  );

  const handleExportCSV = useCallback(async () => {
    try {
      setIsLoading(true);
      await adminApi.exportCSV();
      toast.success('导出成功');
    } catch (error: any) {
      console.error('导出错误:', error);
      if (error.response?.status === 401) {
        toast.error('权限不足，请重新登录');
        navigate('/admin/login');
      } else {
        toast.error(`导出失败: ${error.response?.data?.error || error.message || '请重试'}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await authApi.adminLogout();
      navigate('/admin/login');
    } catch (error) {
      toast.error('登出失败，请重试');
    }
  }, [navigate]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setHospitalName('');
    setProductBatch('');
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pairs.map(pair => pair.id));
    }
    setSelectAll(!selectAll);
  }, [selectAll, pairs]);

  const handleSelectItem = useCallback((id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.length === 0) {
      toast.error('请选择要删除的记录');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？`)) {
      return;
    }

    setIsLoading(true);
    try {
      // 批量删除
      await Promise.all(selectedIds.map(id => adminApi.deletePair(id)));
      toast.success(`成功删除 ${selectedIds.length} 条记录`);
      setSelectedIds([]);
      setSelectAll(false);
      fetchPairs();
    } catch (error) {
      toast.error('批量删除失败');
    } finally {
      setIsLoading(false);
    }
  }, [selectedIds, fetchPairs]);

  // 当pairs变化时，更新选择状态
  useEffect(() => {
    if (pairs.length === 0) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const currentPageIds = pairs.map(pair => pair.id);
      const selectedInCurrentPage = selectedIds.filter(id => currentPageIds.includes(id));
      setSelectAll(selectedInCurrentPage.length === pairs.length && pairs.length > 0);
    }
  }, [pairs, selectedIds]);

  return (
    <div className='container'>
      <div className='admin-header'>
        <h1>白名单管理</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ThemeToggle size='small' />
          <button className='btn btn-small' onClick={handleLogout}>
            登出
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {isError && (
        <div className="error-message">
          <span>{errorMessage}</span>
          <button onClick={clearError} className="error-close">
            ×
          </button>
        </div>
      )}

      {/* 搜索表单 */}
      <div className='card mb-20'>
        <form onSubmit={handleSearch} className='search-form' role='search' aria-label='搜索白名单'>
          <label htmlFor='search-input' className='sr-only'>
            搜索医院名称或产品批号
          </label>
          <input
            id='search-input'
            type='text'
            placeholder='搜索医院名称或产品批号'
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className='form-input'
            aria-describedby='search-help'
          />
          <div id='search-help' className='sr-only'>
            输入医院名称或产品批号进行搜索
          </div>
          <button type='submit' className='btn btn-primary' aria-label='执行搜索'>
            搜索
          </button>
          {keyword && (
            <button
              type='button'
              className='btn'
              onClick={() => {
                setKeyword('');
                setCurrentPage(1);
                fetchPairs();
              }}
              aria-label='清空搜索条件'
            >
              清空
            </button>
          )}
        </form>
      </div>

      {/* 添加/编辑表单 */}
      <div className='card mb-20'>
        <h3>{editingId ? '编辑白名单' : '添加白名单'}</h3>
        <form onSubmit={handleAddOrUpdate}>
          <div className='form-group'>
            <label htmlFor='hospitalName' className='form-label'>
              医院名称
            </label>
            <input
              type='text'
              id='hospitalName'
              className='form-input'
              value={hospitalName}
              onChange={e => setHospitalName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className='form-group'>
            <label htmlFor='productBatch' className='form-label'>
              产品批号
            </label>
            <input
              type='text'
              id='productBatch'
              className='form-input'
              value={productBatch}
              onChange={e => setProductBatch(e.target.value)}
              disabled={isLoading}
              placeholder='6-32位字母、数字或连字符'
              required
            />
          </div>

          <div className='form-actions'>
            <button type='submit' className='btn btn-primary' disabled={isLoading}>
              {editingId ? '更新' : '添加'}
            </button>
            {editingId && (
              <button type='button' className='btn' onClick={resetForm}>
                取消
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 导入/导出和批量操作 */}
      <div className='card mb-20'>
        <div className='admin-actions'>
          <div className='import-export-actions'>
            <div>
              <input
                type='file'
                accept='.csv'
                onChange={handleImportCSV}
                ref={fileInputRef}
                style={{ display: 'none' }}
                id='csvFileInput'
              />
              <button
                className='btn'
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                📁 导入CSV
              </button>
            </div>
            <button className='btn' onClick={handleExportCSV} disabled={isLoading}>
              📤 导出CSV
            </button>
          </div>

          {selectedIds.length > 0 && (
            <div className='batch-actions'>
              <span className='selected-count'>已选择 {selectedIds.length} 项</span>
              <button className='btn btn-danger' onClick={handleBatchDelete} disabled={isLoading}>
                🗑️ 批量删除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 搜索结果统计 */}
      {keyword && (
        <div className='search-results-info'>
          <span>
            搜索关键词: <span className='search-keyword'>"{keyword}"</span>
          </span>
          <span>
            找到 <strong>{filteredPairs.length}</strong> 条记录
          </span>
        </div>
      )}

      {/* 数据表格 */}
      <div className='card'>
        <table className='data-table' role='table' aria-label='白名单数据表格'>
          <caption className='sr-only'>
            白名单管理表格，包含医院名称、产品批号等信息，共 {filteredPairs.length} 条记录
          </caption>
          <thead>
            <tr>
              <th className='checkbox-column' scope='col'>
                <input
                  type='checkbox'
                  checked={selectAll}
                  onChange={handleSelectAll}
                  disabled={isLoading || filteredPairs.length === 0}
                  aria-label={selectAll ? '取消全选' : '全选所有项目'}
                />
              </th>
              <th scope='col'>ID</th>
              <th scope='col'>医院名称</th>
              <th scope='col'>产品批号</th>
              <th scope='col'>创建时间</th>
              <th scope='col'>操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // 显示骨架屏
              Array.from({ length: 5 }, (_, index) => (
                <TableRowSkeleton key={`skeleton-${index}`} />
              ))
            ) : filteredPairs.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className='empty-state'>
                    <div className='empty-state-icon'>📋</div>
                    <div className='empty-state-text'>暂无数据</div>
                    <div className='empty-state-subtext'>
                      {keyword
                        ? '没有找到匹配的记录，请尝试其他搜索条件'
                        : '还没有添加任何白名单记录'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPairs.map(pair => (
                <tr
                  key={pair.id}
                  className={selectedIds.includes(pair.id) ? 'selected' : ''}
                  aria-selected={selectedIds.includes(pair.id)}
                >
                  <td className='checkbox-column'>
                    <input
                      type='checkbox'
                      checked={selectedIds.includes(pair.id)}
                      onChange={() => handleSelectItem(pair.id)}
                      disabled={isLoading}
                      aria-label={`选择 ${pair.hospital_name} 的记录`}
                    />
                  </td>
                  <td>{pair.id}</td>
                  <td>{pair.hospital_name}</td>
                  <td>{pair.product_batch}</td>
                  <td>
                    <time dateTime={new Date(pair.created_at * 1000).toISOString()}>
                      {new Date(pair.created_at * 1000).toLocaleString()}
                    </time>
                  </td>
                  <td>
                    <div
                      className='action-buttons'
                      role='group'
                      aria-label={`${pair.hospital_name} 的操作`}
                    >
                      <button
                        className='btn btn-small btn-edit'
                        onClick={() => handleEdit(pair)}
                        disabled={isLoading}
                        aria-label={`编辑 ${pair.hospital_name} 的记录`}
                      >
                        ✏️
                      </button>
                      <button
                        className='btn btn-small btn-danger'
                        onClick={() => handleDelete(pair.id)}
                        disabled={isLoading}
                        aria-label={`删除 ${pair.hospital_name} 的记录`}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className='pagination'>
            <button
              className='btn btn-small'
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isLoading}
            >
              上一页
            </button>
            <span>
              第 {currentPage} 页，共 {totalPages} 页
            </span>
            <button
              className='btn btn-small'
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || isLoading}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPairsPage;
