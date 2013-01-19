ChatServer_socket.io
====================

This project is a simple sample to implement a chat server with socket.io.

After you downloaded it, remember to run 'npm install' to update all the node module dependencies.
You mya also check the package.json for the details.

To run the example, just type 'node app.js' to host the chat server at port 3000. Then just use
browsers to connect to http://localhost:3000 to join the chat room.

If you want to adopt Redis for the chat buffering, please set GLOBAL.USE_REDIS as true in File 
app.js. Of course, don't forget to run your Redis server. The Redis node module is only a Redis
client.
