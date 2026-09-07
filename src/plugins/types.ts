import { ReactNode } from 'react';

export interface ToolDefinition {
  id: string;
  label: string;
  icon: string;
  render: () => ReactNode;
}
