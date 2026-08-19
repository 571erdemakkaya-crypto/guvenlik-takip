# Güvenlik Takip - kolay kurulum sürümü

Bu sürümde **better-sqlite3 / node-gyp / Python gerekmez**. Veriler `guvenlik_data.json` dosyasında tutulur.

## Windows kurulumu
1. Node.js LTS kurun: https://nodejs.org/en/download/
2. Bu klasörde CMD açın.
3. Eski `node_modules` ve `package-lock.json` varsa silin.
4. `npm install` yazın.
5. `npm start` yazın.
6. Bilgisayarda `http://localhost:3000` açın.
7. Aynı Wi-Fi'daki telefon için bilgisayarın IPv4 adresiyle `http://IP_ADRESI:3000` açın.

Veriler `guvenlik_data.json` içinde saklanır. Bu sürüm küçük/orta ölçekli tek güvenlik noktası kullanımı için tasarlanmıştır. İnternete açmadan önce HTTPS ve güçlü SESSION_SECRET kullanın.
