// src/utils/performance.js
export const withPerformanceLogging = (WrappedComponent, componentName) => {
  return React.memo((props) => {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // 60fps threshold
        console.warn(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
    });

    return <WrappedComponent {...props} />;
  });
};