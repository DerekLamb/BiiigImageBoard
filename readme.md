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
- Basic server and client side built
- Image storage and viewing
- Automatic1111 prompt extraction
- Basic prompt and tag searching

### TODO 
- Add image display options (full size, fill screen size, etc...)
- improved search function
- efficient management of images (mass deletion and tagging)
- login and user system (in progress)
- Develop/implement a security model

### future ideas
- Tight integration with Automatic1111? (Not focus anymore)
- File management features (dropbucket?) 
- Multimode installation (Hosted standalone or AWS S3 distributed with front end?) 

