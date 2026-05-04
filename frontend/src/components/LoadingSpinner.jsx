import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 24, text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 size={size} className="animate-spin text-primary" />
      {text && <p className="text-textSecondary text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
