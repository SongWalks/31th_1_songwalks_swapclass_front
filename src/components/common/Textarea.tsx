import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full min-h-[150px] p-4 text-sm text-gray-900 
          bg-white border border-gray-300 rounded-xl resize-none 
          placeholder:text-gray-400 focus:outline-none focus:border-gray-700
          transition-colors duration-200
          ${className}
        `}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
