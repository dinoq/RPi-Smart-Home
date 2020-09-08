# RPi-Smart-Home
Projekt je praktickou částí mé bakalářské práce na VUT FIT v Brně.
V rámci projektu byla v Pythonu vytvořena aplikace pro automatizaci domácnosti na Raspberry Pi.

# Instalace a spuštění projektu
Pro spuštění aplikace je potřeba nejprve nainstalovat knihovnu kivy, dle oficiálních stránek (verze pro PYthon 3):  
https://kivy.org/doc/stable/installation/installation-rpi.html

Samotné spuštění aplikace je možné v konzoli (ze složky src) pomocí příkazu:
python main.py


# Co jsem se projektem naučil
- Práci v Python
- Práci s knihovnou kivy (pro vývoj GUI v Pythonu)
- Práci s NoSQL databází Firebase realtime database a PYthon knihovnou pyrebase (pro přístup k Firebase databázi)
- Síťové programování v Pythonu
- Práci s git v konzoli (Ubuntu)  

# Podrobněji o projektu
Cílem bylo vytvořit 2 aplikace. Jednu pro Raspberry Pi (s připojeným displejem). Přes displej je možné ovládat jednotlivá zařízení v domácnosti.  
Aplikace běží na OS Raspbian (Příp. Ubuntu). Obsahuje 3 základní funkce - možnost přímého ovládání různých zařízení na dálku (spotřebičů, světel), nastavení podmínek za jakých se změní stav (např. rozsvícení světel při zaznamenání přítomnosti osoby pohybovým čidlem) a nastavení scén (např. nastavení světel na večerní náladu, zajištění celého domu a zhasnutí světel při odchodu apod.).  
Druhá aplikace pak poběží na modulech ESP8266, ke kterým bude přes Relé a MOSFET tranzistory připojená světla a zařízení, které tak bude možné (pomocí řízení výstupů ESP8266) dálkově ovládat z Raspberry Pi.  
Aplikace pro RPi je psaná v Pythonu, pro ESP8266 v C (Wiring).  
  
Obě aplikace jsou stále ve vývoji.  
<!-- # TODO list
- [ ] když rozkliknu světlo, slider při odkliknutí/zvolení musí zmizet!  
- [ ] když je otevřený slider a jdu do jine mistnosti, děla to při návratu krpu (je za obrázkem)  
- [ ] jiná zařízení než světla  
- [ ] Přidat tlačítko "Ukončit aplikaci" do hlavního menu (i přihlašovací stránky) 
- [ ] přidávání módů  
- [ ] přidávání pravidel  
- [ ] přidávání místností  
- [ ] přidávání zařízení  
- [ ] nastavení aplikace (v něm změna domácnosti, odhlášení...)  -->
