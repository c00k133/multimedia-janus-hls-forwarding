# Multimedia Services in Internet - Assignment 3 Repository

This serves as the project repository for the [Multimedia Services in Internet](https://mycourses.aalto.fi/course/view.php?id=28185) course at Aalto University, 2020.

The team/pair for this project consists of:
- Alazar Alemayehu Abebaw
- Axel Ilmari Neergaard

---

## Tools

Janus Gateway:
> [https://github.com/meetecho/janus-gateway](https://github.com/meetecho/janus-gateway)

Docker build tools for pre-defined Janus instance:
> [https://github.com/atyenoria/janus-webrtc-gateway-docker](https://github.com/atyenoria/janus-webrtc-gateway-docker)

Janus VideoRoom plugin:
> [https://janus.conf.meetecho.com/docs/videoroom.html](https://janus.conf.meetecho.com/docs/videoroom.html)

Docker image for nginx with RTMP configuration:
> [https://github.com/alfg/docker-nginx-rtmp](https://github.com/alfg/docker-nginx-rtmp)

---

## Setup

### Configuration

The Janus Docker image is unfortunately not published to a registry, so you will have to build the image yourself.
To work out of the box with this setup you must tag the image as `atyenoria/janus-webrtc-gateway-docker`.
The repository has a pre-configured Makefile for this purpose.
**Note**: building this image might take a while.

### Execution

The system requires [`docker-compose`](https://docs.docker.com/compose/) to run:
> docker-compose up

After this the project webpage is available at:
> [localhost:8080](http://localhost:8080)

To catch the RTP forwarded stream you also have to run the following script (the final stream will be available at [localhost:8080/live/janus/index.m3u8](http://localhost:8080/live/janus/index.m3u8)):
> ./bin/ffmpeg-rtp-to-rtmp

---

## Sources

Stopwatch video:
> [https://www.youtube.com/watch?v=9cQT4urTlXM](https://www.youtube.com/watch?v=9cQT4urTlXM)
