import React, { useState } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import useStore from "../../store/store";
import { useDraggableStore } from "../../store/store";

const DraggableBoxManager: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedBox, setSelectedBox] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    expiry: "",
    index: "",
    ltpRange: "",
  });

  const { indexData } = useStore();
  const {
    showDraggable1,
    showDraggable2,
    showDraggable3,
    setDraggableData1,
    setDraggableData2,
    setDraggableData3,
    setShowDraggable1,
    setShowDraggable2,
    setShowDraggable3,
  } = useDraggableStore();

  const handleAddBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.index && formData.expiry) {
      const newData = [
        {
          id: Date.now().toString(),
          index: formData.index,
          expiry: formData.expiry,
          ltpRange: formData.ltpRange,
        },
      ];

      if (selectedBox === 1) {
        setDraggableData1(newData);
      } else if (selectedBox === 2) {
        setDraggableData2(newData);
      } else {
        setDraggableData3(newData);
      }

      setFormData({
        expiry: "",
        index: "",
        ltpRange: "",
      });
      setShowForm(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setSelectedBox(1);
          setShowForm(true);
        }}
        className="fixed bottom-4 right-4 bg-blue-500 p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      >
        <Plus size={24} />
      </button>
      <div>
        <button
          onClick={() => setShowDraggable1()}
          className="fixed bottom-4 right-20 bg-blue-500 p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        >
          {showDraggable1 === true ? <Eye /> : <EyeOff />}
        </button>
        <button
          onClick={() => setShowDraggable2()}
          className="fixed bottom-16 right-20 bg-green-500 p-2 rounded-full shadow-lg hover:bg-green-600 transition-colors"
        >
          {showDraggable2 === true ? <Eye /> : <EyeOff />}
        </button>
        <button
          onClick={() => setShowDraggable3()}
          className="fixed bottom-28 right-20 bg-purple-500 p-2 rounded-full shadow-lg hover:bg-purple-600 transition-colors"
        >
          {showDraggable3 === true ? <Eye /> : <EyeOff />}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-500 p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-semibold mb-4">
              Add Row to Box {selectedBox}
            </h3>
            <form onSubmit={handleAddBox}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Select Box
                  </label>
                  <select
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedBox}
                    onChange={(e) =>
                      setSelectedBox(Number(e.target.value) as 1 | 2 | 3)
                    }
                  >
                    <option value={1}>Box 1</option>
                    <option value={2}>Box 2</option>
                    <option value={3}>Box 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Index
                  </label>
                  <select
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.index}
                    onChange={(e) =>
                      setFormData({ ...formData, index: e.target.value })
                    }
                  >
                    <option value="" disabled hidden>
                      Select Index
                    </option>
                    {indexData.indices.length > 0
                      ? indexData.indices.map((each) => (
                          <option key={each} value={each.toUpperCase()}>
                            {each.toUpperCase()}
                          </option>
                        ))
                      : null}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Expiry
                  </label>
                  <select
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.expiry}
                    onChange={(e) =>
                      setFormData({ ...formData, expiry: e.target.value })
                    }
                  >
                    <option value="" disabled hidden>
                      Select Expiry
                    </option>
                    {indexData.expiry[formData.index.toLowerCase()]?.length >
                      0 &&
                      indexData.expiry[formData.index.toLowerCase()].map(
                        (each) => (
                          <option key={each} value={each.toUpperCase()}>
                            {each.toUpperCase()}
                          </option>
                        )
                      )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    LTP Range
                  </label>
                  <input
                    type="number"
                    value={formData.ltpRange}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ltpRange: e.target.value,
                      })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Add Box
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraggableBoxManager;
