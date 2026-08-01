declare module '*.jsx' {
  import React from 'react';

  const Component: React.ComponentType<object>;
  export default Component;
}

declare module '*.js' {
  const content: unknown;
  export default content;
}
