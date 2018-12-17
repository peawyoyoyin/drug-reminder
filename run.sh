cd ./ocr
python3 main.py -p 3004 -H 127.0.0.1 &
cd ..
cd ./notifier
node bot.js &