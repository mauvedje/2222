interface SpinnerProps {
  size?: number;
  color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 12, color = "gray-300" }) => {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div
        className={`animate-spin rounded-full border-4 border-${color} border-t-transparent`}
        style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
      ></div>
    </div>
  );
};

export default Spinner;
