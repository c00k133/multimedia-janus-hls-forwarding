# Multimedia Services in Internet - Assignment 3 Repository

This serves as the project repository for the [Multimedia Services in Internet](https://mycourses.aalto.fi/course/view.php?id=28185) course at Aalto University, 2020.

The team/pair for this project consists of:
- Alazar Alemayehu Abebaw
- Axel Ilmari Neergaard

---

## Setup

### Janus Gateway

_These steps assume that a Janus Docker image is already built with the tag_ `atyenoria/janus-webrtc-gateway-docker`.
1. Make any Janus configuration changes to the configuration files in `janus/conf`.
2. Execute the script `janus/bin/run`
    - This will create and run an ephemereal Docker container with Janus installed.
The Janus gateway is now accessible at `localhost:8088`.

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
