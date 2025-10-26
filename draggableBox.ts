export interface DraggableBoxColumn {
  id: string;
  label: string;
  visible: boolean;
  width?: string;
}

export const defaultDraggableColumns: DraggableBoxColumn[] = [
  { id: "index", label: "Index", visible: true, width: "120px" },
  { id: "lowestValue", label: "Lowest Value", visible: true, width: "100px" },
  { id: "myValue1", label: "My Value", visible: true, width: "80px" },
  { id: "result1", label: "Result", visible: true, width: "80px" },
  { id: "myValue2", label: "My Value 1", visible: true, width: "80px" },
  { id: "result2", label: "Result", visible: true, width: "80px" },
  { id: "action", label: "Action", visible: true, width: "60px" },
];