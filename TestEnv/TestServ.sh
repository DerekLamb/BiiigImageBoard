#!/bin/bash
mongosh <<EOF1
    use bib 
    db.dropDatabase()
    exit
EOF1

files=($(find . -type f -iname "*.jpg" -or -iname "*.png"))

for file in "${files[@]}"; do
mongosh <<EOF2
    use bib
    db.test_img.insertOne( {img_path: BinData(0,"$file" )} )
    exit
EOF2
done
