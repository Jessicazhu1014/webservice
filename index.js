import express from 'express';
import fs from 'fs/promises';
import cors from 'cors';



const app = express(); 
const port = process.env.PORT || 3001;
app.use(cors({
    origin: '*'
}));

let jsonData; 
let menu;
let cafes;
let users;

const readJson = async () => {
    const data = await fs.readFile('data.json', 'utf-8');
    jsonData = JSON.parse(data);
    menu = jsonData.menu;
    cafes = jsonData.cafes;
    users = jsonData.users;
}

readJson().then(() => {
    app.listen(port, () => {
        console.log(`App listening on port ${port}`);
    });
});

app.get('/menu', (req, res) => {
    res.send(menu);
});

app.get('/menu/category', (req, res) => {
    // /menu/category?category=coffee
    const category = req.query.category;
    const filteredMenu = menu.filter(item => item.category === category);
    res.send(filteredMenu);
});

app.get('/menu/filter', (req, res) => {
    // /menu/filter?availability=in_stock&max_price=5.00
    const availability = req.query.availability;
    const maxPrice = parseFloat(req.query.max_price);
    const filteredMenu = menu.filter(item => 
        item.availability === availability && item.price <= maxPrice
    );
    res.send(filteredMenu);
});

app.get('/cafes', (req, res) => {
    res.send(cafes);
});

app.get('/cafes/filter', (req, res) => {
    // /cafes/filter?type=independent&open_now=true
    const type = req.query.type;
    const openNow = req.query.open_now === 'true';
    const filteredCafes = cafes.filter(cafe => 
        cafe.type === type && cafe.open_now === openNow
    );
    res.send(filteredCafes);
});

app.get('/users', (req, res) => {
    res.send(users);
});

app.get('/users/:userId/orders', (req, res) => {
    // /users/user001/orders
    const userId = req.params.userId;
    const user = users.find(u => u.id === userId);
    if (user) {
        res.send(user.orders);
    } else {
        res.status(404).send({ message: 'User not found' });
    }
});

app.post('/users/:userId/order', async (req, res) => {
    const userId = req.params.userId;
    const { itemId, quantity, pickupTime } = req.query;

    const user = users.find(u => u.id === userId);
    const menuItem = menu.find(item => item.id === itemId);

    if (user && menuItem && menuItem.availability === 'in_stock') {
        const newOrder = {
            item_id: itemId,
            quantity: parseInt(quantity),
            status: 'pending',
            pickup_time: pickupTime,
            total_price: menuItem.price * parseInt(quantity)
        };

        user.orders.push(newOrder);
        await fs.writeFile('data.json', JSON.stringify(jsonData, null, 2));

        res.send({ message: 'Order placed successfully', order: newOrder });
    } else {
        res.status(400).send({ message: 'Unable to place order. Check item availability or user ID.' });
    }
});

