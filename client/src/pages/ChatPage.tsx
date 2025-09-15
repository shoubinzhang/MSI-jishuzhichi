import { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi, chatApi } from '../api';
import Loading from '../components/Loading';
import { ErrorDisplay } from '../components/ErrorBoundary';
import { MessageSkeleton, UserInfoSkeleton } from '../components/Skeleton';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ThemeToggle from '../components/ThemeToggle';
import { MenuBar } from '../components/MenuBar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface UserInfo {
  hospital_name: string;
  product_batch: string;
  conversation_id?: string;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  
  const { error, isError, errorMessage, clearError } = useErrorHandler();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 本地存储键名 - 基于医院名称和产品批号的组合
  const getStorageKey = (hospitalName: string, productBatch: string) => {
    // 使用医院名称和产品批号的组合作为唯一标识
    const userKey = `${hospitalName}_${productBatch}`.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
    return `chat_messages_${userKey}`;
  };

  // 保存消息到本地存储
  const saveMessagesToStorage = useCallback(
    (messages: Message[], hospitalName: string, productBatch: string) => {
      try {
        const storageKey = getStorageKey(hospitalName, productBatch);
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (error) {
        console.warn('保存对话历史失败:', error);
      }
    },
    []
  );

  // 从本地存储加载消息
  const loadMessagesFromStorage = useCallback(
    (hospitalName: string, productBatch: string): Message[] => {
      try {
        const storageKey = getStorageKey(hospitalName, productBatch);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn('加载对话历史失败:', error);
      }
      return [];
    },
    []
  );

  useEffect(() => {
    // 获取用户信息
    const fetchUserInfo = async () => {
      try {
        const response = await authApi.getCurrentUser();
        
        if (!response) {
          setTimeout(() => navigate('/login'), 2000);
          setIsInitialLoading(false);
          return;
        }
        
        setUserInfo(response);

        // 从本地存储加载对话历史
        const storedMessages = loadMessagesFromStorage(response.hospital_name, response.product_batch);

        if (storedMessages.length > 0) {
          // 如果有存储的对话历史，直接加载
          setMessages(storedMessages);
        } else {
          // 如果没有对话历史，显示欢迎消息
          const welcomeMessage: Message = {
            role: 'assistant',
            content:
              '你好！我是普洛麦格（Promega）公司的MSI技术支持，专门解答与MSI产品相关的技术问题。如果你有任何关于MSI产品的使用疑问，请随时告诉我，我会尽力帮助你。',
            timestamp: Date.now()
          };
          setMessages([welcomeMessage]);
          // 保存欢迎消息到本地存储
          saveMessagesToStorage([welcomeMessage], response.hospital_name, response.product_batch);
        }
        
        setIsInitialLoading(false);
      } catch (error) {
        setTimeout(() => navigate('/login'), 2000);
        setIsInitialLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate, loadMessagesFromStorage, saveMessagesToStorage]);

  useEffect(() => {
    // 滚动到最新消息
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 自动保存消息到本地存储
  useEffect(() => {
    if (userInfo && messages.length > 0) {
      saveMessagesToStorage(messages, userInfo.hospital_name, userInfo.product_batch);
    }
  }, [messages, userInfo, saveMessagesToStorage]);

  const sendMessage = useCallback(async (message: string, retryCount = 0) => {
    const maxRetries = 2;

    try {
      const response = await chatApi.sendMessage(message);

      // 添加助手回复到列表
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer || '抱歉，我无法处理您的请求。',
          timestamp: Date.now()
        }
      ]);
    } catch (error: any) {
      // 详细的错误日志记录
       console.error(`sendMessage函数错误 (重试次数: ${retryCount}/${maxRetries}):`);
       console.error('错误对象:', error);
       console.error('错误消息:', error?.message);
       console.error('响应状态:', error?.response?.status);
       console.error('响应数据:', error?.response?.data);
       console.error('错误堆栈:', error?.stack);
       
       // 尝试序列化错误对象
       try {
         console.error('错误详情 (JSON):', JSON.stringify({
           name: error?.name,
           message: error?.message,
           code: error?.code,
           status: error?.response?.status,
           statusText: error?.response?.statusText,
           data: error?.response?.data,
           config: error?.config ? {
             url: error.config.url,
             method: error.config.method,
             headers: error.config.headers
           } : null
         }, null, 2));
       } catch (serializeError) {
         console.error('无法序列化错误对象:', serializeError);
       }
      
      if (retryCount < maxRetries) {
        // 自动重试
        setTimeout(
          () => {
            sendMessage(message, retryCount + 1);
          },
          1000 * (retryCount + 1)
        );
        toast.info(`发送失败，正在重试... (${retryCount + 1}/${maxRetries})`);
      } else {
        // 重试次数用完，显示错误消息
        let errorContent = '抱歉，消息发送失败。请检查网络连接后重试。';
        
        // 根据错误类型提供更具体的错误信息
         if (error?.message === '请不要重复发送相同的消息') {
           errorContent = '请不要重复发送相同的消息，请稍等片刻再试。';
         } else if (error?.message === '请求正在处理中，请稍候...') {
           errorContent = '上一个请求正在处理中，请稍候再试。';
         } else if (error?.response?.status === 401) {
           errorContent = '认证已过期，请重新登录。';
         } else if (error?.response?.status === 403) {
           errorContent = '没有权限发送消息。';
         } else if (error?.response?.status >= 500) {
           errorContent = '服务器错误，请稍后重试。';
         } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
           errorContent = '网络连接错误，请检查网络设置。';
         }
        
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: errorContent,
            timestamp: Date.now()
          }
        ]);
        toast.error(`发送消息失败: ${error?.message || '未知错误'}`);
      }
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      // 安全的preventDefault调用
      if (e.cancelable) {
        e.preventDefault();
      }
      if (!inputMessage.trim() || isLoading || !userInfo) return;

      const userMessage: Message = {
        role: 'user',
        content: inputMessage.trim(),
        timestamp: Date.now()
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInputMessage('');
      setIsLoading(true);
      clearError();

      try {
        const response = await chatApi.sendMessage(userMessage.content);

        const assistantMessage: Message = {
          role: 'assistant',
          content: response.answer || '抱歉，我无法处理您的请求。',
          timestamp: Date.now()
        };

        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);

        // 更新conversation_id (如果后端返回了新的conversation_id)
        if (response.conversation_id) {
          setUserInfo(prev => prev ? { ...prev, conversation_id: response.conversation_id } : null);
        }

        // 保存到本地存储
        saveMessagesToStorage(finalMessages, userInfo.hospital_name, userInfo.product_batch);
      } catch (error: any) {
        // 详细的错误日志记录
        console.error('聊天消息发送失败:');
        console.error('错误对象:', error);
        console.error('错误消息:', error?.message);
        console.error('响应状态:', error?.response?.status);
        console.error('响应数据:', error?.response?.data);
        console.error('错误堆栈:', error?.stack);
        
        // 尝试序列化错误对象
        try {
          console.error('错误详情 (JSON):', JSON.stringify({
            name: error?.name,
            message: error?.message,
            code: error?.code,
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data,
            config: error?.config ? {
              url: error.config.url,
              method: error.config.method,
              headers: error.config.headers
            } : null
          }, null, 2));
        } catch (serializeError) {
          console.error('无法序列化错误对象:', serializeError);
        }
        
        // 发送失败时添加错误消息到聊天记录
        let errorContent = '抱歉，消息发送失败。请检查网络连接后重试。';
        
        // 根据错误类型提供更具体的错误信息
         if (error?.message === '请不要重复发送相同的消息') {
           errorContent = '请不要重复发送相同的消息，请稍等片刻再试。';
         } else if (error?.message === '请求正在处理中，请稍候...') {
           errorContent = '上一个请求正在处理中，请稍候再试。';
         } else if (error?.response?.status === 401) {
           errorContent = '认证已过期，请重新登录。';
         } else if (error?.response?.status === 403) {
           errorContent = '没有权限发送消息。';
         } else if (error?.response?.status >= 500) {
           errorContent = '服务器错误，请稍后重试。';
         } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
           errorContent = '网络连接错误，请检查网络设置。';
         }
        
        const errorMessage: Message = {
          role: 'assistant',
          content: errorContent,
          timestamp: Date.now()
        };

        const finalMessages = [...newMessages, errorMessage];
        setMessages(finalMessages);
        
        // 保存到本地存储
        saveMessagesToStorage(finalMessages, userInfo.hospital_name, userInfo.product_batch);

        // 如果是认证错误，重定向到登录页
        if (error?.response?.status === 401) {
          navigate('/login');
        }
        
        // 显示toast错误提示
        toast.error(`发送消息失败: ${error?.message || '未知错误'}`);
      }

      setIsLoading(false);
    },
    [inputMessage, isLoading, userInfo, messages, clearError, saveMessagesToStorage, navigate]
  );

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (error) {
      toast.error('登出失败，请重试');
    }
  };

  const clearChatHistory = useCallback(() => {
    if (!userInfo) {
      return;
    }

    if (window.confirm('确定要清除所有对话记录吗？此操作不可撤销。')) {
      try {
        // 清除本地存储
        const storageKey = getStorageKey(userInfo.hospital_name, userInfo.product_batch);
        localStorage.removeItem(storageKey);

        // 重置为欢迎消息
        const welcomeMessage: Message = {
          role: 'assistant',
          content:
            '你好！我是普洛麦格（Promega）公司的MSI技术支持，专门解答与MSI产品相关的技术问题。如果你有任何关于MSI产品的使用疑问，请随时告诉我，我会尽力帮助你。',
          timestamp: Date.now()
        };
        setMessages([welcomeMessage]);

        toast.success('对话记录已清除');
      } catch (error) {
        toast.error('清除对话记录失败');
      }
    }
  }, [userInfo]);

  const startNewChat = useCallback(() => {
    if (!userInfo) {
      return;
    }

    if (window.confirm('确定要开启新的对话吗？当前对话将被保存到历史记录中。')) {
      try {
        // 当前对话保存到历史记录（如果有内容的话）
        if (messages.length > 1) {
          // 大于1表示除了欢迎消息还有其他对话
          const timestamp = Date.now();
          const historyKey = `chat_history_${userInfo.hospital_name}_${userInfo.product_batch}_${timestamp}`;
          const historyData = {
            timestamp,
            messages: messages,
            title:
              messages.find(m => m.role === 'user')?.content.substring(0, 20) + '...' || '新对话'
          };
          localStorage.setItem(historyKey, JSON.stringify(historyData));
        }

        // 开始新对话
        const welcomeMessage: Message = {
          role: 'assistant',
          content:
            '你好！我是普洛麦格（Promega）公司的MSI技术支持，专门解答与MSI产品相关的技术问题。如果你有任何关于MSI产品的使用疑问，请随时告诉我，我会尽力帮助你。',
          timestamp: Date.now()
        };
        setMessages([welcomeMessage]);

        // 更新当前对话存储
        saveMessagesToStorage([welcomeMessage], userInfo.hospital_name, userInfo.product_batch);

        toast.success('已开启新的对话');
      } catch (error) {
        toast.error('开启新对话失败');
      }
    }
  }, [userInfo, messages, saveMessagesToStorage]);

  const loadChatHistory = useCallback(() => {
    if (!userInfo) {
      return [];
    }

    try {
      const historyList: any[] = [];
      const userPrefix = `chat_history_${userInfo.hospital_name}_${userInfo.product_batch}_`;

      // 遍历localStorage查找该用户的历史记录
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(userPrefix)) {
          const historyData = localStorage.getItem(key);
          if (historyData) {
            try {
              const parsed = JSON.parse(historyData);
              historyList.push({ key, ...parsed });
            } catch (e) {
              console.warn('解析历史记录失败:', key);
            }
          }
        }
      }

      // 按时间戳降序排列
      return historyList.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.warn('加载聊天历史失败:', error);
      return [];
    }
  }, [userInfo]);

  const toggleHistoryView = useCallback(() => {
    if (!showHistory) {
      const history = loadChatHistory();
      setChatHistory(history);
    }
    setShowHistory(!showHistory);
  }, [showHistory, loadChatHistory]);

  // 点击空白区域关闭聊天记录面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showHistory) return;
      
      const target = event.target as Node;
      const historyPanel = document.querySelector('.chat-history-panel');
      const menuDropdown = document.querySelector('.menu-dropdown');
      const menuToggleBtn = document.querySelector('.menu-toggle-btn');
      
      // 检查点击是否在聊天记录面板内
      if (historyPanel && historyPanel.contains(target)) {
        return; // 点击面板内容，不关闭
      }
      
      // 检查是否点击的是菜单相关元素
      if ((menuDropdown && menuDropdown.contains(target)) || 
          (menuToggleBtn && menuToggleBtn.contains(target))) {
        return; // 点击菜单相关元素，不关闭（由菜单自己处理）
      }
      
      // 其他地方点击，关闭聊天记录面板
      setShowHistory(false);
    };

    if (showHistory) {
      // 延迟添加事件监听器，避免立即触发
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showHistory]);

  const loadHistoryChat = useCallback(
    (historyItem: any) => {
      if (window.confirm('确定要加载这个历史对话吗？当前对话将被保存。')) {
        try {
          // 保存当前对话到历史记录
          if (messages.length > 1 && userInfo) {
            const timestamp = Date.now();
            const historyKey = `chat_history_${userInfo.hospital_name}_${userInfo.product_batch}_${timestamp}`;
            const historyData = {
              timestamp,
              messages: messages,
              title:
                messages.find(m => m.role === 'user')?.content.substring(0, 20) + '...' || '新对话'
            };
            localStorage.setItem(historyKey, JSON.stringify(historyData));
          }

          // 加载历史对话
          setMessages(historyItem.messages);
          if (userInfo) {
            saveMessagesToStorage(
              historyItem.messages,
              userInfo.hospital_name,
              userInfo.product_batch
            );
          }

          setShowHistory(false);
          toast.success('历史对话已加载');
        } catch (error) {
          toast.error('加载历史对话失败');
        }
      }
    },
    [messages, userInfo, saveMessagesToStorage]
  );

  const deleteHistoryChat = useCallback(
    (historyKey: string) => {
      if (window.confirm('确定要删除这个历史对话吗？此操作不可撤销。')) {
        try {
          localStorage.removeItem(historyKey);
          const updatedHistory = loadChatHistory();
          setChatHistory(updatedHistory);
          toast.success('历史对话已删除');
        } catch (error) {
          toast.error('删除历史对话失败');
        }
      }
    },
    [loadChatHistory]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter发送，Ctrl+Enter换行
    if (e.key === 'Enter' && !e.ctrlKey) {
      // 只有在不是被动监听器的情况下才调用preventDefault
      if (e.cancelable) {
        e.preventDefault();
      }
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  }, []);

  if (isInitialLoading) {
    return (
      <div className='chat-page-container'>
        <div className='chat-container'>
          <div className='chat-header'>
            <UserInfoSkeleton />
            <div className='header-actions'>
              <button className='btn btn-new-chat' disabled>新对话</button>
              <button className='btn btn-history' disabled>聊天记录</button>
              <button className='btn btn-clear' disabled>清除记录</button>
              <button className='btn btn-logout' disabled>登出</button>
            </div>
          </div>
          <div className='chat-messages'>
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
          <div className='chat-input-form'>
            <textarea 
              className='chat-input' 
              placeholder='正在初始化聊天...' 
              disabled 
              rows={3}
            />
            <button className='btn btn-primary send-button' disabled>发送</button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='chat-page-container'>
        <div className='chat-container'>
          <ErrorDisplay title='加载失败' message={errorMessage} onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className='chat-page-container'>
      <a href='#chat-input' className='skip-link'>
        跳转到输入框
      </a>
      <div className='chat-container' role='main' aria-label='聊天界面'>
        <header className='chat-header' role='banner'>
          <div className='user-info'>
            {userInfo && (
              <>
                <div className='hospital-name' aria-label='医院名称'>
                  {userInfo.hospital_name}
                </div>
                <div className='product-batch' aria-label='产品批号'>
                  {userInfo.product_batch}
                </div>
              </>
            )}
          </div>
          <MenuBar
            onNewChat={startNewChat}
            onToggleHistory={toggleHistoryView}
            onClearHistory={clearChatHistory}
            onLogout={handleLogout}
            showHistory={showHistory}
          />
        </header>

        {showHistory && (
          <div className='chat-history-panel'>
            <div className='history-header'>
              <h3>聊天历史记录</h3>
              <span className='history-count'>共 {chatHistory.length} 条记录</span>
            </div>
            <div className='history-list'>
              {chatHistory.length === 0 ? (
                <div className='no-history'>暂无历史记录</div>
              ) : (
                chatHistory.map((item, index) => (
                  <div key={item.key} className='history-item'>
                    <div className='history-info'>
                      <div className='history-title'>{item.title || `对话 ${index + 1}`}</div>
                      <div className='history-time'>
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      <div className='history-preview'>
                        {item.messages
                          ?.find((m: any) => m.role === 'user')
                          ?.content?.substring(0, 50) || '无内容'}
                        ...
                      </div>
                    </div>
                    <div className='history-actions'>
                      <button
                        className='btn-load-history'
                        onClick={() => loadHistoryChat(item)}
                        title='加载此对话'
                      >
                        加载
                      </button>
                      <button
                        className='btn-delete-history'
                        onClick={() => deleteHistoryChat(item.key)}
                        title='删除此对话'
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className='chat-messages' role='log' aria-label='聊天记录' aria-live='polite'>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.role}`}
              role='article'
              aria-label={`${msg.role === 'user' ? '用户' : '助手'}消息`}
            >
              <div className='message-content'>
                <span className='sr-only'>{msg.role === 'user' ? '用户说：' : '助手回复：'}</span>
                <div className='message-text'>
                  {msg.content.split('\n').map((line, lineIndex) => (
                    <div key={lineIndex} className='message-line'>
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
                {msg.role === 'assistant' && (
                  <button
                    className='copy-button'
                    onClick={() => copyToClipboard(msg.content)}
                    title='复制消息'
                    aria-label='复制助手消息到剪贴板'
                  >
                    📋
                  </button>
                )}
              </div>
              <div className='message-time' aria-label='发送时间'>
                {new Date(msg.timestamp).toLocaleString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className='message assistant' aria-label='助手正在回复'>
              <div className='message-content'>
                <Loading size='small' text='正在思考...' />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
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

        <form
          className='chat-input-form'
          onSubmit={handleSubmit}
          role='form'
          aria-label='发送消息表单'
        >
          <textarea
            id='chat-input'
            className='chat-input'
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='输入消息，按Enter发送，Ctrl+Enter换行'
            disabled={isLoading}
            aria-label='消息输入框'
            aria-describedby='input-help'
            rows={3}
          />
          <div id='input-help' className='sr-only'>
            按Enter键发送消息，按Ctrl+Enter键换行
          </div>
          <button
            type='submit'
            className='btn btn-primary send-button'
            disabled={isLoading || !inputMessage.trim()}
            aria-label='发送消息'
          >
            发送
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
