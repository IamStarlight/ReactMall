import React, { useContext, useState, useEffect } from 'react';
import { ServiceContext } from '../contexts/ServiceContext';
import useLoginCheck from '../hook/LoginCheck';
//写几个组件，分支付，未支付//要有增删改查
const OrderListPage = () => {
  useLoginCheck();
  const [orders, setOrders] = useState([]);
  const service = useContext(ServiceContext);
  useEffect(() => {
    const currentUser = service.user.getCurrentUser(); // 获取当前用户信息
    setOrders(service.order.getOrdersByUserId(currentUser.id));
  }, []);


  return (
    <div>
      <h2>User Orders</h2>
      <ul>
        {orders.map(order => (
          <li key={order.id}>
            Order #{order.orderNo} - Status: {order.status === 1 ? 'Paid' : 'Unpaid'} - Created at: {order.createTime}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OrderListPage;