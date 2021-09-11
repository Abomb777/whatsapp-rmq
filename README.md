###Getting Started

```sh
docker run --network=NETWORK -p 5900 --name wapp -e PHONENUMBER=972**** -e RMQURL=amqp://user:pass@rabbitmq tanton/whatsapp-rmq
```