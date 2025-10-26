import React, { useState, useRef, useEffect } from "react";
import { X, GripHorizontal } from "lucide-react";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import axios from "axios";
import { API_URL } from "../../config/config";
import cookies from "js-cookie";
import { toast } from "sonner";

interface PositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeDetailId: string;
}

interface Position {
  id: string;
  optionName: string;
  initialQty: string;
  currentQty: string;
  entryAppId: string;
  exitAppOrderId: string;
  entryPrice: number;
  closePrice: number;
  exchangeId: string;
  tradeDetailsId: string;
  closed: boolean;
  createdAt: string;
  updatedAt: string;
}

const PositionModal: React.FC<PositionModalProps> = ({
  isOpen,
  onClose,
  tradeDetailId,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const fetchPositions = async () => {
    if (!tradeDetailId) return;

    setIsLoading(true);
    const auth = cookies.get("auth");

    try {
      const response = await axios.get(
        `${API_URL}/user/position?id=${tradeDetailId}`,
        {
          headers: { Authorization: `Bearer ${auth}` },
        }
      );

      // Sort by updatedAt (latest on top)
      const sortedPositions = response.data.data.sort(
        (a: Position, b: Position) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setPositions(sortedPositions);
    } catch (error) {
      console.error("Error fetching positions:", error);
      toast.error("Failed to fetch position data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && tradeDetailId) {
      fetchPositions();
    }
  }, [isOpen, tradeDetailId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="fixed inset-0  bg-opacity-50" onClick={onClose} />
      <div
        ref={modalRef}
        className={`bg-gray-800 border border-gray-400 rounded-lg p-4 w-full max-w-7xl cursor-move select-none max-h-[90vh] overflow-hidden relative z-10 ${
          isDragging ? "opacity-90" : ""
        }`}
        style={{
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div
            className="flex items-center space-x-2 cursor-move"
            onMouseDown={handleMouseDown}
          >
            <GripHorizontal size={16} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-white">
              Position Details
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-300">Loading positions...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    Option Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    Initial Qty
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    Current Qty
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    Entry App ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    Exit App Order ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    Entry Price
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    Close Price
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    MTM
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    Trade Details ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    Closed
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    Created At
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 border-b border-gray-600">
                    Updated At
                  </th>
                </tr>
              </thead>
              <tbody>
                {positions.length > 0 ? (
                  positions.map((pos) => (
                    <tr
                      key={pos.id}
                      className="hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 py-2 text-xs text-white border-b border-gray-700">
                        {pos.optionName}
                      </td>
                      <td className="px-3 py-2 text-xs text-white border-b border-gray-700">
                        {pos.initialQty}
                      </td>
                      <td className="px-3 py-2 text-xs text-white border-b border-gray-700">
                        {pos.currentQty}
                      </td>
                      <td className="px-3 py-2 text-xs text-white border-b border-gray-700">
                        {pos.entryAppId || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-white border-b border-gray-700">
                        {pos.exitAppOrderId || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-white border-b border-gray-700">
                        {formatNumber(pos.entryPrice)}
                      </td>
                      <td className="px-3 py-2 text-xs text-white border-b border-gray-700">
                        {pos.closePrice ? formatNumber(pos.closePrice) : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700">
                        {formatCurrency(0)}
                      </td>
                      <td className="px-3 py-2 text-xs text-white border-b border-gray-700">
                        {pos.tradeDetailsId}
                      </td>
                      <td className="px-3 py-2 text-xs border-b border-gray-700">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            pos.closed
                              ? "bg-red-500/20 text-red-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {pos.closed ? "Closed" : "Open"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700">
                        {formatDate(pos.createdAt)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 border-b border-gray-700">
                        {formatDate(pos.updatedAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-3 py-8 text-center text-gray-400 text-sm"
                    >
                      No position data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="w-full flex justify-between ">
              <div className="px-5 ">
                <h1 className="text-white">Total MTM</h1>
              </div>
              <div className="px-5 ">
                <p>{formatCurrency(0)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PositionModal;
