Postup instalace systému

Nejprve je potřeba uložit do úložiště na Raspberry Pi všechny zdrojové soubory (složku src). Ty je možné stáhnout z Githubu:
https://github.com/dinoq/RPi-Smart-Home
Kromě toho jsou zdrojové soubory uloženy na paměťovém médiu (složka src).

Na Raspberry Pi je potřeba mít nainstalované NodeJS a npm. Pokud tam nejsou (případně ne v aktuální verzi), je nutné je doinstalovat. To je možné v terminálu pomocí následujících příkazů:

sudo apt update
sudo apt install nodejs --assume-yes
sudo apt install npm --assume-yes

Pokud by verze npm neodpovídala aktuální verzi, je potřeba ji aktualizovat (osobně jsem se setkal s tím, že pomocí výše uvedených příkazů se nainstaluje starší verze):
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
PATH="\$PATH"

Jako další krok je potřeba nainstalovat všechny javascriptové závislosti. Používá je pouze server, takže je potřeba přejít do adresáře src/server a v něm v terminálu spustit příkaz:
npm install

Následně je již možné spustit server (v adresáři src/server) pomocí příkazu:
sudo npm start

Od této chvíle je možné přistupovat k lokální verzi webové aplikace přes IP adresu Raspberry Pi (příp. i port, pokud je v souboru src/server/config.json definovaný jiný než 80)

Nakonec je potřeba nahrát kód do modulů ESP8266. Nejlépe je k tomu využít Arduino IDE. Je potřeba v něm otevřít soubor src/esp/esp.ino. 
Aby bylo možné přeložit zdrojové kódy pro tyto moduly, je nutné do projektu přidat všechny používané knihovny. Detailní postup je možné najít na:
http://www.arduino.cc/en/Guide/Libraries
V Arduino IDE je to možné udělat tímto způsobem:
přes menu-> Nástroje -> Spravovat knihovny...
Následně je potřeba v manažeru knihoven vyhledat příslušné knihovny a každou nainstalovat. Knihovny, které je nutné nainstalovat:
CoAP simple library
BH1750
Adafruit BMP280 Library
Adafruit Unified Sensor

Všechny použité knihovny jsou vloženy také na paměťovém médiu (adresář src/esp/lib).
V souboru src/esp/esp.h je potřeba před nahrátím do modulu vložit na začátku souboru (v konfigurační části) správné přístupové údaje k Wi-Fi síti. Dále statickou IP adresu, pokud ji uživatel chce pro daný modul použít. Pokud ne, tak musí daný řádek, na kterém se statická IP adresa nastavuje smazat a odkomentovat následující řádek, viz komentáře v kódu. Nakonec je také možné změnit typ vývojové desky, na kterou se aplikace nahrává (opět viz komentáře v kódu). Dále už je jen potřeba zvolit správné parametry pro nahrátí programu v Arduino IDE (pokud ho uživatel pro nahrátí aplikace do modulu používá). Pokud mezi vývojovými deskami (menu -> Nástroje -> Vývojová deska) pro nahrátí v Arduino IDE  nejsou moduly s ESP8266 (jako NodeMcu), je možné je přidat následovně:
menu -> Soubor -> Vlastnosti. Do pole "Správce dalších desek URL" je potřeba vložit:
http://arduino.esp8266.com/stable/package_esp8266com_index.json
Dále je potřeba desky přidat:
menu -> Nástroje -> Vývojová deska -> Manažér desek...
V manažeru desek je potřeba vyhledat a nainstalovat esp8266. Po instalaci již budou moduly mezi ostatními vývojovými deskami. 
Nakonec je potřeba zvolit požadovanou desku (mezi vývojovými deskami), port a program zkompilovat a nahrát do modulu.

V tuto chvíli by již měl být systém připravený k použití. Je možné jej ovládat z webového klienta buď na IP adrese serveru (Raspberry Pi), nebo přes internet na: https://automatizace.web.app/domu