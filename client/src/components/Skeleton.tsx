import React, { memo } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number; // 用于文本骨架屏的行数
}

const Skeleton: React.FC<SkeletonProps> = memo((
  {
    width = '100%',
    height = '1em',
    borderRadius = '4px',
    className = '',
    variant = 'text',
    animation = 'pulse',
    lines = 1
  }
) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return {
          borderRadius: '50%',
          width: height,
          height: height
        };
      case 'rectangular':
        return {
          borderRadius: 0
        };
      case 'text':
      default:
        return {
          borderRadius,
          height: '1em',
          marginBottom: '0.5em'
        };
    }
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-block',
    width,
    height: variant === 'text' ? '1em' : height,
    backgroundColor: '#e0e0e0',
    ...getVariantStyles()
  };

  const animationClass = animation !== 'none' ? `skeleton-${animation}` : '';
  const classes = `skeleton ${animationClass} ${className}`.trim();

  // 如果是文本类型且有多行，渲染多个骨架屏
  if (variant === 'text' && lines > 1) {
    return (
      <div className="skeleton-text-container">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={classes}
            style={{
              ...baseStyles,
              width: index === lines - 1 ? '60%' : width // 最后一行稍短
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={classes} style={baseStyles} />;
});

Skeleton.displayName = 'Skeleton';

// 预定义的骨架屏组件
export const MessageSkeleton: React.FC = memo(() => (
  <div className="message-skeleton">
    <div className="message assistant">
      <div className="message-content">
        <Skeleton variant="text" lines={2} width="100%" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  </div>
));

export const TableRowSkeleton: React.FC = memo(() => (
  <tr className="table-row-skeleton">
    <td><Skeleton width="20px" height="20px" variant="rectangular" /></td>
    <td><Skeleton width="150px" /></td>
    <td><Skeleton width="120px" /></td>
    <td><Skeleton width="100px" /></td>
    <td><Skeleton width="80px" /></td>
  </tr>
));

export const CardSkeleton: React.FC = memo(() => (
  <div className="card-skeleton">
    <Skeleton variant="rectangular" width="100%" height="200px" />
    <div style={{ padding: '16px' }}>
      <Skeleton variant="text" width="60%" height="24px" />
      <Skeleton variant="text" lines={2} />
    </div>
  </div>
));

export const UserInfoSkeleton: React.FC = memo(() => (
  <div className="user-info-skeleton">
    <Skeleton variant="circular" width="40px" height="40px" />
    <div style={{ marginLeft: '12px', flex: 1 }}>
      <Skeleton variant="text" width="120px" height="16px" />
      <Skeleton variant="text" width="80px" height="14px" />
    </div>
  </div>
));

export default Skeleton;