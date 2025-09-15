import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../contexts/ThemeContext';

interface MenuBarProps {
  onNewChat: () => void;
  onToggleHistory: () => void;
  onClearHistory: () => void;
  onLogout: () => void;
  showHistory: boolean;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onNewChat,
  onToggleHistory,
  onClearHistory,
  onLogout,
  showHistory
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const { theme, toggleTheme } = useTheme();

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // 检查点击是否在菜单按钮或下拉菜单内
      if (toggleButtonRef.current && toggleButtonRef.current.contains(target)) {
        return; // 点击菜单按钮，不关闭
      }
      
      // 检查是否点击在下拉菜单内
      const menuDropdown = document.querySelector('.menu-dropdown');
      if (menuDropdown && menuDropdown.contains(target)) {
        return; // 点击菜单内容，不关闭
      }
      
      // 其他地方点击，关闭菜单
      setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    if (!isMenuOpen && toggleButtonRef.current) {
      const rect = toggleButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <div className='menu-bar' ref={menuRef}>
      <div className='menu-bar-right'>
        <button 
          ref={toggleButtonRef}
          className='menu-toggle-btn'
          onClick={toggleMenu}
          aria-label='打开菜单'
          aria-expanded={isMenuOpen}
        >
          <span className='menu-icon'>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        
        {isMenuOpen && createPortal(
          <div 
            className='menu-dropdown'
            style={{
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`
            }}
          >
            <button 
              className='menu-item'
              onClick={() => handleMenuItemClick(onNewChat)}
              title='开启新的对话'
            >
              <span className='menu-item-icon'>💬</span>
              新对话
            </button>
            
            <button 
              className='menu-item'
              onClick={() => handleMenuItemClick(onToggleHistory)}
            >
              <span className='menu-item-icon'>📋</span>
              {showHistory ? '关闭记录' : '聊天记录'}
            </button>
            
            <button 
              className='menu-item'
              onClick={() => handleMenuItemClick(onClearHistory)}
              title='清除对话记录'
            >
              <span className='menu-item-icon'>🗑️</span>
              清除记录
            </button>
            
            <button 
              className='menu-item'
              onClick={() => handleMenuItemClick(toggleTheme)}
              title={theme === 'light' ? '切换到暗黑模式' : '切换到明亮模式'}
            >
              <span className='menu-item-icon'>{theme === 'light' ? '🌙' : '☀️'}</span>
              {theme === 'light' ? '暗黑模式' : '明亮模式'}
            </button>
            
            <div className='menu-divider'></div>
            
            <button 
              className='menu-item menu-item-danger'
              onClick={() => handleMenuItemClick(onLogout)}
            >
              <span className='menu-item-icon'>🚪</span>
              登出
            </button>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};