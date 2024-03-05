import express from 'express';
import bodyParser from 'body-parser';
import { USERS, ORDERS } from './db.js';
import { authorizationMiddleware } from './middlewares.js';

const app = express();

app.use(bodyParser.json());

app.post('/users', (req, res) => {
 const { body } = req;

 console.log(`body`, JSON.stringify(body));

 const isUserExist = USERS.some(el => el.login === body.login);
 if (isUserExist) {
  return res.status(400).send({ message: `user with login ${body.login} already exists` });
 }

 USERS.push(body);

 res.status(200).send({ message: 'User was created' });
});

app.get('/users', (req, res) => {
 const users = USERS.map(user => {
  const { password, ...other } = user;
  return other;
 });
 return res
  .status(200)
  .send(users);
});

app.post('/login', (req, res) => {
 const { body } = req;

 const user = USERS
  .find(el => el.login === body.login && el.password === body.password);

 if (!user) {
  return res.status(400).send({ message: 'User was not found' });
 }

 const token = crypto.randomUUID();

 user.token = token;
 USERS.save(user.login, { token });

 return res.status(200).send({
  token,
  message: 'User was login'
 });
});

app.post('/orders', authorizationMiddleware, (req, res) => {
  const { body, user } = req;

  const price = Math.floor(Math.random() * (100 - 20 + 1)) + 20;

  const order = {
    ...body,
    login: user.login,
    price: price 
  };

  ORDERS.push(order);

  return res.status(200).send({ message: 'Order was created', order });
});

app.get('/orders', authorizationMiddleware, (req, res) => {
 const { user } = req;

 const orders = ORDERS.filter(el => el.login === user.login);

 return res.status(200).send(orders);
});

app.get('/orders/last5unique', authorizationMiddleware, (req, res) => {

  const { user } = req;
  const orders = ORDERS.filter(el => el.login === user.login);
  const fromAddresses = orders.map(order => order.from);
  const uniqueAddresses = [...new Set(fromAddresses)];
  const last5Unique = uniqueAddresses.slice(-5);

  if (!user) {

    return res.status(400).send({ message: `User was not found by token: ${req.headers.authorization}` });

  }

  return res.status(200).send(last5Unique);
});

app.get('/orders/last3unique', authorizationMiddleware, (req, res) => {

  const { user } = req;
  const orders = ORDERS.filter(el => el.login === user.login);
  const toAddresses = orders.map(order => order.to);
  const uniqueAddresses = [...new Set(toAddresses)];
  const last3Unique = uniqueAddresses.slice(-3);

  if (!user) {

    return res.status(400).send({ message: `User was not found by token: ${req.headers.authorization}` });

  }

  return res.status(200).send(last3Unique);
});

app.get('/orders/lowest', authorizationMiddleware, (req, res) => {

  const { user } = req;
  const orders = ORDERS.filter(el => el.login === user.login);

  if (!user) {

    return res.status(400).send({ message: `User was not found by token: ${req.headers.authorization}` });

  }

  if (orders.length === 0) {

    return res.status(404).send({ message: 'User does not have orders yet' });

  }

  const lowestOrder = orders.reduce((prev, curr) => prev.price < curr.price ? prev : curr);


  return res.status(200).send(lowestOrder);
});

app.get('/orders/highest', authorizationMiddleware, (req, res) => {

  const { user } = req;
  const orders = ORDERS.filter(el => el.login === user.login);

  if (!user) {

    return res.status(400).send({ message: `User was not found by token: ${req.headers.authorization}` });

  }

  if (orders.length === 0) {

    return res.status(404).send({ message: 'User does not have orders yet' });

  }

  const highestOrder = orders.reduce((prev, curr) => prev.price > curr.price ? prev : curr);

  return res.status(200).send(highestOrder);
});

app.listen(8080, () => console.log('Server was started'));