# Echo - Modern Video Streaming Platform


## Overview

Echo is a cutting-edge video streaming platform that combines the best features of modern streaming services with a focus on creator empowerment and user engagement. Built with React and GraphQL, Echo provides a seamless experience for both content creators and viewers.

## Related Projects

### Backend Services

- [Echo Backend Service](https://github.com/ADITYAbasude/echo-backend) - Main backend API service
- [Echo Video Transcoder](https://github.com/ADITYAbasude/video-transcoder) - Video processing microservice

## Key Features

### For Viewers

- **Live Streaming**: Watch real-time broadcasts from your favorite creators
- **Video on Demand**: Access recorded content anytime
- **Interactive Chat**: Engage with creators and community during live streams
- **Custom Collections**: Create and manage personal playlists
- **Dark Mode**: Enhanced viewing experience with dark theme support

### For Creators

- **Studio Dashboard**: Professional tools for content management
- **Broadcasting Tools**: Easy-to-use live streaming setup with NGINX RTMP
  - **Stream Key Management**: Secure streaming with unique RTMP keys
  - **Multiple Stream Quality**: Adaptive bitrate streaming support
  - **Analytics**: Track your content performance and audience engagement
- **Content Management**: Upload, edit, and organize your videos

## System Architecture

Echo follows a microservices architecture pattern for scalability and maintainability. The platform utilizes NGINX RTMP server for handling live video streams:

- **NGINX RTMP Server**: Handles incoming RTMP streams from creators
  - Supports adaptive bitrate streaming
  - Manages stream transcoding and distribution
  - Provides low-latency streaming experience

> **Note**: Currently, live streaming is only available for local network streaming. Users need to set up NGINX RTMP server locally to enable streaming functionality.

### Local Streaming Setup

1. **Install FFmpeg**
   - Download FFmpeg from [FFmpeg official website](https://ffmpeg.org/download.html)
   - Add FFmpeg to system PATH
   - Verify installation by running `ffmpeg -version` in command prompt

2. **Download NGINX RTMP Server**
   - Download the pre-built NGINX with RTMP module from [nginx-rtmp-win32](https://github.com/illuspas/nginx-rtmp-win32)
   - Extract the downloaded zip file to a convenient location

3. **Configure NGINX**
   - Replace the default `nginx.conf` file in the extracted folder with our provided configuration file
   - You can find our NGINX configuration at `nginx.conf` in the project root
   - The configuration sets up:
     - RTMP server on port 1935
     - HLS streaming on port 8000
     - Callback server on port 8001

4. **Start NGINX Server**
   - Open command prompt in the NGINX directory
   - Run `nginx.exe` to start the server
   - To stop: `nginx.exe -s stop`
   - To reload config: `nginx.exe -s reload`

5. **Streaming**
   - Use OBS or similar software to stream to: `rtmp://localhost:1935/live/STREAM_KEY`
   - Access stream via HLS at: `http://localhost:8000/hls/STREAM_KEY.m3u8`

> **Important**: FFmpeg is required for NGINX RTMP server to handle video transcoding and HLS stream generation. Make sure to install FFmpeg before starting the NGINX server.

![Echo System Architecture](https://eqosyhitwcvhgj7l.public.blob.vercel-storage.com/diagrams/diagram-export-1-22-2025-1_01_19-PM-bzMhTwFpO99UIyq3rgJjyfqNqI00br.png)

*Figure 1: High-level system architecture diagram of Echo platform*


