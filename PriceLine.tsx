import React from "react";

interface PriceLineProps {
  id: string;
  price: number;
  color: "red" | "blue" | "green";
  label: string;
  position: number;
}

const PriceLine: React.FC<PriceLineProps> = ({ id, price, color, label, position }) => {
  const colorClasses = {
    red: "price-line-red",
    blue: "price-line-blue",
    green: "price-line-green",
  };

  return (
    <div
      className={`price-line ${colorClasses[color]}`}
      style={{ top: `${position}%` }}
    >
      <div className="price-line-label">{label}</div>
      <div className="price-line-value">{price.toFixed(2)}</div>
      <div className="price-line-id-tag">{id}</div>
    </div>
  );
};

export default PriceLine;
