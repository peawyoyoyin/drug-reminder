FROM dbmobilelife/docker-python-opency-tesseract

WORKDIR /app

ADD app ./app
ADD parser ./parser
ADD tesseract ./tesseract
ADD requirements.txt .

RUN mkdir uploads

# Install python
RUN add-apt-repository ppa:jonathonf/python-3.7
RUN apt update
RUN apt install python3.7 -y

RUN python -m pip install -r requirements.txt

CMD [ "python", "/app/app/main.py" ]
