FROM ubuntu:xenial

ENV NODE_ENV=production PROFILES_FOLDER=/profiles KEYS_FILE=/keys/keys.lst

RUN apt-get update && apt-get -y upgrade && apt-get -y install build-essential python3-dev python3-pip python3-cffi python-pip libcairo2 libpango-1.0-0 libpangocairo-1.0.0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info git nodejs npm curl && pip install --upgrade pip && pip install WeasyPrint && apt-get clean && npm i -g n && n lts && rm /usr/bin/npm && /usr/local/bin/npm upgrade -g npm && ln -s /usr/local/bin/npm /usr/bin/npm
COPY . /opt/pdf-printer
RUN cd /opt/pdf-printer && rm -Rf .git && npm i && mkdir -p /profiles && mkdir -p /keys

EXPOSE 3000
VOLUME /profiles /keys

WORKDIR /opt/pdf-printer

CMD ["/usr/local/bin/npm", "start"]
