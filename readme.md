# BiiigImageBoard 
A web image board for users to upload and tag images designed to be easily deployed. Built in stable diffuision image prompt extraction. 
### Requirements
- Docker
- That's it 🙃

## Installation

- git clone https://github.com/DerekLamb/BiiigImageBoard.git
  - Optional: Modify indicated line in docker-compose.yml to change image directory
- Run "docker compose up -d" from root folder

## Planning
### done ✔️
- viable server and client side built
- image storage and viewing
- Stable diffusion prompt extraction
- Prompt and tag searching

### barebones :heavy_check_mark:
- server side and client side
- focus on ease of use (docker) 
- image storage and viewing
- Stable Diffusion prompt extraction (Automatic1111 format)

### TODO 
- Add image display options (full size, fill screen size, etc...)
- tags, and search function
- efficient management of images (mass deletion and tagging)
- login and user system
- clean up work

### future ideas
- Tight integration with Automatic1111? 
- File management features (dropbuckets and like) 
- Multimode installation(Hosted standalone, AWS S3 distributed front end?)

