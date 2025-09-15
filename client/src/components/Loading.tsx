import React, { memo } from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = memo(
  ({ size = 'medium', text = '加载中...', overlay = false }) => {
    const sizeClasses = {
      small: 'loading-small',
      medium: 'loading-medium',
      large: 'loading-large'
    };

    const content = (
      <div className={`loading-container ${sizeClasses[size]}`}>
        <div className='loading-spinner'>
          <div className='spinner-ring'></div>
          <div className='spinner-ring'></div>
          <div className='spinner-ring'></div>
        </div>
        {text && <div className='loading-text'>{text}</div>}
      </div>
    );

    if (overlay) {
      return <div className='loading-overlay'>{content}</div>;
    }

    return content;
  }
);

Loading.displayName = 'Loading';

export default Loading;
