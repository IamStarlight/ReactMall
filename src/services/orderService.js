// const defaultList = [
//   {
//     id: 1,
//     userId: 1,
//     orderNo: '201801010001',
//     createTime: '2018-01-01 00:00:00',
//     payTime: '2018-01-01 00:00:00',
//     status: 0, // 0,未支付 1已支付 2发货 3确认收货 4 退款
//     price: 100,
//     goodId: 1,
//     type: 1,
//     quantity: 1,
//     remarksValue: "hhhhh"
//   }
// ]

// class OrderService {
//   list = [];

//   constructor() {
//     this._loadData();
//   }

//   createOrder (userId, goodId, price, type, quantity, remarksValue) {
//     const orderNo = new Date().getTime();
//     // 从list中找到最大值，生成新的id
//     const maxId = this.list.reduce((max, item) => {
//       return item.id > max ? item.id : max;
//     }, 0);

//     const order = {
//       id: maxId + 1,
//       userId,
//       goodId,
//       orderNo,
//       createTime: new Date().toLocaleString(),
//       status: 0,
//       price,
//       type,
//       quantity,
//       remarksValue
//     }
//     this.list.push(order);
//     this._saveData();
//     return order;
//   }

//   payOrder (orderId) {
//     const order = this.getOrderById(orderId);
//     if (!order)
//     {
//       return false;
//     }

//     order.status = 1;
//     order.payTime = new Date().toLocaleString();
//     this._saveData();
//     return true;
//   }

//   getOrderById (orderId) {
//     return this.list.find(item => item.id === orderId);
//   }
//   //获得指定用户的所有订单
//   getOrdersByUserId (userId) {
//     return this.list.filter(order => order.userId === userId);
//   }

//   // 将数据存入到localstorage中
//   _saveData () {
//     //localStorage.clear()
//     localStorage.setItem('orderList', JSON.stringify(this.list));
//   }

//   _loadData () {
//     const list = localStorage.getItem('orderList');
//     if (list)
//     {
//       this.list = JSON.parse(list);
//     } else
//     {
//       this.list = defaultList;
//       this._saveData();
//     }
//   }
// }

// const orderService = new OrderService()
// export default orderService;

const axios = require('axios');

const defaultList = [
  {
    id: 1,
    userId: 1,
    orderNo: '201801010001',
    createTime: '2018-01-01 00:00:00',
    payTime: '2018-01-01 00:00:00',
    status: 0, // 0,未支付 1已支付 2发货 3确认收货 4 退款
    price: 100,
    goodId: 1,
    type: 1,
    quantity: 1,
    remarksValue: "hhhhh"
  }
];

class OrderService {
  list = [];
  baseUrl = '/api/orders';
  deliveryBaseUrl = '/api/deliveries';

  constructor() {
    this._loadData();
  }

  async createOrder (userId, rId, goodId, price, type, quantity, remarksValue) {
    const orderNo = new Date().getTime();
    //这里加一个存储rId到receiveperson，然后获取存储的id，赋值给rId
    //创建地址信息
    // const newAddress = {
    //   username: selectedAddress.username, // 示例数据，实际中应从用户输入获取
    //   userphone: selectedAddress.userphone,
    //   areaaddress: selectedAddress.areaaddress,
    //   detailaddress: selectedAddress.detailaddress,
    //   usercode: "518000",
    //   userId: user.id // 关联到当前用户
    // };
    const newOrderFrontend = {
      userId,
      rId,
      goodId,
      orderNo,
      createTime: new Date().toLocaleString(),
      status: 0, // 初始状态为未支付
      price,
      type,
      quantity,
      remarksValue
    };

    // 转换为后端格式
    const newOrderBackend = this.convertToDatabaseFormat(newOrderFrontend);

    try
    {
      // 发送 POST 请求到服务器以创建订单
      const response = await axios.post(this.baseUrl, newOrderBackend);
      const createdOrder = this.convertToFrontendFormat(response.data);

      // 创建对应的 deliveryInfo
      await this.createDeliveryInfo(createdOrder.id, createdOrder.orderNo);

      // 更新本地订单列表
      this.list.push(createdOrder);

      return createdOrder;
    } catch (error)
    {
      console.error('Error creating order:', error);
      return null;
    }
  }

  // 创建默认的 deliveryInfo
  async createDeliveryInfo (orderId, orderNo) {
    const defaultDeliveryInfo = {
      id: orderId.toString(), // 使用订单ID作为 deliveryInfo 的 ID
      deliveryNum: orderNo.toString(), // 使用订单号作为配送编号
      submit: '订单已提交，等待付款',
      pay: '',
      transfer1: '',
      transfer1Time: '',
      transfer2: '',
      transfer2Time: '',
      transfer3: '',
      transfer3Time: '',
      transfer4: '',
      transfer4Time: '',
      send: '',
      sendTime: '',
      signFor: ''
    };

    try
    {
      await axios.post(this.deliveryBaseUrl, defaultDeliveryInfo);
    } catch (error)
    {
      console.error('Error creating delivery info:', error);
    }
  }
  // 添加新商品
  async addOrderGood (good) {
    try
    {
      const dbGood = good;
      const response = await axios.post('/api/orderGoods', dbGood);
      return response.data;
    } catch (error)
    {
      console.error('Error adding good:', error);
      throw error;
    }
  }

  // 根据 orderNum 获取所有关联的 orderGood
  async getGood (orderNum) {
    try
    {
      // 发起 GET 请求以获取与 orderNum 关联的所有 orderGood
      const orderGoodsResponse = await axios.get('/api/orderGoods', {
        params: { orderNum }
      });

      // 确保从响应中提取 data 属性
      const orderGoods = orderGoodsResponse.data;

      // 打印 orderGoods 以检查结果
      console.log(orderGoods);

      // 返回获取的 orderGoods
      return orderGoods;
    } catch (error)
    {
      console.error('Error fetching order goods:', error);
      throw error;
    }
  }

  async payOrder (orderId, type) {
    try
    {
      // 获取订单
      const order = await this.getOrderById(orderId);
      if (!order)
      {
        return false;
      }

      // 更新订单状态
      if (type === '微信支付')
      {
        order.type = 5; // 假设状态码 5 表示微信支付成功
        order.status = 1;
      } else
      {
        order.type = 6; // 假设状态码 6 表示其他支付方式成功
        order.status = 1;
      }
      order.payTime = new Date().toLocaleString();

      // 转换为后端格式
      const updatedOrderBackend = this.convertToDatabaseFormat(order);

      // 更新订单信息
      const response = await axios.put(`${this.baseUrl}/${orderId}`, updatedOrderBackend);
      const updatedOrder = response.data;

      // 更新本地订单数据
      const index = this.list.findIndex(item => item.id === orderId);
      if (index !== -1)
      {
        this.list[index] = updatedOrder;
      }

      // 获取对应的 deliveryInfo
      const deliveryResponse = await axios.get(`${this.deliveryBaseUrl}/${orderId}`);
      const deliveryInfo = deliveryResponse.data;

      // 更新 deliveryInfo 的 `pay` 字段
      deliveryInfo.pay = "订单付款成功";

      // 发送更新请求到服务器
      await axios.put(`${this.deliveryBaseUrl}/${orderId}`, deliveryInfo);

      return true;
    } catch (error)
    {
      console.error('Error paying order:', error);
      return false;
    }
  }

  async getDeliveryByOrderId (orderId) {
    try
    {
      const response = await axios.get(`${this.deliveryBaseUrl}/${orderId}`);
      return response.data;
    } catch (error)
    {
      console.error(`Error fetching delivery info for order ID ${orderId}:`, error);
      throw error;
    }
  }

  getOrderById (orderId) {
    return this.list.find(item => item.id === orderId);
  }

  // 根据ID从服务器获取单个订单
  async getOrderById2 (orderId) {
    try
    {
      // 发送 GET 请求到服务器，获取特定的订单
      const response = await axios.get(`${this.baseUrl}/${orderId}`);
      return this.convertToFrontendFormat(response.data);
    } catch (error)
    {
      console.error(`Error fetching order with ID ${orderId}:`, error);
      return null;
    }
  }

  // 根据用户ID从服务器获取订单列表
  async getOrdersByUserId (userId) {
    try
    {
      // 发送 GET 请求到服务器，获取特定用户的订单列表
      const response = await axios.get(this.baseUrl, {
        params: { userId } // 使用查询参数过滤订单
      });
      return response.data.map(this.convertToFrontendFormat);
    } catch (error)
    {
      console.error(`Error fetching orders for user with ID ${userId}:`, error);
      return [];
    }
  }



  async getOrdersByUserId (userId) {
    try
    {
      const response = await axios.get(`${this.baseUrl}?userId=${userId}`);
      return response.data;
    } catch (error)
    {
      console.error('Error fetching orders by userId:', error);
      return [];
    }
  }
  async deleteOrder(orderId) {
    try {
      // 发送 DELETE 请求到服务器以删除订单
      await axios.delete(`${this.baseUrl}/${orderId}`);
      // 从本地订单列表中删除
      this.list = this.list.filter(order => order.id !== orderId);
      return true;
    } catch (error) {
      console.error(`Error deleting order with ID ${orderId}:`, error);
      return false;
    }
  }
  
  async _loadData () {
    try
    {
      const response = await axios.get(this.baseUrl);
      this.list = response.data.map(order => this._convertToFrontendFormat(order));
    } catch (error)
    {
      console.error('Error loading data:', error);
      this.list = defaultList;
    }
  }

  // 将后端格式转换为前端格式
  convertToFrontendFormat (dbOrder) {
    return {
      id: parseInt(dbOrder.id, 10),
      userId: dbOrder.userId,
      rId: dbOrder.receivePerson,
      orderNo: dbOrder.orderNum,
      createTime: dbOrder.submitTime,
      payTime: dbOrder.payTime || null,
      status: this._convertStatusToNumber(dbOrder.orderStatus),
      price: parseFloat(dbOrder.orderAmount.replace('￥', '')),
      goodId: dbOrder.goodId || 1, // 假设 goodId 如果不存在，默认值为 1
      type: 1, // 假设 type 默认值为 1
      quantity: 1, // 假设 quantity 默认值为 1
      remarksValue: dbOrder.remarksValue || '无'
    };
  }

  // 将前端格式转换为数据库格式
  convertToDatabaseFormat (frontendOrder) {
    return {
      id: frontendOrder.id ? frontendOrder.id.toString() : undefined, // id 可能在创建时不存在
      orderNum: frontendOrder.orderNo,
      receivePerson: frontendOrder.rId.toString(), // 接收人ID
      userId: frontendOrder.userId.toString(),
      orderAmount: `￥${frontendOrder.price.toFixed(2)}`,
      orderStatus: this._convertStatusToString(frontendOrder.status),
      deliveryWay: "暂无", // 假设默认值
      deliveryNum: "暂无", // 假设默认值
      payBy: this._convertStatusToString(frontendOrder.type),
      submitTime: frontendOrder.createTime,
      payTime: frontendOrder.payTime || "",
      deliveryTime: "",
      receiveTime: "",
      commentTime: ""
    };
  }

  // 辅助函数：将订单状态字符串转换为数字状态码
  _convertStatusToNumber (status) {
    switch (status)
    {
      case '待付款': return 0;
      case '待发货': return 1;
      case '已发货': return 2;
      case '已完成': return 3;
      case '已关闭': return 4;
      case '微信支付': return 1;
      case '支付宝': return 1;
      default: return 0; // 默认状态为 0（待付款）
    }
  }

  // 辅助函数：将订单状态数字状态码转换为字符串
  _convertStatusToString (status) {
    switch (status)
    {
      case 0: return '待付款';
      case 1: return '待发货';
      case 2: return '已发货';
      case 3: return '已完成';
      case 4: return '已关闭';
      case 5: return '微信支付';
      case 6: return '支付宝';
      default: return '待付款'; // 默认状态为 '待付款'
    }
  }

}

const orderService = new OrderService();
export default orderService;
