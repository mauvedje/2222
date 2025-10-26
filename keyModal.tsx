import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../config/config";
import cookies from "js-cookie";
import { toast } from "sonner";
import Spinner from "../core/spinner";

interface KeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KeyData {
  apiKey: string;
  secretKey: string;
  keyType: "marketdata" | "interactive";
}

interface SavedKey {
  id: string;
  apiKey: string;
  apiSecret: string;
  keyName: string;
  keyType: "marketdata" | "interactive";
  createdAt: string;
}

const KeyModal: React.FC<KeyModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<KeyData>({
    apiKey: "",
    secretKey: "",
    keyType: "interactive",
  });

  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [originalFormData, setOriginalFormData] = useState<KeyData>({
    apiKey: "",
    secretKey: "",
    keyType: "interactive",
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
    }
  }, [isOpen]);

  const fetchKeys = async () => {
    const auth = cookies.get("auth");
    try {
      const response = await axios.get(`${API_URL}/user/keys`, {
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });
      const keys = response.data.keys || [];
      setSavedKeys(keys);

      // Find key-1 (interactive key) and select it by default
      const interactiveKey = keys.find((key: SavedKey) => key.keyName === "key-1");

      if (interactiveKey) {
        setSelectedKeyId("key-1");
        const initialData = {
          apiKey: interactiveKey.apiKey,
          secretKey: interactiveKey.apiSecret,
          keyType: "interactive" as const,
        };
        setFormData(initialData);
        setOriginalFormData(initialData);
      } else if (keys.length > 0) {
        // If no key-1, select the first available key
        const firstKey = keys[0];
        const keyType = firstKey.keyName === "key-1" ? "interactive" : "marketdata";
        const initialData = {
          apiKey: firstKey.apiKey,
          secretKey: firstKey.apiSecret,
          keyType: keyType as "interactive" | "marketdata",
        };
        setSelectedKeyId(firstKey.keyName);
        setFormData(initialData);
        setOriginalFormData(initialData);
      }

      setHasUnsavedChanges(false);
      setLoading(false);
    } catch {
      toast.error("Failed to fetch saved keys");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = cookies.get("auth");

    if (!selectedKeyId) {
      toast.error("Please select a key slot");
      return;
    }

    console.log("Submitting with values:", {
      apiKey: formData.apiKey,
      secretKey: formData.secretKey,
      keyName: selectedKeyId
    });

    try {
      await toast.promise(
        axios.put(
          `${API_URL}/user/keys?keyName=${selectedKeyId}`,
          { apiKey: formData.apiKey, apiSecret: formData.secretKey },
          {
            headers: {
              Authorization: `Bearer ${auth}`,
              "Content-Type": "application/json",
            },
          }
        ),
        {
          loading: "Updating API Key...",
          success: "API Key updated successfully!",
          error: "Failed to update API Key. Please try again.",
        }
      );

      console.log("Update completed successfully");

      // Refresh all keys after successful update
      await fetchKeys();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error updating key:", error);
    }
  };

  const handleKeyCardClick = (keyNum: number) => {
    // Check for unsaved changes before switching
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        "You have unsaved changes. Click 'Update Key' to save changes before switching keys."
      );
      if (!confirmSwitch) {
        return;
      }
    }

    const keyId = `key-${keyNum}`;
    setSelectedKeyId(keyId);

    // keyName determines type: key-1 is interactive, others are marketdata
    const keyType = keyNum === 1 ? "interactive" : "marketdata";

    // Find the key by keyName
    const foundKey = savedKeys.find((key) => key.keyName === keyId);

    if (foundKey) {
      const newData = {
        apiKey: foundKey.apiKey,
        secretKey: foundKey.apiSecret,
        keyType: keyType as "interactive" | "marketdata",
      };
      setFormData(newData);
      setOriginalFormData(newData);
    } else {
      // Empty form for new key
      const newData = {
        apiKey: "",
        secretKey: "",
        keyType: keyType as "interactive" | "marketdata",
      };
      setFormData(newData);
      setOriginalFormData(newData);
    }
    setHasUnsavedChanges(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-400  rounded-lg p-6 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">API Keys</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        {loading === false ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map((keyNum) => {
                const keyId = `key-${keyNum}`;
                const foundKey = savedKeys.find((k) => k.keyName === keyId);
                const isSelected = selectedKeyId === keyId;

                // keyName determines label: key-1 is Interactive, others are MarketData
                const keyLabel = keyNum === 1 ? "Interactive Key" : "MarketData Key";

                return (
                  <div
                    key={keyNum}
                    className={`bg-gray-700 p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-600 ${
                      isSelected ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => handleKeyCardClick(keyNum)}
                  >
                    <p className="text-white text-lg mb-2">
                      {keyLabel}
                    </p>
                    {foundKey ? (
                      <p className="text-sm text-green-400">Key configured</p>
                    ) : (
                      <p className="text-sm text-gray-400">No key configured</p>
                    )}
                  </div>
                );
              })}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Key Type
                </label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
                  value={formData.keyType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      keyType: e.target.value as "marketdata" | "interactive",
                    })
                  }
                  disabled
                >
                  <option value="marketdata">Market Data</option>
                  <option value="interactive">Interactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => {
                    const newData = { ...formData, apiKey: e.target.value };
                    setFormData(newData);
                    setHasUnsavedChanges(
                      newData.apiKey !== originalFormData.apiKey ||
                      newData.secretKey !== originalFormData.secretKey
                    );
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={formData.secretKey}
                  onChange={(e) => {
                    const newData = { ...formData, secretKey: e.target.value };
                    setFormData(newData);
                    setHasUnsavedChanges(
                      newData.apiKey !== originalFormData.apiKey ||
                      newData.secretKey !== originalFormData.secretKey
                    );
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {hasUnsavedChanges && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-md p-3">
                  <p className="text-yellow-500 text-sm">
                    You have unsaved changes. Click 'Update Key' to save your changes.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {selectedKeyId ? "Update Key" : "Add Key"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-40">
            <Spinner />
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyModal;
