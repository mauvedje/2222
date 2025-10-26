import React from "react";
import useStore from "../../store/store";

interface ChartTableOverlayProps {
  tradeId: string;
}

const ChartTableOverlay: React.FC<ChartTableOverlayProps> = ({ tradeId }) => {
  const { optionValues, instances } = useStore();

  const instance = instances.find((i) => i.id === tradeId);
  const option = optionValues.find((o) => o.id === tradeId);

  if (!instance) return null;

  const firstDetail = instance.tradeDetails?.[0];
  const totalMtm = instance.tradeDetails?.reduce((sum, td) => sum + (td.mtm || 0), 0) || 0;
  const totalQty = instance.tradeDetails?.reduce((sum, td) => sum + (td.qty || 0), 0) || 0;

  const data = [
    { label: "Index", value: instance.indexName || "-" },
    { label: "Expiry", value: instance.expiry || "-" },
    { label: "LTP Range", value: instance.ltpRange || "-" },
    { label: "LTP Spot", value: instance.ltpSpot?.toFixed(2) || "-" },
    { label: "Lowest Value", value: instance.lowestValue?.toFixed(2) || "-" },
    { label: "Live Premium", value: option?.lowestCombinedPremium?.toFixed(2) || "-" },
    { label: "Total Qty", value: totalQty || "-" },
    { label: "Total MTM", value: totalMtm?.toFixed(2) || "-" },
    { label: "Entry Type", value: firstDetail?.entryType || "-" },
    { label: "Entry Side", value: firstDetail?.entrySide || "-" },
  ];

  return (
    <div className="absolute top-2 left-2 z-10 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700" style={{ maxWidth: '75px' }}>
      <div className="p-0.5">
        <table className="w-full" style={{ fontSize: '4.5px' }}>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-700 last:border-b-0"
              >
                <td className="py-0.25 px-0.5 text-gray-400 font-medium">
                  {row.label}
                </td>
                <td className="py-0.25 px-0.5 text-white text-right font-mono">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChartTableOverlay;
