# Deutsch C1 Vokabeltrainer

Ein umfassender, interaktiver Vokabeltrainer für das C1-Niveau, bestehend aus zwei spezialisierten Modulen mit insgesamt 1505 Wörtern.

## 🚀 Live Demo
Die Anwendung kann direkt im Browser genutzt werden:
[Link zu deiner GitHub Pages URL]

## 📋 Module

### Modul 1: Vokabelliste (626 Wörter)
Dieses Modul bietet eine umfangreiche Liste von C1-Vokabeln mit Fokus auf Aussprache und Grammatik.
- **Audio-Unterstützung:** 625 hochwertige Audio-Aufnahmen (.opus/.ogg).
- **Beispielsätze:** Jedes Wort enthält einen authentischen Beispielsatz.
- **Lernmodi:** 
  - Lernkarten (Flashcards)
  - Multiple Choice Quiz
  - Schreib-Quiz (Typing Test)
  - Spaced Repetition (Wiederholungssystem)
- **Tracking:** Tägliche Ziele, Favoriten und detaillierte Statistiken nach Lektionen.

### Modul 2: Aspekt Neu C1 (879 Wörter)
Basierend auf dem Lehrwerk "Aspekt Neu C1", bietet dieses Modul mehrsprachige Unterstützung.
- **Mehrsprachigkeit:** Übersetzungen in 6 Sprachen:
  - 🇹🇷 Türkisch (Türkçe)
  - 🇨🇳 Chinesisch (中文)
  - 🇮🇷 Farsi (فارسی)
  - 🇦🇲 Armenisch (Հայերեն)
  - 🕊️ Kurdisch (Kurdî)
  - 🇺🇦 Ukrainisch (Українська)
- **Beispielsätze:** Alle 879 Wörter verfügen über C1-konforme Beispielsätze.
- **Lernmodi:** Flashcards und Quiz-Modus.

## ✨ Hauptfunktionen
- **Progressive Web App Feeling:** Läuft vollständig im Browser ohne Installation.
- **LocalStorage Persistence:** Dein Lernfortschritt, Favoriten und Statistiken werden lokal auf deinem Gerät gespeichert.
- **Responsives Design:** Optimiert für Smartphones, Tablets und Desktop-Computer.
- **Navigation:** Einfaches Filtern nach Lektionen, Kapiteln oder über die Suchfunktion.

## 🛠️ Technische Details
- **Frontend:** HTML5, CSS3 (mit Gradient-Animationen), Vanilla JavaScript.
- **Daten:** JSON-basierte Datenbanken für maximale Geschwindigkeit.
- **Audio:** Komprimierte Opus/Ogg Formate für schnelle Ladezeiten.

## 📂 Dateistruktur
- `index.html`: Landeseite zur Modulauswahl.
- `vokabelliste.html`: Interface für Modul 1.
- `aspekt-neu.html`: Interface für Modul 2.
- `app.js`: Logik für Modul 1.
- `aspekt-neu.js`: Logik für Modul 2.
- `kelimeler_web.json`: Daten für Modul 1.
- `aspekt_neu_c1.json`: Daten für Modul 2.
- `sesler/`: Audio-Dateien für Modul 1.

## 📖 Nutzung
1. Öffne die `index.html`.
2. Wähle zwischen **Modul 1** oder **Modul 2**.
3. In Modul 2 wählst du beim ersten Start deine Muttersprache aus.
4. Beginne mit den Lernkarten oder teste dein Wissen direkt im Quiz.

## 🗄️ Archiv

Dieses Repository ist die aktuelle, gepflegte Version. Eine frühere, kleinere Version mit ähnlichem Thema (`HEY-Bist-Du-Bereit---C1`) ist zur Referenz unter [`archive/v1-hey-bist-du-bereit-c1/`](archive/v1-hey-bist-du-bereit-c1/) abgelegt und wird nicht mehr separat gepflegt.

---
*Erstellt für Deutschlerner auf dem Weg zum C1-Niveau.*
 (iOS Safari, Chrome Mobile)

### Responsive Tasarım
- 📱 Mobil telefonlar
- 📱 Tabletler
- 💻 Masaüstü bilgisayarlar

## 🎓 Kelime Veritabanı

Kelimeler Excel dosyasından (`vokabelliste-web-14.2.2026.xlsx`) JSON formatına dönüştürülür.

### Veri Yapısı
```json
{
  "id": 1,
  "wort": "schiefgehen",
  "grammatik": "geht schief, ging schief, ist schiefgegangen",
  "beispiel": "Gestern ging wirklich alles schief – was für ein Tag!",
  "lektion": 1,
  "audio": "1.opus",
  "teil": 1
}
```

### Yeni Kelime Eklemek

1. Excel dosyasını düzenleyin
2. Python scripti ile JSON'a dönüştürün:

```python
import pandas as pd
import json

df = pd.read_excel('vokabelliste-web-14.2.2026.xlsx')
# ... (DEPLOYMENT.md'deki kod)
```

## 🎨 Özelleştirme

### Renkleri Değiştirmek
`index.html` içindeki CSS bölümünde:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Yeni Özellik Eklemek
JavaScript bölümünü düzenleyerek:
- Farklı quiz tipleri
- Spaced repetition algoritması
- Çoklu dil desteği
- Vb.

## 📝 Lisans

Bu proje kişisel kullanım için geliştirilmiştir.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Push edin (`git push origin feature/yeniOzellik`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için GitHub Issues kullanabilirsiniz.

---

**Made with ❤️ for German language learners**

🇩🇪 Viel Erfolg beim Deutschlernen! 🎓
