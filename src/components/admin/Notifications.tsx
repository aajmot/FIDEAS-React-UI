import React, { useState } from 'react';
import { notificationService } from '../../services/apiExtensions';

const Notifications: React.FC = () => {
  const [voucherId, setVoucherId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [productId, setProductId] = useState('');

  const sendInvoice = async () => {
    const { data } = await notificationService.sendInvoiceEmail(Number(voucherId));
    alert(data.status === 'sent' ? 'Invoice sent!' : 'Failed to send');
  };

  const sendReminder = async () => {
    const { data } = await notificationService.sendPaymentReminder(Number(partyId));
    alert(data.status === 'sent' ? 'Reminder sent!' : 'Failed to send');
  };

  const sendStockAlert = async () => {
    const { data } = await notificationService.sendLowStockAlert(Number(productId));
    alert(data.status === 'sent' ? 'Alert sent!' : 'Failed to send');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      
      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h3 className="font-bold mb-2">Send Invoice Email</h3>
          <input type="number" placeholder="Voucher ID" value={voucherId}
                 onChange={(e) => setVoucherId(e.target.value)}
                 className="border p-2 rounded mr-2" />
          <button onClick={sendInvoice} className="bg-blue-500 text-white px-4 py-2 rounded">
            Send
          </button>
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-bold mb-2">Send Payment Reminder</h3>
          <input type="number" placeholder="Party ID" value={partyId}
                 onChange={(e) => setPartyId(e.target.value)}
                 className="border p-2 rounded mr-2" />
          <button onClick={sendReminder} className="bg-orange-500 text-white px-4 py-2 rounded">
            Send
          </button>
        </div>

        <div className="border p-4 rounded">
          <h3 className="font-bold mb-2">Send Low Stock Alert</h3>
          <input type="number" placeholder="Product ID" value={productId}
                 onChange={(e) => setProductId(e.target.value)}
                 className="border p-2 rounded mr-2" />
          <button onClick={sendStockAlert} className="bg-red-500 text-white px-4 py-2 rounded">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
