'use strict';
const amqplib = require('amqplib');
const Promise = require('bluebird');
const config = require('./config');
//const _ = require('lodash');
//const logger = require('./logger');
class RabbitMQ {
  constructor() {
    //this.rabbitConfig = config.get('rabbitmq');
   // const rabbitMqUrl = `amqp://${this.rabbitConfig.user}:${this.rabbitConfig.password}@${this.rabbitConfig.host}`;
   
  this.connectRabbitMq();
  }
  reconnectRabbitMq () {
    console.log('reconnect_rabbit_mq')
    this.connectRabbitMq()
  }
  connectRabbitMq () {
	  console.log(process.env);
	  const rabbitMqUrl = process.env.RMQURL;
     //const rabbitMqUrl = config.rabbit.host;
    console.log('Starting RabbitMQ connection :', rabbitMqUrl);
    this.handler = amqplib.connect(rabbitMqUrl, { keepAlive: true });
  }
  sendMessage(exchange, key, message) {
  //sendMessage(exchange, message) {
  key='';
    return this.handler
      .then(connection => {
        connection.on('error', (err) => {
          console.log('connect_error ' + err.message, err)
          this.reconnectRabbitMq()
        })
        return connection.createChannel()
      })
      .then(channel => channel.assertExchange(exchange, 'fanout', { durable: false })
        .then(() => channel.publish(exchange, key, Buffer.from(JSON.stringify(message))))
        .then(() => console.log('Sent message :', message))
        .then(() => channel.close())
      )
      .catch(console.log);
  }
  subscribeQueue(queue, messageHandler) {
    return this.handler
      .then(conn => {
      conn.on('error', (err) => {
          console.log('connect_error ' + err.message, err)
          this.reconnectRabbitMq()
        })
        return conn.createChannel()
        })
      .then(channel => {
        console.log(`Consuming from ${queue}`);
        return channel.assertQueue(queue, { exclusive: false })
          .then(() => channel.consume(queue, message => messageHandler(message.content.toString()), { noAck: true }))
          .then(() => console.log(`Consumed from ${queue}`))
      })
      .catch(console.log);
  }
}
const rabbitMq = new RabbitMQ();
module.exports = rabbitMq;