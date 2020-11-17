FROM node

WORKDIR /root
COPY webrtc-test /root/webrtc-test
WORKDIR /root/webrtc-test
RUN npm install
RUN npm run webpack
RUN cat src/js/*
CMD ["node","server.js"]
