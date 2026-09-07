import { ToolDefinition } from './types';

/**
 * No built-in tools for now — kept as an export (rather than removed) so
 * `<DevicePreview tools={[...defaultTools, myCustomTool]}>` keeps working
 * if tools ship here again later. Mirrors Flutter's `DevicePreview.defaultTools`.
 */
export const defaultTools: ToolDefinition[] = [];
