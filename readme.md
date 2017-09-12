# Node Chat

Description:
A simple node app that lets you video chat and message with random people like chat roulette or omegle with the option to choose catagoeies to talk about. 
A video demo can be found here: https://www.youtube.com/watch?v=JtQALFAwrHo

### Technologies:
- WebRTC
- Node
- Socket.io
- JQuery

# Bugs / Known Issues
- For some reason, it doesnt work with windows or ubuntu (only works on mac).
- Using the back button on the search bar doesnt actually do anything because this is a single page application.
Moreover, It actually adds another 'socket id' to the list without removing the old id.

# How to run: 
1. make sure you have nodeJS installed.
2. either have nodemon installed by typing: 'npm install -g nodemon' in cmd line or in package.json change 'nodemon' to 'node'.
3. then in the root directory type: 'npm start' in cmd line to run.
4. if you dont have nodemon and dont want to install it, you can also type 'node zulu.js' in cmd line to run.

# Note: 
I used 'Diego Gonzalez' chat application as a foundation/template that I have changed and built upon. Link: https://github.com/dgonzalez21/Node-Chat
