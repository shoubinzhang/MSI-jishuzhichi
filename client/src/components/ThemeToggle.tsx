import React from 'react';
import { Button } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

interface ThemeToggleProps {
  size?: 'small' | 'middle' | 'large';
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'middle', 
  className = '' 
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="text"
      size={size}
      icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      title={theme === 'light' ? '切换到暗黑模式' : '切换到明亮模式'}
      aria-label={theme === 'light' ? '切换到暗黑模式' : '切换到明亮模式'}
    >
      {theme === 'light' ? '暗黑' : '明亮'}
    </Button>
  );
};

export default ThemeToggle;