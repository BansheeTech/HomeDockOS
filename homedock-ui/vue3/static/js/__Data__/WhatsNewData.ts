// homedock-ui/vue3/static/js/__Data__/WhatsNewData.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

export type LocalizedText = { en: string } & Partial<Record<string, string>>;

export interface WhatsNewTag {
  key?: string;
  label?: string;
  accent?: boolean;
}

export interface WhatsNewEntry {
  icon: string;
  title: LocalizedText;
  body: LocalizedText;
  tag?: WhatsNewTag;
  image?: string;
  docsUrl?: string;
}

export interface WhatsNewRelease {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  changelogUrl: string;
  entries: WhatsNewEntry[];
}

export function localized(text: LocalizedText, locale: string): string {
  return text[locale] || text.en;
}

export const releaseNotes: WhatsNewRelease = {
  id: "onscreen-apps",
  title: {
    en: "OnScreen Apps, Shortcuts, Widgets and more",
    es: "OnScreen Apps, accesos directos, widgets y más",
    de: "OnScreen Apps, Verknüpfungen, Widgets und mehr",
    fr: "OnScreen Apps, raccourcis, widgets et plus encore",
    it: "OnScreen Apps, collegamenti, widget e altro",
    pt: "OnScreen Apps, atalhos, widgets e muito mais",
    ru: "OnScreen Apps, ярлыки, виджеты и не только",
    uk: "OnScreen Apps, ярлики, віджети та інше",
    ja: "OnScreen Apps、ショートカット、ウィジェット、ほか多数",
    ko: "OnScreen Apps, 바로가기, 위젯 등",
    zh: "OnScreen Apps、快捷方式、小组件，以及更多",
  },
  subtitle: {
    en: "Applications now live inside HomeDock OS, in real windows, behind real HTTPS certificates.",
    es: "Las aplicaciones ya viven dentro de HomeDock OS, en ventanas de verdad y tras certificados HTTPS de verdad.",
    de: "Anwendungen leben jetzt in HomeDock OS, in echten Fenstern und hinter echten HTTPS-Zertifikaten.",
    fr: "Les applications vivent désormais dans HomeDock OS, dans de vraies fenêtres et derrière de vrais certificats HTTPS.",
    it: "Le applicazioni ora vivono dentro HomeDock OS, in finestre vere e dietro veri certificati HTTPS.",
    pt: "Os aplicativos agora vivem dentro do HomeDock OS, em janelas de verdade e atrás de certificados HTTPS de verdade.",
    ru: "Приложения теперь живут внутри HomeDock OS, в настоящих окнах и за настоящими сертификатами HTTPS.",
    uk: "Застосунки тепер живуть усередині HomeDock OS, у справжніх вікнах і за справжніми сертифікатами HTTPS.",
    ja: "アプリは HomeDock OS の中で、本物のウィンドウと本物の HTTPS 証明書とともに動くようになりました。",
    ko: "이제 애플리케이션은 HomeDock OS 안에서, 진짜 창과 진짜 HTTPS 인증서와 함께 동작합니다.",
    zh: "应用现在住在 HomeDock OS 里面，拥有真正的窗口和真正的 HTTPS 证书。",
  },
  changelogUrl: "https://github.com/BansheeTech/HomeDockOS/blob/main/CHANGELOG.md",
  entries: [
    {
      icon: "window",
      tag: { label: "OnScreen Apps", accent: true },
      image: "whatsnew/onscreen-apps.webp",
      docsUrl: "https://docs.homedock.cloud/homedock-os/desktop/#onscreen-apps",
      title: {
        en: "Apps open inside HomeDock OS",
        es: "Las apps se abren dentro de HomeDock OS",
        de: "Apps öffnen sich in HomeDock OS",
        fr: "Les apps s'ouvrent dans HomeDock OS",
        it: "Le app si aprono dentro HomeDock OS",
        pt: "As apps abrem dentro do HomeDock OS",
        ru: "Приложения открываются внутри HomeDock OS",
        uk: "Застосунки відкриваються всередині HomeDock OS",
        ja: "アプリは HomeDock OS の中で開きます",
        ko: "앱이 HomeDock OS 안에서 열립니다",
        zh: "应用在 HomeDock OS 内部打开",
      },
      body: {
        en: "Every app gets its own address and opens in a real window instead of another tab. Sound keeps playing while you drag it, and downloads land where you told them to.",
        es: "Cada aplicación tiene su propia dirección y se abre en una ventana real, no en otra pestaña. El sonido sigue sonando mientras la arrastras y las descargas caen donde tú dijiste.",
        de: "Jede App bekommt ihre eigene Adresse und öffnet sich in einem echten Fenster statt in einem weiteren Tab. Der Ton läuft weiter, während du sie ziehst, und Downloads landen dort, wo du es gesagt hast.",
        fr: "Chaque application a sa propre adresse et s'ouvre dans une vraie fenêtre plutôt que dans un autre onglet. Le son continue pendant que vous la déplacez et les téléchargements arrivent là où vous l'avez demandé.",
        it: "Ogni applicazione ha il proprio indirizzo e si apre in una finestra vera invece che in un'altra scheda. L'audio continua mentre la trascini e i download finiscono dove hai detto tu.",
        pt: "Cada aplicativo tem o seu próprio endereço e abre em uma janela de verdade, não em outra aba. O som continua tocando enquanto você arrasta a janela, e os downloads vão parar onde você mandou.",
        ru: "У каждого приложения свой адрес, и оно открывается в настоящем окне, а не в новой вкладке. Звук продолжает играть, пока вы перетаскиваете окно, а загрузки попадают туда, куда вы сказали.",
        uk: "Кожен застосунок має власну адресу і відкривається у справжньому вікні, а не в новій вкладці. Звук не переривається, поки ви перетягуєте вікно, а завантаження потрапляють туди, куди ви сказали.",
        ja: "すべてのアプリが独自のアドレスを持ち、別のタブではなく本物のウィンドウで開きます。ドラッグ中も音は途切れず、ダウンロードは指定した場所に届きます。",
        ko: "모든 앱이 각자의 주소를 갖고 새 탭이 아니라 진짜 창에서 열립니다. 창을 끄는 동안에도 소리는 계속 나오고, 다운로드는 지정한 곳으로 저장됩니다.",
        zh: "每个应用都有自己的地址，并在真正的窗口中打开，而不是另开一个标签页。拖动时声音不会中断，下载也会落到你指定的位置。",
      },
    },
    {
      icon: "split",
      image: "whatsnew/side-by-side.webp",
      docsUrl: "https://docs.homedock.cloud/homedock-os/desktop/#quick-view",
      title: {
        en: "Two apps at once, side by side",
        es: "Dos apps a la vez, una al lado de la otra",
        de: "Zwei Apps gleichzeitig, nebeneinander",
        fr: "Deux apps à la fois, côte à côte",
        it: "Due app insieme, una accanto all'altra",
        pt: "Duas apps ao mesmo tempo, lado a lado",
        ru: "Два приложения сразу, бок о бок",
        uk: "Два застосунки водночас, поруч",
        ja: "2 つのアプリを並べて同時に",
        ko: "두 앱을 나란히 동시에",
        zh: "两个应用并排同时使用",
      },
      body: {
        en: "Resize them, stack them, work in one while the other keeps running. This is the part a browser tab was never going to give you.",
        es: "Cámbialas de tamaño, apílalas, trabaja en una mientras la otra sigue funcionando. Esto es lo que una pestaña del navegador nunca te iba a dar.",
        de: "Größe ändern, stapeln, in der einen arbeiten, während die andere weiterläuft. Genau das konnte ein Browser-Tab nie leisten.",
        fr: "Redimensionnez-les, empilez-les, travaillez dans l'une pendant que l'autre tourne. C'est précisément ce qu'un onglet de navigateur n'allait jamais vous offrir.",
        it: "Ridimensionale, impilale, lavora in una mentre l'altra continua a girare. È proprio quello che una scheda del browser non ti avrebbe mai dato.",
        pt: "Redimensione, empilhe, trabalhe em um enquanto o outro continua rodando. É justamente o que uma aba do navegador nunca ia te dar.",
        ru: "Меняйте размер, накладывайте друг на друга, работайте в одном, пока второе продолжает работать. Именно этого вкладка браузера никогда бы вам не дала.",
        uk: "Змінюйте розмір, складайте їх, працюйте в одному, поки інший далі працює. Саме цього вкладка браузера вам ніколи б не дала.",
        ja: "サイズを変え、重ね、片方を動かしたままもう片方で作業できます。ブラウザーのタブには決してできなかった部分です。",
        ko: "크기를 바꾸고, 겹치고, 하나에서 작업하는 동안 다른 하나는 계속 돌아갑니다. 브라우저 탭으로는 결코 얻을 수 없던 부분입니다.",
        zh: "调整大小、层叠摆放，在一个里工作的同时另一个照常运行。这正是浏览器标签页永远给不了你的部分。",
      },
    },
    {
      icon: "lock",
      tag: { label: "Let's Encrypt SSL", accent: true },
      image: "whatsnew/https-certificates.webp",
      docsUrl: "https://docs.homedock.cloud/setup/ssl-https/#automatic-certificates",
      title: {
        en: "Automatic HTTPS certificates",
        es: "Certificados HTTPS automáticos",
        de: "Automatische HTTPS-Zertifikate",
        fr: "Certificats HTTPS automatiques",
        it: "Certificati HTTPS automatici",
        pt: "Certificados HTTPS automáticos",
        ru: "Автоматические сертификаты HTTPS",
        uk: "Автоматичні сертифікати HTTPS",
        ja: "HTTPS 証明書を自動で取得",
        ko: "자동 HTTPS 인증서",
        zh: "自动 HTTPS 证书",
      },
      body: {
        en: "Pick your DNS provider, paste a token, and HomeDock OS obtains a real wildcard certificate for your domain and every app under it. No app ports to open anymore.",
        es: "Elige tu proveedor de DNS, pega un token y HomeDock OS obtiene un certificado wildcard real para tu dominio y para todas las apps que cuelgan de él. Ya no hay que abrir puertos por aplicación.",
        de: "Wähle deinen DNS-Anbieter, füge ein Token ein, und HomeDock OS holt ein echtes Wildcard-Zertifikat für deine Domain und jede App darunter. Keine App-Ports mehr, die geöffnet werden müssen.",
        fr: "Choisissez votre fournisseur DNS, collez un jeton, et HomeDock OS obtient un vrai certificat wildcard pour votre domaine et toutes les apps qui en dépendent. Plus aucun port d'application à ouvrir.",
        it: "Scegli il tuo provider DNS, incolla un token e HomeDock OS ottiene un vero certificato wildcard per il tuo dominio e per ogni app che ci sta sotto. Niente più porte da aprire per le app.",
        pt: "Escolha o seu provedor de DNS, cole um token e o HomeDock OS obtém um certificado wildcard de verdade para o seu domínio e para todos os aplicativos abaixo dele. Não há mais portas de aplicativo para abrir.",
        ru: "Выберите DNS-провайдера, вставьте токен, и HomeDock OS получит настоящий wildcard-сертификат для вашего домена и всех приложений под ним. Больше не нужно открывать порты для приложений.",
        uk: "Оберіть свого DNS-провайдера, вставте токен, і HomeDock OS отримає справжній wildcard-сертифікат для вашого домену та всіх застосунків під ним. Більше не треба відкривати порти для застосунків.",
        ja: "DNS プロバイダーを選んでトークンを貼るだけで、HomeDock OS がドメインとその下のすべてのアプリに有効な本物のワイルドカード証明書を取得します。アプリごとのポート開放はもう不要です。",
        ko: "DNS 공급자를 고르고 토큰을 붙여넣으면 HomeDock OS가 도메인과 그 아래 모든 앱을 위한 진짜 와일드카드 인증서를 받아옵니다. 이제 앱마다 포트를 열 필요가 없습니다.",
        zh: "选择你的 DNS 服务商，粘贴一个令牌，HomeDock OS 就会为你的域名及其下的每个应用取得真正的通配符证书。不必再为应用开放端口。",
      },
    },
    {
      icon: "proxy",
      docsUrl: "https://docs.homedock.cloud/homedock-os/desktop/#onscreen-apps",
      title: {
        en: "A reverse proxy you never have to install",
        es: "Un proxy inverso que no tienes que instalar",
        de: "Ein Reverse Proxy, den du nie installieren musst",
        fr: "Un reverse proxy que vous n'avez jamais à installer",
        it: "Un reverse proxy che non devi installare",
        pt: "Um proxy reverso que você nunca precisa instalar",
        ru: "Обратный прокси, который не нужно устанавливать",
        uk: "Зворотний проксі, який не треба встановлювати",
        ja: "インストール不要のリバースプロキシ",
        ko: "설치할 필요가 없는 리버스 프록시",
        zh: "一个你永远不用安装的反向代理",
      },
      body: {
        en: "Host-based routing built in, HTTPS in front of containers that only speak HTTP, and WebSockets proxied end to end. Installing an app is the whole setup.",
        es: "Enrutado por Host integrado, HTTPS por delante de contenedores que solo hablan HTTP y WebSockets pasados de extremo a extremo. Instalar una app es toda la configuración.",
        de: "Host-basiertes Routing eingebaut, HTTPS vor Containern, die nur HTTP sprechen, und WebSockets durchgereicht. Eine App zu installieren ist die gesamte Einrichtung.",
        fr: "Routage par Host intégré, HTTPS devant des conteneurs qui ne parlent que HTTP, et WebSockets relayés de bout en bout. Installer une app, c'est toute la configuration.",
        it: "Routing per Host integrato, HTTPS davanti a container che parlano solo HTTP e WebSocket inoltrati da un capo all'altro. Installare un'app è tutta la configurazione.",
        pt: "Roteamento por Host integrado, HTTPS na frente de contêineres que só falam HTTP e WebSockets encaminhados de ponta a ponta. Instalar um aplicativo é toda a configuração.",
        ru: "Встроенная маршрутизация по Host, HTTPS перед контейнерами, которые умеют только HTTP, и WebSocket, проброшенный насквозь. Установка приложения и есть вся настройка.",
        uk: "Вбудована маршрутизація за Host, HTTPS перед контейнерами, що знають лише HTTP, і WebSocket, проведений наскрізь. Встановити застосунок — це і є вся настройка.",
        ja: "Host ベースのルーティングを内蔵し、HTTP しか話さないコンテナの前に HTTPS を置き、WebSocket も端から端まで中継します。アプリを入れれば設定は終わりです。",
        ko: "Host 기반 라우팅이 기본 탑재되어 HTTP만 아는 컨테이너 앞에 HTTPS를 세우고, WebSocket도 끝까지 중계합니다. 앱을 설치하면 설정은 그것으로 끝입니다.",
        zh: "内置基于 Host 的路由，为只会说 HTTP 的容器套上 HTTPS，并端到端转发 WebSocket。装好应用，配置就已经完成了。",
      },
    },
    {
      icon: "widget",
      image: "whatsnew/widgets.webp",
      docsUrl: "https://docs.homedock.cloud/homedock-os/desktop/#widgets",
      title: {
        en: "Widgets on the desktop",
        es: "Widgets en el escritorio",
        de: "Widgets auf dem Schreibtisch",
        fr: "Des widgets sur le bureau",
        it: "Widget sulla scrivania",
        pt: "Widgets na área de trabalho",
        ru: "Виджеты на рабочем столе",
        uk: "Віджети на стільниці",
        ja: "デスクトップにウィジェット",
        ko: "바탕화면 위의 위젯",
        zh: "桌面上的小组件",
      },
      body: {
        en: "Clock, System, Storage, Notes, Network, Calendar, Media and Shortcut, anywhere on the grid. The wallpaper was not doing much anyway.",
        es: "Reloj, Sistema, Almacenamiento, Notas, Red, Calendario, Multimedia y Acceso directo, donde quieras de la rejilla. El fondo de pantalla tampoco hacía gran cosa.",
        de: "Uhr, System, Speicher, Notizen, Netzwerk, Kalender, Medien und Verknüpfung, überall im Raster. Das Hintergrundbild hatte ohnehin wenig zu tun.",
        fr: "Horloge, Système, Stockage, Notes, Réseau, Calendrier, Média et Raccourci, où vous voulez sur la grille. Le fond d'écran ne faisait pas grand-chose de toute façon.",
        it: "Orologio, Sistema, Archiviazione, Note, Rete, Calendario, Media e Collegamento, ovunque sulla griglia. Lo sfondo non stava facendo granché.",
        pt: "Relógio, Sistema, Armazenamento, Notas, Rede, Calendário, Mídia e Atalho, em qualquer lugar da grade. O papel de parede também não estava fazendo muita coisa.",
        ru: "Часы, Система, Хранилище, Заметки, Сеть, Календарь, Медиа и Ярлык, в любом месте сетки. Обои всё равно простаивали.",
        uk: "Годинник, Система, Сховище, Нотатки, Мережа, Календар, Медіа і Ярлик, будь-де на сітці. Шпалери все одно нічого не робили.",
        ja: "時計、システム、ストレージ、メモ、ネットワーク、カレンダー、メディア、ショートカットをグリッドの好きな場所へ。どうせ壁紙は暇そうでした。",
        ko: "시계, 시스템, 저장소, 메모, 네트워크, 캘린더, 미디어, 바로가기를 그리드 어디에나. 배경화면은 어차피 별로 하는 일이 없었습니다.",
        zh: "时钟、系统、存储、便签、网络、日历、媒体和快捷方式，放在网格上的任意位置。反正壁纸也没什么事做。",
      },
    },
    {
      icon: "shortcut",
      image: "whatsnew/shortcuts.webp",
      docsUrl: "https://docs.homedock.cloud/homedock-os/desktop/#desktop-shortcuts",
      title: {
        en: "Shortcuts to sites, files and folders",
        es: "Accesos directos a webs, archivos y carpetas",
        de: "Verknüpfungen zu Seiten, Dateien und Ordnern",
        fr: "Des raccourcis vers des sites, des fichiers et des dossiers",
        it: "Collegamenti a siti, file e cartelle",
        pt: "Atalhos para sites, arquivos e pastas",
        ru: "Ярлыки на сайты, файлы и папки",
        uk: "Ярлики на сайти, файли та теки",
        ja: "サイト、ファイル、フォルダーへのショートカット",
        ko: "사이트, 파일, 폴더 바로가기",
        zh: "指向网站、文件和文件夹的快捷方式",
      },
      body: {
        en: "Paste a URL, or right-click anything in File Explorer and add it to the Desktop. Nothing is ever copied: a shortcut is a pointer and weighs nothing.",
        es: "Pega una URL, o haz clic derecho en cualquier cosa del Explorador de Archivos y añádela al escritorio. Nunca se copia nada: un acceso directo es un puntero y no pesa.",
        de: "Füge eine URL ein oder klicke mit rechts auf etwas im Datei-Explorer und lege es auf den Schreibtisch. Nichts wird kopiert: eine Verknüpfung ist ein Zeiger und wiegt nichts.",
        fr: "Collez une URL, ou faites un clic droit sur n'importe quoi dans l'Explorateur de fichiers et ajoutez-le au bureau. Rien n'est jamais copié : un raccourci est un pointeur et ne pèse rien.",
        it: "Incolla un URL, oppure fai clic destro su qualsiasi cosa in Esplora File e aggiungila alla scrivania. Non viene mai copiato nulla: un collegamento è un puntatore e non pesa.",
        pt: "Cole uma URL, ou clique com o botão direito em qualquer coisa no Explorador de arquivos e adicione à área de trabalho. Nada é copiado: um atalho é um ponteiro e não pesa nada.",
        ru: "Вставьте ссылку или щёлкните правой кнопкой по чему угодно в Проводнике и добавьте это на рабочий стол. Ничего не копируется: ярлык — это указатель, он ничего не весит.",
        uk: "Вставте URL або клацніть правою кнопкою будь-що в Провіднику файлів і додайте це на стільницю. Нічого не копіюється: ярлик — це вказівник, він нічого не важить.",
        ja: "URL を貼り付けるか、ファイルエクスプローラーで右クリックしてデスクトップに追加するだけ。コピーは一切されません。ショートカットはポインターで、容量を取りません。",
        ko: "URL을 붙여넣거나 파일 탐색기에서 아무거나 마우스 오른쪽 버튼으로 눌러 바탕화면에 추가하세요. 아무것도 복사되지 않습니다. 바로가기는 포인터라 용량을 차지하지 않습니다.",
        zh: "粘贴一个网址，或在文件浏览器中右键点击任意内容并添加到桌面。不会复制任何东西：快捷方式只是一个指针，不占空间。",
      },
    },
    {
      icon: "quickview",
      image: "whatsnew/quick-view.webp",
      docsUrl: "https://docs.homedock.cloud/homedock-os/desktop/#quick-view",
      title: {
        en: "Quick View and screenshots",
        es: "Vista rápida y capturas de pantalla",
        de: "Schnellansicht und Screenshots",
        fr: "Aperçu rapide et captures d'écran",
        it: "Vista rapida e screenshot",
        pt: "Vista rápida e capturas de tela",
        ru: "Быстрый просмотр и снимки экрана",
        uk: "Швидкий перегляд і знімки екрана",
        ja: "クイックビューとスクリーンショット",
        ko: "빠른 보기와 스크린샷",
        zh: "快速查看与截图",
      },
      body: {
        en: "F3 spreads every open window into a grid and brings them back where they were. Screenshot captures what you actually see, apps included, straight into Photos.",
        es: "F3 despliega todas las ventanas abiertas en una rejilla y las devuelve a su sitio. La captura recoge lo que ves de verdad, apps incluidas, directa a Photos.",
        de: "F3 verteilt alle offenen Fenster in einem Raster und bringt sie zurück an ihren Platz. Der Screenshot nimmt auf, was du wirklich siehst, Apps inklusive, direkt nach Photos.",
        fr: "F3 étale toutes les fenêtres ouvertes en grille puis les remet à leur place. La capture prend ce que vous voyez vraiment, applications comprises, directement dans Photos.",
        it: "F3 dispone tutte le finestre aperte in una griglia e poi le rimette al loro posto. Lo screenshot cattura quello che vedi davvero, app comprese, dritto in Photos.",
        pt: "O F3 espalha todas as janelas abertas em uma grade e devolve cada uma ao seu lugar. A captura pega o que você realmente vê, aplicativos inclusive, direto para Photos.",
        ru: "F3 раскладывает все открытые окна в сетку и возвращает их на место. Снимок экрана захватывает то, что вы действительно видите, вместе с приложениями, прямо в Photos.",
        uk: "F3 розкладає всі відкриті вікна в сітку і повертає їх на місце. Знімок захоплює те, що ви справді бачите, разом із застосунками, одразу в Photos.",
        ja: "F3 で開いているウィンドウがグリッドに広がり、元の位置へ戻ります。スクリーンショットはアプリも含めて実際に見えているものを、そのまま Photos に保存します。",
        ko: "F3을 누르면 열린 창이 모두 그리드로 펼쳐졌다가 제자리로 돌아갑니다. 스크린샷은 앱까지 포함해 실제로 보이는 화면을 그대로 Photos에 저장합니다.",
        zh: "按 F3 让所有打开的窗口铺成网格，再各归各位。截图会捕捉你真正看到的画面，连同应用一起，直接存入 Photos。",
      },
    },
    {
      icon: "help",
      tag: { key: "Improved" },
      title: {
        en: "Every setting explains itself",
        es: "Cada ajuste se explica solo",
        de: "Jede Einstellung erklärt sich selbst",
        fr: "Chaque réglage s'explique tout seul",
        it: "Ogni impostazione si spiega da sola",
        pt: "Cada configuração se explica sozinha",
        ru: "Каждая настройка объясняет сама себя",
        uk: "Кожне налаштування пояснює себе саме",
        ja: "すべての設定が自分で説明します",
        ko: "모든 설정이 스스로를 설명합니다",
        zh: "每一项设置都会自我解释",
      },
      body: {
        en: "Twenty-one help notes across the five Settings panels: what each one does, what it costs you, and the edge case nobody warns you about.",
        es: "Veintiuna notas de ayuda repartidas por los cinco paneles de Ajustes: qué hace cada uno, qué te cuesta y el caso raro del que nadie te avisa.",
        de: "Einundzwanzig Hilfehinweise in den fünf Einstellungsbereichen: was jede Option tut, was sie kostet und der Sonderfall, vor dem dich niemand warnt.",
        fr: "Vingt et une notes d'aide réparties dans les cinq panneaux des Réglages : ce que fait chacun, ce qu'il coûte, et le cas particulier dont personne ne vous parle.",
        it: "Ventuno note di aiuto sparse nei cinque pannelli delle Impostazioni: cosa fa ciascuna, cosa ti costa e il caso limite di cui nessuno ti avverte.",
        pt: "Vinte e uma notas de ajuda pelos cinco painéis das Configurações: o que cada uma faz, o que ela custa e o caso raro sobre o qual ninguém te avisa.",
        ru: "Двадцать одна подсказка в пяти разделах настроек: что делает каждая опция, чего она стоит и тот самый случай, о котором никто не предупреждает.",
        uk: "Двадцять одна підказка в п'яти панелях налаштувань: що робить кожне, чого воно вартує і той окремий випадок, про який ніхто не попереджає.",
        ja: "設定の 5 つのパネルに 21 個のヘルプ。何をするのか、何と引き換えなのか、そして誰も教えてくれない例外まで。",
        ko: "설정의 다섯 개 패널에 걸친 스물한 개의 도움말: 무엇을 하는지, 무엇을 감수해야 하는지, 그리고 아무도 알려주지 않는 예외까지.",
        zh: "五个设置面板里共二十一条说明：它做什么、代价是什么，以及没人会提醒你的那个特殊情况。",
      },
    },
  ],
};
