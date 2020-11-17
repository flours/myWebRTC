FROM node

WORKDIR /root
RUN apt-get install git
RUN git clone https://github.com/kotazuck/webrtc-test
WORKDIR /root/webrtc-test
RUN npm install
RUN ls
RUN cat webpack.config.js
RUN npm run webpack
CMD ["node","server.js"]
