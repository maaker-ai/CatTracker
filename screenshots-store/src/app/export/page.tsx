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

const LOCALIZED_SLIDES: Record<string, SlideText[]> = {
  en: [
    { tagline: "Your Cat's", subtitle: "Health Diary", caption: "Track meals, hydration, mood\nand bathroom visits daily" },
    { tagline: "Log in", subtitle: "Seconds", caption: "Quick entry with smart defaults\nPre-filled with today's data" },
    { tagline: "Spot Trends", subtitle: "Early", caption: "Weekly health insights\nCatch changes before they matter" },
    { tagline: "Know Your", subtitle: "Cat Better", caption: "Complete health profile\nWeight history at a glance" },
    { tagline: "Unlock", subtitle: "Everything", caption: "Multi-cat support, PDF reports\nCustom reminders & more" },
  ],
  "zh-Hans": [
    { tagline: "猫咪的", subtitle: "健康日记", caption: "每日记录饮食、饮水、心情\n和如厕情况" },
    { tagline: "秒速", subtitle: "记录", caption: "智能默认值快速录入\n自动预填今日数据" },
    { tagline: "及早发现", subtitle: "趋势变化", caption: "每周健康洞察\n在问题出现前捕捉变化" },
    { tagline: "更了解", subtitle: "你的猫", caption: "完整健康档案\n体重变化一目了然" },
    { tagline: "解锁", subtitle: "全部功能", caption: "多猫支持、PDF 报告\n自定义提醒等更多功能" },
  ],
  "zh-Hant": [
    { tagline: "貓咪的", subtitle: "健康日記", caption: "每日記錄飲食、飲水、心情\n和如廁情況" },
    { tagline: "秒速", subtitle: "記錄", caption: "智慧預設值快速錄入\n自動預填今日資料" },
    { tagline: "及早發現", subtitle: "趨勢變化", caption: "每週健康洞察\n在問題出現前捕捉變化" },
    { tagline: "更了解", subtitle: "你的貓", caption: "完整健康檔案\n體重變化一目了然" },
    { tagline: "解鎖", subtitle: "全部功能", caption: "多貓支援、PDF 報告\n自訂提醒等更多功能" },
  ],
  ja: [
    { tagline: "愛猫の", subtitle: "健康日記", caption: "食事・水分・気分・トイレを\n毎日かんたん記録" },
    { tagline: "数秒で", subtitle: "記録完了", caption: "スマートな初期値で素早く入力\n今日のデータを自動入力" },
    { tagline: "変化を", subtitle: "早期発見", caption: "週間ヘルスレポート\n問題になる前に気づく" },
    { tagline: "もっと", subtitle: "猫を知る", caption: "完全な健康プロフィール\n体重推移をひと目で確認" },
    { tagline: "すべてを", subtitle: "アンロック", caption: "複数猫対応・PDF レポート\nカスタムリマインダーなど" },
  ],
  ko: [
    { tagline: "고양이의", subtitle: "건강 일기", caption: "매일 식사, 수분, 기분\n화장실 기록을 추적하세요" },
    { tagline: "몇 초 만에", subtitle: "기록 완료", caption: "스마트 기본값으로 빠른 입력\n오늘 데이터 자동 채우기" },
    { tagline: "변화를", subtitle: "조기 발견", caption: "주간 건강 인사이트\n문제가 되기 전에 파악" },
    { tagline: "고양이를", subtitle: "더 잘 알기", caption: "완전한 건강 프로필\n체중 변화 한눈에 확인" },
    { tagline: "모든 기능", subtitle: "잠금 해제", caption: "다묘 지원, PDF 보고서\n맞춤 알림 등" },
  ],
  de: [
    { tagline: "Das Gesundheits-", subtitle: "tagebuch", caption: "Mahlzeiten, Trinken, Stimmung\nund Toilettenbesuche erfassen" },
    { tagline: "In Sekunden", subtitle: "erfassen", caption: "Schnelle Eingabe mit Standardwerten\nHeutige Daten vorausgefullt" },
    { tagline: "Trends", subtitle: "fruh erkennen", caption: "Wochentliche Einblicke\nVeranderungen rechtzeitig bemerken" },
    { tagline: "Kenne deine", subtitle: "Katze besser", caption: "Vollstandiges Gesundheitsprofil\nGewichtsverlauf auf einen Blick" },
    { tagline: "Alles", subtitle: "freischalten", caption: "Mehrere Katzen, PDF-Berichte\nErinnerungen & mehr" },
  ],
  fr: [
    { tagline: "Le journal", subtitle: "sante de votre chat", caption: "Suivez repas, hydratation\nhumeur et toilettes chaque jour" },
    { tagline: "Notez en", subtitle: "quelques secondes", caption: "Saisie rapide avec valeurs par defaut\nDonnees du jour pre-remplies" },
    { tagline: "Reperer les", subtitle: "tendances tot", caption: "Apercu hebdomadaire\nDetectez les changements a temps" },
    { tagline: "Mieux connaitre", subtitle: "votre chat", caption: "Profil sante complet\nHistorique de poids en un clin d'oeil" },
    { tagline: "Tout", subtitle: "debloquer", caption: "Multi-chats, rapports PDF\nRappels personnalises & plus" },
  ],
  es: [
    { tagline: "El diario de", subtitle: "salud de tu gato", caption: "Registra comidas, hidratacion\nhumor y visitas al bano" },
    { tagline: "Registra en", subtitle: "segundos", caption: "Entrada rapida con valores predeterminados\nDatos de hoy prellenados" },
    { tagline: "Detecta", subtitle: "tendencias", caption: "Informes semanales\nCapta cambios a tiempo" },
    { tagline: "Conoce mejor", subtitle: "a tu gato", caption: "Perfil de salud completo\nHistorial de peso de un vistazo" },
    { tagline: "Desbloquea", subtitle: "todo", caption: "Multi-gato, informes PDF\nRecordatorios y mas" },
  ],
  ru: [
    { tagline: "Дневник", subtitle: "здоровья кота", caption: "Питание, гидратация, настроение\nи туалет — каждый день" },
    { tagline: "Запись за", subtitle: "секунды", caption: "Быстрый ввод с умными значениями\nДанные за сегодня предзаполнены" },
    { tagline: "Замечай", subtitle: "тренды рано", caption: "Недельные отчёты\nЗамечай изменения вовремя" },
    { tagline: "Знай своего", subtitle: "кота лучше", caption: "Полный профиль здоровья\nИстория веса на одном экране" },
    { tagline: "Разблокируй", subtitle: "всё", caption: "Несколько котов, PDF-отчёты\nНапоминания и другое" },
  ],
  it: [
    { tagline: "Il diario", subtitle: "salute del gatto", caption: "Pasti, idratazione, umore\ne visite alla lettiera ogni giorno" },
    { tagline: "Registra in", subtitle: "pochi secondi", caption: "Inserimento rapido con valori predefiniti\nDati di oggi precompilati" },
    { tagline: "Individua", subtitle: "le tendenze", caption: "Report settimanali\nCogli i cambiamenti per tempo" },
    { tagline: "Conosci meglio", subtitle: "il tuo gatto", caption: "Profilo salute completo\nStorico peso a colpo d'occhio" },
    { tagline: "Sblocca", subtitle: "tutto", caption: "Multi-gatto, report PDF\nPromemoria personalizzati & altro" },
  ],
  ar: [
    { tagline: "مذكرة صحة", subtitle: "قطتك", caption: "تتبع الوجبات والماء والمزاج\nوزيارات الحمام يومياً" },
    { tagline: "سجل في", subtitle: "ثوانٍ", caption: "إدخال سريع بقيم ذكية\nبيانات اليوم معبأة مسبقاً" },
    { tagline: "اكتشف", subtitle: "التغييرات مبكراً", caption: "تقارير أسبوعية\nالتقط التغييرات قبل أن تهم" },
    { tagline: "اعرف قطتك", subtitle: "بشكل أفضل", caption: "ملف صحي كامل\nتاريخ الوزن في لمحة" },
    { tagline: "افتح", subtitle: "كل شيء", caption: "دعم عدة قطط، تقارير PDF\nتذكيرات مخصصة والمزيد" },
  ],
  id: [
    { tagline: "Buku Harian", subtitle: "Kesehatan Kucing", caption: "Catat makan, minum, mood\ndan kunjungan toilet harian" },
    { tagline: "Catat dalam", subtitle: "Hitungan Detik", caption: "Input cepat dengan nilai default\nData hari ini otomatis terisi" },
    { tagline: "Deteksi Tren", subtitle: "Lebih Awal", caption: "Wawasan kesehatan mingguan\nTangkap perubahan sebelum terlambat" },
    { tagline: "Kenali Kucing", subtitle: "Anda Lebih Baik", caption: "Profil kesehatan lengkap\nRiwayat berat badan sekilas" },
    { tagline: "Buka Semua", subtitle: "Fitur", caption: "Multi-kucing, laporan PDF\nPengingat kustom & lainnya" },
  ],
};

const slideConfigs = [
  { id: 1, bg: "linear-gradient(160deg, #F97316 0%, #EA580C 50%, #C2410C 100%)", screenSlide: "dashboard" },
  { id: 2, bg: "linear-gradient(160deg, #D97706 0%, #B45309 50%, #92400E 100%)", screenSlide: "log" },
  { id: 3, bg: "linear-gradient(160deg, #059669 0%, #047857 50%, #065F46 100%)", screenSlide: "timeline" },
  { id: 4, bg: "linear-gradient(160deg, #7C3AED 0%, #6D28D9 50%, #5B21B6 100%)", screenSlide: "profile" },
  { id: 5, bg: "linear-gradient(160deg, #1E293B 0%, #0F172A 50%, #020617 100%)", screenSlide: "settings" },
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

  return (
    <div
      style={{
        width: W,
        height: H,
        background: slide.bg,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "100px 80px 0",
      }}
    >
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      {/* App icon (hero only) */}
      {isHeroSlide && (
        <div style={{ width: 140, height: 140, borderRadius: 32, overflow: "hidden", marginBottom: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <img src="/icon.png" alt="CatTracker" style={{ width: 140, height: 140, objectFit: "cover" }} />
        </div>
      )}

      {/* Heading */}
      <div
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
          fontSize: 116,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          lineHeight: 1.05,
          letterSpacing: "-2px",
          marginBottom: 16,
          textShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {slide.tagline}
        <br />
        <span style={{ color: isHeroSlide ? "#FED7AA" : slideId === 3 ? "#A7F3D0" : slideId === 4 ? "#DDD6FE" : "#FDE68A" }}>
          {slide.subtitle}
        </span>
      </div>

      {/* Caption */}
      <div
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
          fontSize: 48,
          color: "rgba(255,255,255,0.70)",
          textAlign: "center",
          lineHeight: 1.5,
          marginBottom: 48,
          whiteSpace: "pre-line",
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
