# CodeNest Video Downloader API

A powerful and secure **Node.js backend server** for the CodeNest Video Downloader.  
This API leverages **yt-dlp** and **FFmpeg** to fetch, process, trim, and convert media from multiple platforms.

---

##  Features

**Multi-Platform Support**  
Supports media extraction from:

- YouTube  
- Instagram  
- Facebook  
- TikTok  
- Twitter (X)  
- Reddit  

 **Media Extraction**  
Retrieve all available video resolutions and audio formats.

 **Video Trimming**  
Server-side cutting using FFmpeg.

 **Audio Conversion**  
Extract and convert audio to MP3 with selectable bitrates:

- 128k  
- 192k  
- 256k  
- 320k  

 **Auto-Cleanup System**  
Files are streamed directly to the client and instantly deleted from the server.

---

##  Tech Stack

- **Node.js**
- **Express.js**
- **yt-dlp-exec** (yt-dlp wrapper)
- **ffmpeg-static**
- **FFmpeg**

---

##  Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Marjuk06/cn-video-downloader-server.git
cd cn-video-downloader-server
```
### 2️⃣ Install Dependencies
```bash
npm install
```




### 3️⃣ Start the Server
```bash
node server.js
```
Server runs at:
```
http://localhost:5000
```
 ### Configuration Notes

- Ensure FFmpeg is properly accessible

- yt-dlp is automatically handled via yt-dlp-exec

- No persistent storage required (auto-cleanup)

### Security & Performance

- Stream-based delivery
- No temporary file buildup
- Optimized server memory usage
- Safe processing pipeline






