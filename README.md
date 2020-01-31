[logo]: https://ddtalk.donbassdialog.org.ua/icons/favicon-32x32.png "DD Talk - Online Dialogue Service"
# ![DD Talk - Online Dialogue Service](https://ddtalk.donbassdialog.org.ua/icons/favicon-32x32.png "DD Talk - Online Dialogue Service") DD Talk - Online Dialogue Service

[ddtalk.donbassdialog.org.ua](https://ddtalk.donbassdialog.org.ua/)

Share link for secure video call between two or more anonymous users. 
Anonymous and confidential real-time communication use open source WebRTC JavaScript library of peer-to-peer network [RTCMultiConnection].

**Disclaimer**: [DD Talk] service was developed by IT volunteers on the [Donbass Dialogue Platform], 2014—2020. DD Talk is ***Beta version***. For professional goals use technical support!

# Deploy DD Talk Application
## 1. Настраиваем виртуальную машину (ВМ)
### Генерируем ключи доступа к ВМ 
С помощью PuTTYgen www.puttygen.com на локальной машине создаем приватный и публичный SSH ключи:
```
private.ppk
pub.key
```
### Активируем ВМ
В облаке [Microsoft Azure](https://portal.azure.com) в Западной Европе:
B1S Standard (1 виртуальный ЦП Intel(R) Xeon(R) CPU E5-2673 v4 @ 2.30GHz, память 1 ГиБ ОЗУ) c Ubuntu 18.04.
Диск: 64 ГиБ SSD, цен. категория "Премиум".

Указываем имя пользователя. И вставляем из PuTTY Key Generator открытый ключ SSH. В поле `Общедоступные входящие порты` активируем `Разрешить выбранные порты` и активируем `22` - для PuTTY, `80` и `443` - HTTP и HTTPS.

На вкладке `Сетевые подключения` в поле `Общедоступный IP адрес` нажмите создать и в поле `Назначение` выберите `Статический`. После чего активируем процесс создания ВМ.

### Открываем порты
В админ панели ВМ в разделе `Сетевые соединения` добавляем правила безопасности для входящего трафика. Открываем `3478` и `5349` порты для STUN/TURN (TCP и UDP).

### Получаем публичный IP адрес
В сетевых подключениях активируем статический публичный IP адрес

### Связываем А запись домена со статическим публичным IP-адресом ВМ
Редактируем настройки домена через админ-панель регистратора домена. Если домен ранее был привязан к другому IP:
* Очищаем кеш Гугла:
https://google-public-dns.appspot.com/cache
* Очищаем DNS в Windows используя CLI (Microsoft Windows command line):

       C:\> ipconfig /flushdns

Если нет домена используем DNS-имя: ******.westeurope.cloudapp.azure.com***. Для этого в `ip-Конфигурация` в поле `Метка DNS-имени` создаем уникальный идентификатор.

### Подключаемся клиентом к ВМ
Загружаем, устанавливаем [PuTTY] и настраиваем подключение. Для подключения нужно указать `IP` ВМ, во вкладке `Connection/Data` указываем `имя пользователя`, а во вкладке `Connection/SSH/Auth` указываем путь к файлу с приватным ключом для SSH доступа, который создали ранее.

После подключения к ВМ обновляемся и устанавливаем вспомогательный софт: mc - файловый менеджер, htop - системный монитор, ifstat - вывод нагрузки на сетевые каналы.
```sh
$ sudo apt-get update && sudo apt-get upgrade -y
$ sudo apt-get install mc htop ifstat
```
Настраиваем локальное время ВМ
* Получаем список Timezones

        $ timedatectl list-timezones
* Устанавливаем выбранную Timezone

        $ sudo timedatectl set-timezone Europe/Kiev
* Показать текущую дату и время

        $ date

### Создаем нового пользователя с правами SUDO
С правами `ROOT` работать опасно, поэтому создаем нового пользователя с правами администратора `sudo` (подробнее об этом написано [тут](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-18-04))
```sh
$ sudo adduser newUser
```
Даем ему административные привилегии
```sh
$ sudo usermod -aG sudo newUser
```
В режиме отладки отключаем требование ввести пароль для команд с `SUDO`. Открываем файл конфигурации sudo:
```sh
$ sudo visudo
```
В редакторе отключаем запрос пароля следующей строчкой:
> newUser ALL=(ALL) NOPASSWD: ALL

И сохраняем файл. *В конце после всех настроек и отладки нужно включить обратно ввод пароля для sudo команд*.

Копируем ключи доступа `~/.ssh/authorized_keys` в домашний каталог нового пользователя и меняем скопированным файлам владельца и группу:
```sh
$ sudo rsync --archive --chown=newUser:newUser ~/.ssh /home/newUser
```
Теперь открываем новый сеанс терминала и используем SSH с новым именем пользователя и подключаемся к ВМ.

### Проверяем фаервол ВМ
```sh
$ sudo ufw status
```
Если статус не активный, то идем к следующему пункту
> Status: inactive

Если статус активный - настраиваем файервол ВМ и открываем все необходимые порты для: SSH, HTTH, HTTPS, TURN и STUN.

## 2. Устанавливаем программное обеспечение
### Установка Node.js
Немного об этом [How To Set Up a Node.js Application]
Installation instructions [Node.js v12.x]:
```sh
$ sudo curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
$ sudo apt-get install -y nodejs
```
Проверяем версии 
```sh
$ node -v
$ npm -v
```
Протестируем Node.js используя RTCMultiConnection. Подробности читаем тут: [Пошаговая инструкция по установке библиотеки RTCMultiConnection](https://github.com/muaz-khan/RTCMultiConnection/issues/685#issuecomment-441172740) и [Общая инструкция к библиотеке](https://github.com/muaz-khan/RTCMultiConnection/blob/master/docs/installation-guide.md). 
Скачиваем и разархивируем в новую папку демоверсию
```sh
$ sudo apt-get update && sudo apt-get upgrade -y
$ wget https://github.com/muaz-khan/RTCMultiConnection/archive/master.zip
$ unzip master.zip
$ rm master.zip
$ cd RTCMultiConnection-master
```
В новой папке инсталлируем все зависимости которые указаны в файле `package.json`:
```sh
$ sudo npm install
```
Для публичного сервера в `package.json` игнорируем scripts и пакеты для разработки указанные в блоках scripts и devDependencies :
```sh
$ sudo npm install --only=prod --ignore-scripts
```

В файле `config.json` для переменной `port` указываем значение `3478` (ранее открытый порт для STUN/TURN) и запускаем Node.js:
```sh
$ node server.js
```
В браузере в адресной строке вводим IP или домен ВМ:
> `http://___YOU_DOMEN_OR_IP_ADRESS___:3478`

и в браузере загрузится демонстрационная страница сервиса RTCMultiConnection.

> **По умолчанию Node.js запрещен доступ портам 80 и 443**. Доступ к низким портам есть только для root доступа. Но если запустить Node.js под root с командой SUDO, то Node.js получит доступ 80-му порту и сервер запустится.

        $ sudo node server.js
> ***Если не планируется установка обратного проксирующего сервера, можно организовать доступ к портам 80 и 443 для Node.js без root прав***. Для этого нужно через `CAP_NET_BIND_SERVICE` предоставить доступ к процессу с низким номером порта ([Ссылка 1](https://www.8host.com/blog/nastrojka-sredy-proizvodstva-node-js-pri-pomoshhi-pm2-na-servere-ubuntu/) и [Ссылка 2](https://www.digitalocean.com/community/tutorials/how-to-use-pm2-to-setup-a-node-js-production-environment-on-an-ubuntu-vps#give-safe-user-permission-to-use-port-80:)):

        $ sudo apt-get install libcap2-bin
        $ sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node

_После экспериментов можно удалить папку RTCMultiConnection-master_

> **Полезные команды для управления Node.js**
Проверка на чтение директорий:
`$ curl -v --path-as-is https://___YOU_DOMEN_OR_IP_ADRESS___:PORT/../../../../../../etc/passwd`
Просмотреть все запущенные процессы:
`ps -ax | grep node`
Чтобы убить процесс с нодой нужно указать ее ID:
`kill -9 ID`
Если разворачивался архив под `root` то чтобы работать с `SFTP` файловым менеджером нужна рекурсивная замена владельца:
`chown -R owner:group dirname/`
Удалить все зависимости и установить заново: 
`rm -rf node_modules && npm install`
Можно установить пакет Reinstall который дополнительно очищает кеш после удаления node modules. Установка пакета Reinstall: `npm install reinstall -g` Использование: `reinstall`
Удаляет пакеты разработчика "devDependencies" указанные в `package.json`:
`npm prune --production`


### Установка Coturn - TURN and STUN Server for VoIP and WebRTC
Полезные ссылки:
* [Общая информация](https://doc-kurento.readthedocs.io/en/6.11.0/user/faq.html)
* [Скринкаст о hmac-password shared secret key between HTTP and TURN
servers](https://www.ietf.org/proceedings/87/slides/slides-87-behave-10.pdf)
* [Документация](https://github.com/coturn/coturn/wiki/turnserver)
* [Описание команд в конфиге](https://github.com/coturn/coturn/blob/master/examples/etc/turnserver.conf)
* [Описание настройки RTCMultiConnection](https://www.webrtc-experiment.com/docs/TURN-server-installation-guide.html)
* [Пример конфига для webrtc](https://docs.bigbluebutton.org/2.2/setup-turn-server.html)
* [Оригинальный конфиг](https://github.com/leecade/coturn/blob/master/examples/etc/turnserver.conf)
* [Описание флагов](https://github.com/coturn/coturn/wiki/turnserver)

Установка Coturn:
```sh
$ sudo apt-get update && sudo apt-get upgrade -y
$ sudo apt-get install coturn
```

Чтобы он автоматически запускался после перезагрузки сервера в файле
```sh
$ sudo nano /etc/default/coturn
```
Удаляем символ #
`#`TURNSERVER_ENABLED=1
 и сохраняем файл, после чего перегружаем Coturn:
```sh
$ sudo service coturn restart
$ sudo systemctl status coturn
```
Конфиг настраивается позже, после того как получим SSL сертификаты.

> Команды для управления Coturn
Ручной запуск:
`sudo service coturn start` или `sudo systemctl start coturn`
Перезагрузка:
`sudo service coturn restart`
Остановка:
`sudo service coturn stop`
Запуск turnserver с заданного конфига:
`sudo turnserver -c /etc/turnserver.conf --daemon -v -u USER:PASS`

Проверка слежения на портах 3478 и 5349 (или 80/443)
```sh
$ sudo lsof -n -i4TCP:3478 | grep LISTEN
$ sudo lsof -n -i4TCP:5349 | grep LISTEN
```

### Установка Nginx
[Установка Nginx в Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-18-04):
[!!!Deploy a Node.js Application to DigitalOcean with HTTPS](https://coderrocketfuel.com/article/deploy-a-nodejs-application-to-digital-ocean-with-https)
```sh
$ sudo apt-get update && sudo apt-get upgrade -y
$ sudo apt-get install nginx
```
> Проверка статуса:
`sudo systemctl status nginx`

When you have your server's IP address or domain, enter it into your browser's address bar:
> http://\__YOU_DOMEN_OR_IP_ADRESS__

Конфиг настраивается позже, после того как получим SSL сертификаты.

> To stop your web server, type:
`sudo systemctl stop nginx`
To start the web server when it is stopped, type:
`sudo systemctl start nginx`
To stop and then start the service again, type:
`sudo systemctl restart nginx`
If you are simply making configuration changes, Nginx can often reload without dropping connections. To do this, type:
`sudo systemctl reload nginx`
By default, Nginx is configured to start automatically when the server boots. If this is not what you want, you can disable this behavior by typing:
`sudo systemctl disable nginx`
To re-enable the service to start up at boot, you can type:
`sudo systemctl enable nginx`

### SSL Configuration Using Lets Encrypt and Certbot. Install Certbot
[Nginx on Ubuntu 18.04 LTS (bionic)](https://certbot.eff.org/lets-encrypt/ubuntubionic-nginx.html)
Add Certbot PPA
```sh
$ sudo apt-get update
$ sudo apt-get install software-properties-common
$ sudo add-apt-repository universe
$ sudo add-apt-repository ppa:certbot/certbot
$ sudo apt-get update
```
Install Certbot
```sh
$ sudo apt-get install certbot python-certbot-nginx
```
Either get and install your certificates...
Run this command to get a certificate and have Certbot edit your Nginx configuration automatically to serve it, turning on HTTPS access in a single step.
```sh
$ sudo certbot --nginx -d ___YOU_1_DOMEN___ -d ___YOU_2_DOMEN___
```
При получении сертификатов желательно выбрать пункт 2: Redirect - Make all requests redirect to secure HTTPS access. Choose this for new sites, or if you're confident your site works on HTTPS. You can undo this change by editing your web server's configuration.

Test automatic renewal
```sh
$ sudo certbot renew --dry-run
```


## 3. Развертывание онлайн сервиса DDTalk
### Подготовка конфигурационных файлов сервиса
Скачиваем и разархивируем в новую папку DDTalk
```sh
$ sudo apt-get update && sudo apt-get upgrade -y
$ wget https://github.com/VShtaba/ddtalk/archive/master.zip
$ unzip master.zip
$ rm master.zip
$ cd DDTalk
```

В [config.json](./config.json) проверяем порт который слушает Node.js (по умолчанию 8081) и устанавливаем случайное значение для `socketCustomEvent`:
```json
{
  ...
  "socketCustomEvent": "__YOU_PASS__",
  "port": "8081",
   ...
}
```

В файле [site-config.json](./site-config.json) в поле `ioServerOrigins` через запятую перечисляем с какого адреса будт доступен Socket.IO и, если нужно, указываем порты для сокета или ставим `*`:
```json
{
  ...
  "ioServerOrigins": ["___IPADRESS1___:*, ___ddtalk.IPADRESS2____:*"],
}
```

В этой папке где находятся файлы сервиса инсталлируем все зависимости, которые указаны в файле [package.json](./package.json):
```sh
$ sudo npm install
```

Запускаем Node.js:
```sh
$ node server.js
```

### Демонизация NodeJS приложения с помощью process manager PM2
PM2 устанавливаем глобально (подробнее по ссылке [pm2](https://habr.com/sandbox/96765/ "pm2")):
```sh
$ sudo apt-get update && sudo apt-get upgrade -y
$ sudo npm install pm2@latest -g
```

В папке где лежит скрипт сервера `server.js` и запускаем приложение присваивая ему алиас:
```sh
$ pm2 start server.js --name ddtalk
```

Для включения режима отслеживания изменений файлов (добавляем параметр `--watch`) [подробнее](http://pm2.keymetrics.io/docs/usage/quick-start/#restart-application-on-changes):
```sh
$ pm2 start server.js --name ddtalk --watch
```
>Просмотреть список запущенных приложений (если их на сервере несколько):
`pm2 list`
Мониторинг работающих приложений - команда:
`pm2 monit`
Остановка приложения (доп. команды {start|stop|restart}):
`pm2 stop ddtalk`
Перезагрузка
`pm2 reload all`
Убрать приложение из списка:
`pm2 delete ddtalk`

Инициализация автозагрузки приложения
```sh
$ pm2 startup
```
P2 выдаст команду, которую нужно запустить с помощью sudo. Скопируйте и вставьте команду, чтобы закончить процесс
```sh
sudo su -c "env PATH=$PATH:/usr/bin pm2 startup systemd -u newUser --hp /home/newUser"
```
> Сохранить список текущих процессов на случай перезагрузки сервера:
`pm2 save`
Отключение системы запуска:
`pm2 unstartup`
Логи  приложения находятся в папке `root/pm2/logs/`
Очистка логов:
`pm2 flush`



### Настройка Coturn
Затем нужно отредактировать основной файл конфигурации Coturn:
```sh
$ sudo nano /etc/turnserver.conf
```
Меняем его содержание на то, что лежит в папке [tools/Coturn](./tools/Coturn/turnserver.conf)
Редактируем realm=__CoturnPublicIpAddressOrDomen__, user=__YOU_USER__:__PASS__ и сохраняем конфигурационный файл.

Перегружаем Coturn:
```sh
$ sudo service coturn restart
```
В файле [./ui/dist/lib-ice-servers.json](./ui/dist/lib-ice-servers.json) нужно указать имя сервера, имя пользователя и пароль для подключения к STUN/TURN серверу.


Тестирование TURN сервера:
* Trickle-ice https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
* Еще один сервис для проверки STUN&TURN (в настройках сервиса нужно указать параметры STUN и TURN серверов) https://test.webrtc.org/
* Чтобы все входящие включения по WebRTC шли через TURN сервер в настройках Firefox `about:config` флаг `media.peerconnection.ice.relay_only` нужно установить в значение `TRUE`.
* Чтобы использовать только TURN  без STUN нужно активировать в конфиге `turnserver.conf` параметр `no-stun`.

Проверка нагрузки на сеть сервера:
```sh
$ ifstat -b -S -z -t
```


### Nginx as Reverse Proxy for Nodejs App
Нужно создать новый файл конфигурации где будут храниться настройки Nginx:
```sh
$ sudo nano /etc/nginx/conf.d/backend.conf
```
И вставить в него содержимое из файла [tools/Nginx/backend.conf](./tools/Nginx/backend.conf). В конфиге меняем:
```
# Указываем IP и домен
    server_name __YOU_Server_IP __YOU_Server_Domain_Name_1__ __YOU_Server_Domain_Name_2__;
...
# Проверяем порт (должен быть тем же что и в config.json)
    server 127.0.0.1:8081
    ...
# Указываем путь к SSL сертификатам
    ssl_certificate /etc/letsencrypt/live/__YOU_Server_Domain_Name_1__/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/__YOU_Server_Domain_Name_1__/privkey.pem;
    ...
```

Перезагружаем Nginx:
```sh
$ sudo systemctl restart nginx
```
или
```sh
$ sudo service nginx restart
```

&#x1F4D9; Заходим в браузер, вводим
> https://\__YOU_SERVER_ADRESS\__

и проверяем работу сервиса.

Без браузера можно проверить из консоли загрузку socket.io:
```sh
$ curl -vI  https://__YOU_SERVER_ADRESS__/socket.io/socket.io.js
```


### Отладка приложения ¯\\_(ツ)_/¯

Чтобы обращаться к локальным переменным и функциям закомментируйте две строчки в файле [ui/dist/main.js](/ui/dist/main.js)
```javascript
...
//(function () {
    ...
//}());
...
```

Чтобы отобразить отладочную информацию в chrome devtools в файле 
[site-config.json](./site-config.json) нужно активировать поле `enableClientSideLogs` и пергрузить NodeJS сервер:
```sh
$ pm2 restart ddtalk-dev
```
Чтобы в активировать `debug mode` без перезагрузки сервера в файле [ui/dist/debug.js](/ui/dist/debug.js) присвойте переменной `DEBUG` значение `true`
```javascript
...
const DEBUG = true;
...
```

> В заголовках [Content Security Policy Presentations](https://content-security-policy.com/presentations/) разрешены следующие ресурсы: 
> для Google Docs, которые используются в фреймах на страницах [About](./ui/about.html) и [Manual](./ui/beforestart.html) разрешены: `iframe https://docs.google.com, style-src https://fonts.googleapis.com, font-src https://fonts.gstatic.com`
> для Stream Canvas PDF handler file который находится [`__WEBSITE_DIR__/ddtalk/ui/dist/canvas-designer/widget.html`](./ui/dist/canvas-designer/widget.html) запрашивает внешний ресурс https://cdn.jsdelivr.net/npm/pdfjs-dist@2.0.489/build/pdf.min.js


### Ссылки для тестирования сервиса
* [SSL Server Test](https://www.ssllabs.com/ssltest/) - бесплатный онлайн-сервис для анализа конфигурации SSL-веб-сервера в Интернете.
* [Test a website's performance](https://www.webpagetest.org/) - используется для измерения и анализа производительности веб-страниц.
* [Facebook Crawler](https://developers.facebook.com/tools/debug/) - отладчик репостов, чтобы смотреть, какая информация используется, когда контентом с вашего сайта делятся на Facebook, в Messenger
* [Twitter Card validator](https://cards-dev.twitter.com/validator) - помогает проверить оптимизированны ли твиты с помощью карт
* [Schema Markup Generator (JSON-LD)](https://technicalseo.com/tools/schema-markup-generator/) -  генератор структурированных данных Schema.org для создания разметок JSON-LD
* [Google Проверка структурированных данных](https://search.google.com/structured-data/testing-tool) - Snippet валидатор


License
---
MIT
**Free Software**

Markdown редактор https://dillinger.io

[//]:#
 [RTCMultiConnection]: <https://github.com/muaz-khan/RTCMultiConnection/>
 [DD Talk]: <http://ddtalk.donbassdialog.org.ua/>
 [Donbass Dialogue Platform]: <https://online-dialogue.org/>
 [PuTTY]: <https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html>
 [Node.js v12.x]: <https://github.com/nodesource/distributions/blob/master/README.md#installation-instructions>
 [How To Set Up a Node.js Application]: <https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-18-04>

