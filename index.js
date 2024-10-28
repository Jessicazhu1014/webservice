import express from 'express';
import fs from 'fs/promises';

const app = express();
const port = process.env.PORT || 3001;

let jsonData; 
let menu;
let cafes;
let users;

// 读取 JSON 文件
const readJson = async () => {
    const data = await fs.readFile('data.json', 'utf-8');
    jsonData = JSON.parse(data);
    menu = jsonData.menu;
    cafes = jsonData.cafes;
    users = jsonData.users;
};

// 启动服务器
readJson().then(() => {
    app.listen(port, () => {
        console.log(`App listening on port ${port}`);
    });
});

// 1. 查看菜单路由
app.get('/menu', (req, res) => {
    const { category, size, flavor, availability } = req.query;
    let filteredMenu = menu;

    // 根据查询参数进行过滤
    if (category) filteredMenu = filteredMenu.filter(item => item.category === category);
    if (size) filteredMenu = filteredMenu.filter(item => item.size?.includes(size));
    if (flavor) filteredMenu = filteredMenu.filter(item => item.flavor?.includes(flavor));
    if (availability) filteredMenu = filteredMenu.filter(item => item.availability === availability);

    res.send(filteredMenu);
});

// 2. 查找附近咖啡店路由
app.get('/nearby', (req, res) => {
    const { coordinates, radius, type, rating, open_now } = req.query;
    let filteredCafes = cafes;

    // 根据查询参数进行过滤
    if (type) filteredCafes = filteredCafes.filter(cafe => cafe.type === type);
    if (rating) filteredCafes = filteredCafes.filter(cafe => cafe.rating >= parseFloat(rating));
    if (open_now) filteredCafes = filteredCafes.filter(cafe => cafe.open_now === (open_now === 'true'));

    // 仅返回匹配的咖啡店列表
    res.send(filteredCafes);
});

// 3. 下单路由
app.post('/order', (req, res) => {
    const { item_id, user_id, quantity, customization, pickup_time } = req.query;

    // 查找用户和菜单项
    const user = users.find(u => u.id === user_id);
    const item = menu.find(m => m.id === item_id);

    if (!user || !item) {
        res.status(400).send({ error: 'Invalid user or item ID' });
        return;
    }

    // 创建订单对象
    const order = {
        item_id: item_id,
        quantity: parseInt(quantity),
        status: 'pending',
        customization: customization,
        pickup_time: pickup_time,
        total_price: item.price * parseInt(quantity)
    };

    // 将订单添加到用户的订单列表中
    user.orders.push(order);

    res.send({
        message: 'Order placed successfully',
        order: order
    });
});

// 4. 获取指定用户的订单路由
app.get('/user/:user_id', (req, res) => {
    const userId = req.params.user_id;
    const user = users.find(u => u.id === userId);

    if (user) {
        res.send(user.orders);
    } else {
        res.status(404).send({ error: 'User not found' });
    }
});

// 5. 获取单个菜单项的详细信息
app.get('/menu/:item_id', (req, res) => {
    const itemId = req.params.item_id;
    const item = menu.find(m => m.id === itemId);

    if (item) {
        res.send(item);
    } else {
        res.status(404).send({ error: 'Menu item not found' });
    }
});
