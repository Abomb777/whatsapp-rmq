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
  reconnectRabbitMq() {
    console.log('reconnect_rabbit_mq')
    this.connectRabbitMq()
  }
  async connectRabbitMq() {
	 const rabbitMqUrl = process.env.RMQURL || config.rmq;
     //const rabbitMqUrl = config.rabbit.host;
    console.log('Starting RabbitMQ connection :', rabbitMqUrl);
	try {
		this.handler = amqplib.connect(rabbitMqUrl, { keepAlive: true }, function(err, conn) {
			
			console.log('err');
		});
	} catch(e){
		throw 'Parameter is not a number!';
		//console.log("err----",e)
	}
//	this.handler.on('error',function(){
//		throw 'Parameter is not a number!';
//	})
  }
  sendMessage(exchange, key, message) {
  //sendMessage(exchange, message) {
  //let key='';
    return this.handler
      .then(connection => {
        connection.on('error', (err) => {
          //console.log('connect_error ' + err.message, err)
          //this.reconnectRabbitMq()
		  setTimeout(this.reconnectRabbitMq.bind(this),3000);
        })
        return connection.createChannel()
      })
      .then(channel => channel.assertExchange(exchange, 'fanout', { durable: false })
        .then(() => channel.publish(exchange, key, Buffer.from(JSON.stringify(message))))
        .then(() => console.log('Sent message :', message))
        .then(() => channel.close())
      )
      .catch(e=>{
		 // console.log('ERRROR RRRR',e)
		  setTimeout(this.reconnectRabbitMq.bind(this),3000);
		  return 'message cannot be sent';
	  });
  }
  subscribeQueue(queue, messageHandler) {
    return this.handler
      .then(conn => {
      conn.on('error', (err) => {
          //console.log('connect_error ' + err.message, err)
          //this.reconnectRabbitMq()
		  setTimeout(this.reconnectRabbitMq.bind(this),3000);
		  setTimeout(this.subscribeQueue.bind(this),10000,queue, messageHandler);
        })
        return conn.createChannel()
        })
      .then(channel => {
        console.log(`Consuming from ${queue}`);
        return channel.assertQueue(queue, { exclusive: false })
          .then(() => channel.consume(queue, message => messageHandler(message.content.toString()), { noAck: true }))
          .then(() => console.log(`Consumed from ${queue}`))
      })
      .catch(e=>{
		  setTimeout(this.reconnectRabbitMq.bind(this),3000);
		  setTimeout(this.subscribeQueue.bind(this),10000,queue, messageHandler);
		  console.log("subscription Error");
	  });
  }
}
const rabbitMq = new RabbitMQ();
module.exports = rabbitMq;