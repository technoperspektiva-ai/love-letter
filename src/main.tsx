import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Theme = "starry" | "rose" | "ocean" | "golden";

type FormState = {
  recipient: string;
  opener: string;
  title: string;
  message: string;
  signature: string;
  theme: Theme;
  unlockMode: "now" | "minutes" | "date";
  minutes: number;
  date: string;
};

const defaultForm: FormState = {
  recipient: "",
  opener: "Нажми на конверт",
  title: "Для тебя",
  message: "",
  signature: "",
  theme: "starry",
  unlockMode: "now",
  minutes: 20,
  date: "",
};

function App() {
  const path = location.pathname;
  const secret = path.startsWith("/l/") ? decodeURIComponent(path.slice(3)) : null;
  return secret ? <LetterViewer secret={secret} /> : <Creator />;
}

function Creator() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [step, setStep] = useState(0);
  const [portrait, setPortrait] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [error, setError] = useState("");

  const unlockAt = useMemo(() => {
    if (form.unlockMode === "now") return null;
    if (form.unlockMode === "minutes") return Date.now() + Math.max(1, form.minutes) * 60_000;
    if (form.unlockMode === "date" && form.date) return new Date(form.date).getTime();
    return null;
  }, [form.unlockMode, form.minutes, form.date]);

  const update = (key: keyof FormState, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const publish = async () => {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/letters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, unlockAt }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Не удалось создать письмо");

      if (portrait) {
        await fetch(`/api/letters/${data.secret}/portrait`, {
          method: "POST",
          headers: { "content-type": portrait.type || "image/png" },
          body: portrait,
        });
      }
      const url = `${location.origin}${data.sharePath}`;
      setShareUrl(url);
      setStep(5);
    } catch (e: any) {
      setError(e.message || "Что-то пошло не так");
    } finally {
      setBusy(false);
    }
  };

  const canContinue = [
    !!form.recipient.trim(),
    !!form.message.trim(),
    true,
    true,
    true,
  ][step] ?? true;

  return (
    <main className={`app theme-${form.theme}`}>
      <Ambient />
      <header className="topbar shell">
        <a className="brand" href="/">
          <span className="seal">L</span>
          <span>Love Letter</span>
        </a>
        <span className="free-badge">бесплатно</span>
      </header>

      <section className="shell hero">
        <div className="hero-copy">
          <div className="eyebrow">Письмо, которое дождётся</div>
          <h1>Скажи важное красиво.</h1>
          <p>Создай цифровой конверт, добавь письмо и фото, выбери момент открытия — и отправь одну секретную ссылку.</p>
        </div>
        <EnvelopeMini theme={form.theme} recipient={form.recipient || "кому-то важному"} />
      </section>

      <section className="shell creator">
        <div className="steps">
          {["Кому", "Письмо", "Тема", "Фото", "Когда", "Готово"].map((s, i) =>
            <button key={s} className={i === step ? "active" : i < step ? "done" : ""} onClick={() => i <= step && setStep(i)}>
              <span>{i < step ? "✓" : i + 1}</span>{s}
            </button>
          )}
        </div>

        <div className="card">
          {step === 0 && <StepRecipient form={form} update={update} />}
          {step === 1 && <StepMessage form={form} update={update} />}
          {step === 2 && <StepTheme form={form} update={update} />}
          {step === 3 && <StepPortrait onBlob={setPortrait} />}
          {step === 4 && <StepTime form={form} update={update} />}
          {step === 5 && <Done shareUrl={shareUrl} />}

          {error && <div className="error">{error}</div>}

          {step < 5 && (
            <div className="actions">
              {step > 0 && <button className="btn ghost" onClick={() => setStep(step - 1)}>Назад</button>}
              {step < 4
                ? <button className="btn primary" disabled={!canContinue} onClick={() => setStep(step + 1)}>Продолжить</button>
                : <button className="btn primary" disabled={busy || !form.message.trim()} onClick={publish}>
                    {busy ? "Создаю…" : "Создать секретную ссылку"}
                  </button>
              }
            </div>
          )}
        </div>
      </section>

      <footer className="shell footer">
        <span>Love Letter</span>
        <span>Без подписки. Без платных тем. Без рекламы.</span>
      </footer>
    </main>
  );
}

function StepRecipient({ form, update }: any) {
  return <div className="step-panel">
    <div className="step-title"><span>01</span><div><h2>Кому это письмо?</h2><p>Имя появится прямо на конверте.</p></div></div>
    <label>Имя получателя<input autoFocus value={form.recipient} maxLength={60} onChange={e => update("recipient", e.target.value)} placeholder="Например, Малика" /></label>
    <label>Подсказка под конвертом<input value={form.opener} maxLength={80} onChange={e => update("opener", e.target.value)} placeholder="Нажми на конверт" /></label>
  </div>;
}

function StepMessage({ form, update }: any) {
  return <div className="step-panel">
    <div className="step-title"><span>02</span><div><h2>Напиши самое важное</h2><p>Здесь нет правильных слов — только твои.</p></div></div>
    <label>Заголовок<input value={form.title} maxLength={120} onChange={e => update("title", e.target.value)} placeholder="Для тебя" /></label>
    <label>Письмо<textarea autoFocus value={form.message} maxLength={6000} onChange={e => update("message", e.target.value)} placeholder="Я давно хотел(а) сказать тебе…" /></label>
    <label>Подпись<input value={form.signature} maxLength={80} onChange={e => update("signature", e.target.value)} placeholder="С любовью…" /></label>
    <div className="counter">{form.message.length}/6000</div>
  </div>;
}

const themeData: {id: Theme; title: string; subtitle: string}[] = [
  {id:"starry", title:"Звёздная ночь", subtitle:"глубокий космос и тихий свет"},
  {id:"rose", title:"Ночная роза", subtitle:"тёплый винный градиент"},
  {id:"ocean", title:"Полночный океан", subtitle:"прохладная синяя глубина"},
  {id:"golden", title:"Золотой час", subtitle:"мягкое янтарное сияние"},
];

function StepTheme({ form, update }: any) {
  return <div className="step-panel">
    <div className="step-title"><span>03</span><div><h2>Выбери настроение</h2><p>Все темы бесплатные.</p></div></div>
    <div className="theme-grid">
      {themeData.map(t => <button key={t.id} className={`theme-tile ${t.id} ${form.theme === t.id ? "selected":""}`} onClick={() => update("theme", t.id)}>
        <div className="theme-preview"><i></i><i></i><i></i></div>
        <strong>{t.title}</strong><small>{t.subtitle}</small>
      </button>)}
    </div>
  </div>;
}

function StepPortrait({ onBlob }: {onBlob:(b:Blob|null)=>void}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [has, setHas] = useState(false);
  const [mode, setMode] = useState<"dots"|"mono">("dots");

  const process = async (file: File) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    const size = 560;
    const canvas = canvasRef.current!;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.clearRect(0,0,size,size);
    ctx.drawImage(img, (size-w)/2, (size-h)/2, w, h);
    const d = ctx.getImageData(0,0,size,size);
    for (let i=0;i<d.data.length;i+=4) {
      const g = d.data[i]*.299 + d.data[i+1]*.587 + d.data[i+2]*.114;
      const q = mode === "dots" ? Math.round(g/42)*42 : g > 125 ? 226 : 35;
      d.data[i]=q; d.data[i+1]=Math.max(15,q*.9); d.data[i+2]=Math.max(30,q*.98);
    }
    ctx.putImageData(d,0,0);
    canvas.toBlob(b => b && onBlob(b), "image/webp", .78);
    setHas(true);
    URL.revokeObjectURL(img.src);
  };

  return <div className="step-panel">
    <div className="step-title"><span>04</span><div><h2>Добавь портрет</h2><p>Необязательно. Фото стилизуется прямо в браузере — бесплатно.</p></div></div>
    <div className="portrait-layout">
      <label className="upload">
        <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && process(e.target.files[0])}/>
        <span className="upload-icon">＋</span>
        <strong>{has ? "Выбрать другое фото" : "Выбрать фото"}</strong>
        <small>JPG, PNG, WEBP • до 1.5 МБ после обработки</small>
      </label>
      <div className={`canvas-wrap ${has ? "show":""}`}><canvas ref={canvasRef}/></div>
    </div>
    <div className="segmented">
      <button className={mode==="dots"?"on":""} onClick={() => setMode("dots")}>Мягкий растр</button>
      <button className={mode==="mono"?"on":""} onClick={() => setMode("mono")}>Контраст</button>
    </div>
    <button className="text-btn" onClick={() => {onBlob(null); setHas(false)}}>Пропустить фото</button>
  </div>;
}

function StepTime({ form, update }: any) {
  return <div className="step-panel">
    <div className="step-title"><span>05</span><div><h2>Когда можно открыть?</h2><p>Можно сразу или превратить письмо в маленькую капсулу времени.</p></div></div>
    <div className="time-options">
      <button className={form.unlockMode==="now"?"selected":""} onClick={() => update("unlockMode","now")}><b>Сразу</b><span>ссылка работает моментально</span></button>
      <button className={form.unlockMode==="minutes"?"selected":""} onClick={() => update("unlockMode","minutes")}><b>Через время</b><span>от 1 минуты</span></button>
      <button className={form.unlockMode==="date"?"selected":""} onClick={() => update("unlockMode","date")}><b>В дату</b><span>день рождения, годовщина…</span></button>
    </div>
    {form.unlockMode==="minutes" && <label>Через сколько минут?<input type="number" min="1" max="525600" value={form.minutes} onChange={e => update("minutes", Number(e.target.value))}/></label>}
    {form.unlockMode==="date" && <label>Дата и время<input type="datetime-local" value={form.date} onChange={e => update("date",e.target.value)}/></label>}
    <div className="privacy-note">🔐 Ссылка случайная и не индексируется. Текст письма выдаётся API только после времени открытия.</div>
  </div>;
}

function Done({ shareUrl }: {shareUrl:string}) {
  const [copied,setCopied]=useState(false);
  const copy = async () => { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(()=>setCopied(false),1600); };
  const tg = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Для тебя кое-что есть 💌")}`;
  return <div className="step-panel done-panel">
    <div className="done-seal">✓</div>
    <h2>Письмо ждёт получателя</h2>
    <p>Отправь эту ссылку. Всё остальное произойдёт внутри.</p>
    <div className="share-box"><input readOnly value={shareUrl}/><button onClick={copy}>{copied?"Скопировано":"Копировать"}</button></div>
    <div className="share-actions">
      <a className="btn primary" href={tg} target="_blank">Отправить в Telegram</a>
      <a className="btn ghost" href={shareUrl} target="_blank">Открыть превью</a>
    </div>
  </div>;
}

function LetterViewer({ secret }: {secret:string}) {
  const [data,setData]=useState<any>(null);
  const [opened,setOpened]=useState(false);
  const [remaining,setRemaining]=useState("");
  const [error,setError]=useState("");

  useEffect(() => {
    fetch(`/api/letters/${encodeURIComponent(secret)}`)
      .then(async r => { const d=await r.json(); if(!r.ok) throw new Error(d.error); setData(d); })
      .catch(()=>setError("Письмо не найдено"));
  },[secret]);

  useEffect(() => {
    if (!data?.locked) return;
    const tick=()=>{
      const ms=Math.max(0,data.unlockAt-Date.now());
      if(ms<=0){ location.reload(); return; }
      const d=Math.floor(ms/86400000), h=Math.floor(ms/3600000)%24, m=Math.floor(ms/60000)%60, s=Math.floor(ms/1000)%60;
      setRemaining(`${d?d+"д ": ""}${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    };
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id);
  },[data]);

  const open=async()=>{
    if(data.locked)return;
    setOpened(true);
    fetch(`/api/letters/${encodeURIComponent(secret)}/open`,{method:"POST"}).catch(()=>{});
  };

  if(error) return <main className="viewer theme-starry"><Ambient/><div className="viewer-center"><div className="viewer-card"><h1>{error}</h1><a href="/">Создать своё письмо</a></div></div></main>;
  if(!data) return <main className="viewer theme-starry"><Ambient/><div className="loader">Зажигаем звёзды…</div></main>;

  return <main className={`viewer theme-${data.theme}`}>
    <Ambient/>
    <a href="/" className="viewer-brand"><span className="seal">L</span>Love Letter</a>
    <div className={`viewer-center ${opened?"opened":""}`}>
      {!opened ? <div className="closed-scene">
        <div className="for-you">это тебе</div>
        <button className={`envelope ${data.locked?"locked":""}`} onClick={open} aria-label="Открыть письмо">
          <div className="env-back"></div><div className="env-flap"></div><div className="env-front"></div>
          <div className="wax">{data.recipient.slice(0,1).toUpperCase()}</div>
          <div className="recipient">{data.recipient}</div>
        </button>
        {data.locked
          ? <><div className="locked-text">Откроется через</div><div className="countdown">{remaining}</div></>
          : <div className="tap">{data.opener}</div>
        }
      </div> : <article className="letter-paper">
        <div className="letter-kicker">для {data.recipient}</div>
        <h1>{data.title || "Для тебя"}</h1>
        {data.portraitUrl && <img className="portrait-final" src={data.portraitUrl} alt="Портрет"/>}
        <div className="letter-text">{data.message}</div>
        {data.signature && <div className="signature">{data.signature}</div>}
        <div className="letter-end">♡</div>
      </article>}
    </div>
  </main>;
}

function EnvelopeMini({theme,recipient}:{theme:Theme;recipient:string}) {
  return <div className={`mini-scene ${theme}`}>
    <div className="mini-stars">✦ · ✧ · ✦</div>
    <div className="mini-envelope"><div className="mini-flap"></div><div className="mini-wax">{recipient.slice(0,1).toUpperCase()}</div><span>{recipient}</span></div>
    <small>секретная ссылка • открыть когда придёт время</small>
  </div>;
}

function Ambient() {
  return <div className="ambient" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
}

createRoot(document.getElementById("root")!).render(<App />);
