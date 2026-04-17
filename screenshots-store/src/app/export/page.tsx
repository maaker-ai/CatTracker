"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Target: 1290 x 2796 (6.7" iPhone)
const W = 1290;
const H = 2796;

type SlideText = {
  tagline: string;
  subtitle: string;
  caption: string;
};

// Narrative arc: 痛点 → 速度 → 价值 → 专业 → 规模
const LOCALIZED_SLIDES: Record<string, SlideText[]> = {
  en: [
    { tagline: "Is your cat", subtitle: "acting off?", caption: "Spot health changes in\n10 seconds a day" },
    { tagline: "Log in", subtitle: "10 seconds", caption: "Smart defaults.\nNo typing needed." },
    { tagline: "Catch patterns", subtitle: "early", caption: "Weight, appetite, mood —\nall visualized" },
    { tagline: "Share reports", subtitle: "with your vet", caption: "One-tap PDF export.\nNo login needed." },
    { tagline: "One app,", subtitle: "all your cats", caption: "Multi-cat support.\nVaccine reminders." },
  ],
  "zh-Hans": [
    { tagline: "你家猫最近", subtitle: "怪怪的？", caption: "每天 10 秒\n发现健康异常" },
    { tagline: "10 秒", subtitle: "完成记录", caption: "智能默认值\n无需打字" },
    { tagline: "趋势变化", subtitle: "早发现", caption: "体重、食欲、情绪\n一图看懂" },
    { tagline: "一键导出", subtitle: "给兽医", caption: "PDF 报告\n无需注册账号" },
    { tagline: "一个 App", subtitle: "管所有猫", caption: "多猫支持\n疫苗提醒" },
  ],
  "zh-Hant": [
    { tagline: "你家貓最近", subtitle: "怪怪的？", caption: "每天 10 秒\n發現健康異常" },
    { tagline: "10 秒", subtitle: "完成記錄", caption: "智慧預設值\n無需打字" },
    { tagline: "趨勢變化", subtitle: "早發現", caption: "體重、食慾、情緒\n一圖看懂" },
    { tagline: "一鍵匯出", subtitle: "給獸醫", caption: "PDF 報告\n無需註冊帳號" },
    { tagline: "一個 App", subtitle: "管所有貓", caption: "多貓支援\n疫苗提醒" },
  ],
  ja: [
    { tagline: "もしかして、", subtitle: "体調悪い？", caption: "1日10秒で\n愛猫の異変に気づく" },
    { tagline: "記録は", subtitle: "10秒", caption: "スマート初期値\n入力いらず" },
    { tagline: "変化を", subtitle: "いち早く", caption: "体重・食欲・気分\nすべて見える化" },
    { tagline: "獣医さんに", subtitle: "ワンタップ共有", caption: "PDF出力\nアカウント不要" },
    { tagline: "全ての猫を", subtitle: "1つのアプリで", caption: "多頭飼い対応\nワクチン通知" },
  ],
  ko: [
    { tagline: "우리 고양이", subtitle: "어딘가 이상해?", caption: "하루 10초로\n건강 이상 포착" },
    { tagline: "10초면", subtitle: "기록 끝", caption: "스마트 기본값\n타이핑 불필요" },
    { tagline: "변화를", subtitle: "빠르게 포착", caption: "체중·식욕·기분\n한눈에 시각화" },
    { tagline: "수의사에게", subtitle: "원탭 공유", caption: "PDF 내보내기\n계정 가입 불필요" },
    { tagline: "한 앱으로", subtitle: "모든 고양이", caption: "다묘 지원\n예방접종 알림" },
  ],
  de: [
    { tagline: "Ist deine Katze", subtitle: "komisch?", caption: "Gesundheits-\nveränderungen in 10 Sek" },
    { tagline: "In 10 Sek", subtitle: "erfasst", caption: "Smarte Vorgaben.\nKein Tippen nötig." },
    { tagline: "Muster", subtitle: "früh erkennen", caption: "Gewicht, Appetit, Stimmung —\nalles visuell" },
    { tagline: "Bericht für", subtitle: "den Tierarzt", caption: "PDF per Tap.\nKein Login nötig." },
    { tagline: "Eine App,", subtitle: "alle Katzen", caption: "Multi-Katzen-Support.\nImpferinnerungen." },
  ],
  fr: [
    { tagline: "Votre chat", subtitle: "semble bizarre ?", caption: "Repérez les changements\nen 10 secondes par jour" },
    { tagline: "Notez en", subtitle: "10 secondes", caption: "Valeurs intelligentes.\nAucune saisie." },
    { tagline: "Détectez", subtitle: "les tendances", caption: "Poids, appétit, humeur —\ntout visualisé" },
    { tagline: "Partagez avec", subtitle: "le vétérinaire", caption: "Export PDF en un tap.\nSans compte." },
    { tagline: "Une app,", subtitle: "tous vos chats", caption: "Multi-chats.\nRappels vaccins." },
  ],
  es: [
    { tagline: "¿Tu gato", subtitle: "actúa raro?", caption: "Detecta cambios de salud\nen 10 segundos al día" },
    { tagline: "Registra en", subtitle: "10 segundos", caption: "Valores inteligentes.\nSin teclear." },
    { tagline: "Detecta", subtitle: "patrones antes", caption: "Peso, apetito, humor —\ntodo visualizado" },
    { tagline: "Informe para", subtitle: "el veterinario", caption: "PDF con un toque.\nSin cuenta." },
    { tagline: "Una app,", subtitle: "todos tus gatos", caption: "Multi-gato.\nRecordatorios de vacunas." },
  ],
  ru: [
    { tagline: "Ваш кот", subtitle: "странно себя ведёт?", caption: "Замечайте изменения\nза 10 секунд в день" },
    { tagline: "Запись за", subtitle: "10 секунд", caption: "Умные значения.\nБез набора." },
    { tagline: "Замечайте", subtitle: "тренды раньше", caption: "Вес, аппетит, настроение —\nвсё визуально" },
    { tagline: "Отчёт", subtitle: "для ветеринара", caption: "PDF в один тап.\nБез аккаунта." },
    { tagline: "Одно app,", subtitle: "все ваши коты", caption: "Несколько котов.\nНапоминания о прививках." },
  ],
  it: [
    { tagline: "Il tuo gatto", subtitle: "fa cose strane?", caption: "Individua cambi di salute\nin 10 secondi al giorno" },
    { tagline: "Registra in", subtitle: "10 secondi", caption: "Valori intelligenti.\nNiente digitazione." },
    { tagline: "Cogli i pattern", subtitle: "in anticipo", caption: "Peso, appetito, umore —\ntutto visualizzato" },
    { tagline: "Report per", subtitle: "il veterinario", caption: "PDF con un tap.\nSenza account." },
    { tagline: "Un'app,", subtitle: "tutti i tuoi gatti", caption: "Multi-gatto.\nPromemoria vaccini." },
  ],
  ar: [
    { tagline: "هل قطتك", subtitle: "تتصرف بغرابة؟", caption: "اكتشف تغيرات الصحة\nفي 10 ثوانٍ يومياً" },
    { tagline: "سجّل في", subtitle: "10 ثوانٍ", caption: "قيم ذكية افتراضية.\nدون كتابة." },
    { tagline: "اكتشف الأنماط", subtitle: "مبكراً", caption: "الوزن، الشهية، المزاج —\nالكل مرئي" },
    { tagline: "شارك التقرير", subtitle: "مع الطبيب", caption: "تصدير PDF بضغطة.\nدون حساب." },
    { tagline: "تطبيق واحد،", subtitle: "كل قططك", caption: "دعم عدة قطط.\nتذكير بالتطعيمات." },
  ],
  id: [
    { tagline: "Kucingmu", subtitle: "aneh belakangan?", caption: "Deteksi perubahan kesehatan\ndalam 10 detik sehari" },
    { tagline: "Catat dalam", subtitle: "10 detik", caption: "Nilai cerdas default.\nTanpa mengetik." },
    { tagline: "Tangkap pola", subtitle: "lebih awal", caption: "Berat, nafsu makan, mood —\nsemua tervisualisasi" },
    { tagline: "Bagikan ke", subtitle: "dokter hewan", caption: "Ekspor PDF satu tap.\nTanpa akun." },
    { tagline: "Satu app,", subtitle: "semua kucingmu", caption: "Multi-kucing.\nPengingat vaksin." },
  ],
  tr: [
    { tagline: "Kedin", subtitle: "garip mi?", caption: "Günde 10 saniyede\nsağlık değişikliklerini yakala" },
    { tagline: "10 saniyede", subtitle: "kaydet", caption: "Akıllı varsayılanlar.\nYazmaya gerek yok." },
    { tagline: "Örüntüleri", subtitle: "erken yakala", caption: "Kilo, iştah, ruh hâli —\nhepsi görsel" },
    { tagline: "Veterinerle", subtitle: "paylaş", caption: "Tek dokunuşla PDF.\nHesap gerekmez." },
    { tagline: "Tek app,", subtitle: "tüm kedilerin", caption: "Çok kedi desteği.\nAşı hatırlatmaları." },
  ],
  nl: [
    { tagline: "Doet je kat", subtitle: "vreemd?", caption: "Ontdek gezondheids-\nveranderingen in 10 sec per dag" },
    { tagline: "Log in", subtitle: "10 seconden", caption: "Slimme standaardwaarden.\nGeen typen nodig." },
    { tagline: "Herken patronen", subtitle: "vroeg", caption: "Gewicht, eetlust, humeur —\nalles in beeld" },
    { tagline: "Deel met", subtitle: "je dierenarts", caption: "PDF in één tik.\nGeen account nodig." },
    { tagline: "Eén app,", subtitle: "al je katten", caption: "Multi-kat ondersteuning.\nVaccinherinneringen." },
  ],
  "pt-BR": [
    { tagline: "Seu gato", subtitle: "está estranho?", caption: "Detecte mudanças de saúde\nem 10 segundos por dia" },
    { tagline: "Registre em", subtitle: "10 segundos", caption: "Valores inteligentes.\nSem digitar." },
    { tagline: "Perceba padrões", subtitle: "cedo", caption: "Peso, apetite, humor —\ntudo visualizado" },
    { tagline: "Compartilhe com", subtitle: "o veterinário", caption: "PDF em um toque.\nSem conta." },
    { tagline: "Um app,", subtitle: "todos seus gatos", caption: "Multi-gato.\nLembretes de vacina." },
  ],
  pl: [
    { tagline: "Twój kot", subtitle: "dziwnie się zachowuje?", caption: "Wyłap zmiany zdrowia\nw 10 sekund dziennie" },
    { tagline: "Zapis w", subtitle: "10 sekund", caption: "Inteligentne wartości.\nBez pisania." },
    { tagline: "Zauważ wzorce", subtitle: "wcześnie", caption: "Waga, apetyt, nastrój —\nwszystko na wykresie" },
    { tagline: "Udostępnij", subtitle: "weterynarzowi", caption: "PDF jednym dotknięciem.\nBez konta." },
    { tagline: "Jedna apka,", subtitle: "wszystkie koty", caption: "Obsługa wielu kotów.\nPrzypomnienia o szczepieniach." },
  ],
  sv: [
    { tagline: "Beter sig din katt", subtitle: "konstigt?", caption: "Upptäck hälsoförändringar\npå 10 sekunder per dag" },
    { tagline: "Logga på", subtitle: "10 sekunder", caption: "Smarta förval.\nIngen skrivning." },
    { tagline: "Upptäck mönster", subtitle: "tidigt", caption: "Vikt, aptit, humör —\nallt visualiserat" },
    { tagline: "Dela med", subtitle: "veterinären", caption: "PDF med ett tryck.\nIngen inloggning." },
    { tagline: "En app,", subtitle: "alla dina katter", caption: "Stöd för flera katter.\nVaccinpåminnelser." },
  ],
  no: [
    { tagline: "Oppfører katten", subtitle: "seg rart?", caption: "Oppdag helseendringer\npå 10 sekunder daglig" },
    { tagline: "Logg på", subtitle: "10 sekunder", caption: "Smarte standarder.\nIngen skriving." },
    { tagline: "Oppdag mønstre", subtitle: "tidlig", caption: "Vekt, appetitt, humør —\nalt visualisert" },
    { tagline: "Del med", subtitle: "veterinæren", caption: "PDF med ett trykk.\nIngen konto." },
    { tagline: "Én app,", subtitle: "alle kattene", caption: "Støtte for flere katter.\nVaksinepåminnelser." },
  ],
  da: [
    { tagline: "Opfører din kat", subtitle: "sig underligt?", caption: "Opdag helbreds-\nændringer på 10 sek dagligt" },
    { tagline: "Log på", subtitle: "10 sekunder", caption: "Smarte standarder.\nIngen skrivning." },
    { tagline: "Opdag mønstre", subtitle: "tidligt", caption: "Vægt, appetit, humør —\nalt visualiseret" },
    { tagline: "Del med", subtitle: "dyrlægen", caption: "PDF med ét tryk.\nIngen konto." },
    { tagline: "Én app,", subtitle: "alle dine katte", caption: "Flere-katte-support.\nVaccine-påmindelser." },
  ],
  th: [
    { tagline: "แมวคุณ", subtitle: "ดูแปลกๆ?", caption: "จับความเปลี่ยนแปลงสุขภาพ\nใน 10 วินาทีต่อวัน" },
    { tagline: "บันทึกใน", subtitle: "10 วินาที", caption: "ค่าตั้งต้นอัจฉริยะ\nไม่ต้องพิมพ์" },
    { tagline: "จับรูปแบบ", subtitle: "ได้แต่เนิ่นๆ", caption: "น้ำหนัก ความอยากอาหาร อารมณ์\nเห็นทุกอย่าง" },
    { tagline: "ส่งรายงาน", subtitle: "ให้สัตวแพทย์", caption: "ส่งออก PDF แตะครั้งเดียว\nไม่ต้องสมัครบัญชี" },
    { tagline: "แอปเดียว", subtitle: "ทุกตัว", caption: "รองรับหลายแมว\nแจ้งเตือนวัคซีน" },
  ],
};

type SlideConfig = {
  id: number;
  bg: string;
  screenSlide: string;
  catImage: string | null;
  darkText?: boolean;
};

const slideConfigs: SlideConfig[] = [
  { id: 1, bg: "linear-gradient(160deg, #F97316 0%, #EA580C 50%, #C2410C 100%)", screenSlide: "dashboard", catImage: "/cats/cat-hero-front.jpg" },
  { id: 2, bg: "linear-gradient(180deg, #FFF8F0 0%, #FED7AA 100%)", screenSlide: "log", catImage: null, darkText: true },
  { id: 3, bg: "linear-gradient(160deg, #FDBA74 0%, #F97316 50%, #EA580C 100%)", screenSlide: "timeline", catImage: "/cats/cat-relaxed-side.jpg" },
  { id: 4, bg: "linear-gradient(160deg, #C2410C 0%, #9A3412 50%, #7C2D12 100%)", screenSlide: "settings", catImage: "/cats/cat-blissful-closeup.jpg" },
  { id: 5, bg: "linear-gradient(160deg, #F97316 0%, #EA580C 50%, #C2410C 100%)", screenSlide: "profile", catImage: "/cats/cat-pair.jpg" },
];

function getSlides(lang: string) {
  const texts = LOCALIZED_SLIDES[lang] || LOCALIZED_SLIDES.en;
  return slideConfigs.map((config, i) => ({
    ...config,
    tagline: texts[i].tagline,
    subtitle: texts[i].subtitle,
    caption: texts[i].caption,
  }));
}

function PhoneMockup({ screenSlide, lang }: { screenSlide: string; lang: string }) {
  return (
    <div
      style={{
        width: 390,
        height: 844,
        background: "white",
        borderRadius: 54,
        border: "8px solid #1A1A2E",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform: "translateX(-50%)",
          width: 120,
          height: 36,
          background: "#1A1A2E",
          borderRadius: 20,
          zIndex: 10,
        }}
      />
      <img
        src={`/app-captures/${lang}/${screenSlide}.png`}
        alt={screenSlide}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

function SlideContent({ slideId, lang }: { slideId: number; lang: string }) {
  const slides = getSlides(lang);
  const slide = slides.find((s) => s.id === slideId);
  if (!slide) return <div>Slide not found</div>;

  const isHeroSlide = slideId === 1;
  const darkText = slide.darkText === true;

  // Extract first hex color from bg gradient for fade-out blend
  const firstHex = slide.bg.match(/#[A-F0-9]{6}/i)?.[0] || "#EA580C";

  // Text colors
  const primaryTextColor = darkText ? "#1A1A2E" : "white";
  const secondaryTextColor = darkText ? "#6B6B70" : "rgba(255,255,255,0.70)";
  const subtitleAccentColor = darkText
    ? "#EA580C"
    : isHeroSlide
    ? "#FED7AA"
    : slideId === 3
    ? "#FFF8F0"
    : slideId === 4
    ? "#FED7AA"
    : "#FDE68A";
  const headingShadow = darkText ? "none" : "0 4px 24px rgba(0,0,0,0.3)";

  // Caption shadow: only when caption overlays cat image (not on light-bg slide #2)
  const captionShadow = darkText
    ? "none"
    : "0 2px 16px rgba(0,0,0,0.7), 0 0 8px rgba(0,0,0,0.4)";

  // Hero (slide #1) — phone mockup is the main actor, cat is atmospheric,
  // icon is branding. Layout: icon → cat head/shoulders → headline → phone.
  if (isHeroSlide) {
    return (
      <div
        style={{
          width: W,
          height: H,
          background: slide.bg,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none", zIndex: 1 }} />

        {/* App Icon — top, centered */}
        <div
          style={{
            position: "absolute",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            width: 80,
            height: 80,
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            zIndex: 3,
          }}
        >
          <img
            src="/icon.png"
            alt="App icon"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Cat image — head/shoulders only, clean full display */}
        {slide.catImage && (
          <div
            style={{
              position: "absolute",
              top: 180,
              left: 0,
              right: 0,
              height: 620,
              overflow: "hidden",
              zIndex: 0,
            }}
          >
            <img
              src={slide.catImage}
              alt="cat"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 20%",
                filter: "brightness(1.0)",
              }}
            />
          </div>
        )}

        {/* Translucent orange reading band — full-width, hosts headline + caption */}
        <div
          style={{
            position: "absolute",
            top: 800,
            left: 0,
            right: 0,
            height: 460,
            background: "rgba(234, 88, 12, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "0 80px",
          }}
        >
          <div
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
              fontSize: 116,
              fontWeight: 900,
              color: "#FFFFFF",
              textAlign: "center",
              lineHeight: 1.05,
              letterSpacing: "-2px",
              marginBottom: 20,
            }}
          >
            {slide.tagline}
            <br />
            <span style={{ color: subtitleAccentColor }}>
              {slide.subtitle}
            </span>
          </div>

          <div
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
              fontSize: 48,
              color: "rgba(255,255,255,0.92)",
              textAlign: "center",
              lineHeight: 1.5,
              whiteSpace: "pre-line",
            }}
          >
            {slide.caption}
          </div>
        </div>

        {/* Phone mockup — below the band */}
        <div
          style={{
            position: "absolute",
            top: 1300,
            left: "50%",
            transform: "translateX(-50%) scale(3)",
            transformOrigin: "top center",
            filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.5))",
            zIndex: 2,
          }}
        >
          <PhoneMockup screenSlide={slide.screenSlide} lang={lang} />
        </div>
      </div>
    );
  }

  // Slides #2–#5 keep the original layout (icon + heading + caption + mockup).
  return (
    <div
      style={{
        width: W,
        height: H,
        background: slide.bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Cat image overlay (top half) */}
      {slide.catImage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1400,
            overflow: "hidden",
            zIndex: 0,
          }}
        >
          <img
            src={slide.catImage}
            alt="cat"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              filter: "brightness(0.85)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 300,
              background: `linear-gradient(to bottom, transparent, ${firstHex})`,
            }}
          />
        </div>
      )}

      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: darkText ? "rgba(234,88,12,0.08)" : "rgba(255,255,255,0.06)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: darkText ? "rgba(234,88,12,0.06)" : "rgba(255,255,255,0.04)", pointerEvents: "none", zIndex: 1 }} />

      {/* Content wrapper */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "100px 80px 0",
        }}
      >
        {/* Heading */}
        <div
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
            fontSize: 116,
            fontWeight: 900,
            color: primaryTextColor,
            textAlign: "center",
            lineHeight: 1.05,
            letterSpacing: "-2px",
            marginBottom: 16,
            textShadow: headingShadow,
          }}
        >
          {slide.tagline}
          <br />
          <span style={{ color: subtitleAccentColor }}>
            {slide.subtitle}
          </span>
        </div>

        {/* Caption */}
        <div
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
            fontSize: 48,
            color: secondaryTextColor,
            textAlign: "center",
            lineHeight: 1.5,
            marginBottom: 48,
            whiteSpace: "pre-line",
            textShadow: captionShadow,
          }}
        >
          {slide.caption}
        </div>

        {/* Phone mockup */}
        <div
          style={{
            transform: "scale(2.4)",
            transformOrigin: "top center",
            filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.5))",
          }}
        >
          <PhoneMockup screenSlide={slide.screenSlide} lang={lang} />
        </div>
      </div>
    </div>
  );
}

function ExportContent() {
  const searchParams = useSearchParams();
  const slideParam = searchParams.get("slide");
  const langParam = searchParams.get("lang");
  const slideId = slideParam ? parseInt(slideParam) : 1;
  const lang = langParam || "en";

  return (
    <div style={{ width: W, height: H, overflow: "hidden" }}>
      <SlideContent slideId={slideId} lang={lang} />
    </div>
  );
}

export default function ExportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExportContent />
    </Suspense>
  );
}
