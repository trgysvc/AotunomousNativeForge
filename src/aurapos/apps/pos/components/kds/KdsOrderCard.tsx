import React from 'react';

interface KdsOrderCardProps {
  itemName: string;
  quantity: number;
  station: string;
  timer: string;
}

const KdsOrderCard: React.FC<KdsOrderCardProps> = ({
  itemName,
  quantity,
  station,
  timer,
}) => {
  return (
    <div className="flex flex-col p-4 border rounded-lg shadow-sm">
      <div className="flex justify-between items-start w-full">
        <div>
          <h3 className="font-semibold text-lg">{itemName}</h3>
          <div className="flex space-x-4 mt-1 text-sm">
            <span>Qty: {quantity}</span>
            <span>Station: {station}</span>
          </div>
        </div>
        <div className="ml-4">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {timer}
          </span>
        </div>
      </div>
    </div>
  );
};

export default KdsOrderCard;