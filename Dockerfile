FROM zenato/puppeteer

USER root

ENV TZ=Europe/Stockholm

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY . /app

RUN cd /app && npm install --quiet

EXPOSE 3000

WORKDIR /app

CMD npm run start
