import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
      <h2 className="text-3xl font-semibold mb-6">页面未找到</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        抱歉，您要访问的页面不存在或已被移除。
      </p>
      <Link 
        to="/" 
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
      >
        返回首页
      </Link>
    </div>
  );
};

export default NotFound; 